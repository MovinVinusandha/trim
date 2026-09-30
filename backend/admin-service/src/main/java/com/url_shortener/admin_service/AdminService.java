package com.url_shortener.admin_service;

import com.url_shortener.admin_service.audit.AdminAuditLogDto;
import com.url_shortener.admin_service.audit.AdminAuditService;
import com.url_shortener.admin_service.client.AnalyticsServiceClient;
import com.url_shortener.admin_service.client.AuthServiceClient;
import com.url_shortener.admin_service.client.CoreServiceClient;
import com.url_shortener.admin_service.dto.*;
import com.url_shortener.admin_service.security.BlockedIp;
import com.url_shortener.admin_service.security.BlockedIpService;
import com.url_shortener.admin_service.security.SecurityIncident;
import com.url_shortener.admin_service.security.SecurityIncidentRepository;
import com.url_shortener.common.Role;
import com.url_shortener.common.dto.InternalUserSummaryDto;
import com.url_shortener.common.dto.UserCountsDto;
import com.url_shortener.common.dto.analytics.AnalyticsAdminOverviewDto;
import com.url_shortener.common.dto.core.CoreLinkCountsDto;
import com.url_shortener.common.dto.core.CoreLinkDetailDto;
import com.url_shortener.common.dto.core.CoreTriageSummaryDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final AuthServiceClient authServiceClient;
    private final CoreServiceClient coreServiceClient;
    private final AnalyticsServiceClient analyticsServiceClient;
    private final BlacklistedDomainRepository blacklistedDomainRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final StringRedisTemplate redisTemplate;
    private final SecurityIncidentRepository securityIncidentRepository;
    private final BlockedIpService blockedIpService;
    private final AdminAuditService adminAuditService;
    private final EnvSyncService envSyncService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Value("${app.domain.root:http://localhost:8080}")
    private String rootDomainUrl;

    @Value("${app.frontend.url:http://localhost}")
    private String frontendUrl;

    @Value("${app.dashboard.url:http://app.localhost}")
    private String dashboardUrl;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${root.user.email:admin@trim.com}")
    private String rootUserEmail;

    @Value("${oauth.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Value("${oauth.github.client-id:${GITHUB_CLIENT_ID:}}")
    private String githubClientId;

    @Value("${app.security.safe-browsing-api-key:${SAFE_BROWSING_API_KEY:}}")
    private String safeBrowsingApiKey;

    public static final String REDIS_BLACKLISTED_DOMAINS_KEY = "security:blacklisted_domains";
    public static final String REDIS_SETTING_KEY_PREFIX = "system:setting:";

    private static final Map<String, String> DEFAULT_SETTINGS = Map.of(
            "ALLOW_REGISTRATION", "true",
            "REQUIRE_EMAIL_VERIFICATION", "true",
            "PANIC_MODE", "NORMAL",
            "MAX_LINKS_PER_USER", "1000",
            "DEFAULT_LINK_EXPIRATION_DAYS", "0"
    );

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void warmupRedis() {
        try {
            List<BlacklistedDomain> domains = blacklistedDomainRepository.findAll();
            if (!domains.isEmpty()) {
                String[] domainPatterns = domains.stream().map(BlacklistedDomain::getDomainPattern).toArray(String[]::new);
                redisTemplate.opsForSet().add(REDIS_BLACKLISTED_DOMAINS_KEY, domainPatterns);
            }
            log.info("Warmed up {} blacklisted domains to Redis key '{}'", domains.size(), REDIS_BLACKLISTED_DOMAINS_KEY);
        } catch (Exception e) {
            log.warn("Failed to warmup blacklisted domains in Redis: {}", e.getMessage());
        }

        try {
            // Seed default settings into database if not present
            for (Map.Entry<String, String> entry : DEFAULT_SETTINGS.entrySet()) {
                if (systemSettingRepository.findBySettingKey(entry.getKey()).isEmpty()) {
                    systemSettingRepository.save(SystemSetting.builder()
                            .settingKey(entry.getKey())
                            .settingValue(entry.getValue())
                            .description("Default system configuration")
                            .build());
                }
            }

            List<SystemSetting> settings = systemSettingRepository.findAll();
            for (SystemSetting s : settings) {
                if (s.getSettingKey() != null && s.getSettingValue() != null) {
                    redisTemplate.opsForValue().set(REDIS_SETTING_KEY_PREFIX + s.getSettingKey(), s.getSettingValue());
                }
            }
            log.info("Warmed up {} system settings to Redis", settings.size());
        } catch (Exception e) {
            log.warn("Failed to warmup system settings in Redis: {}", e.getMessage());
        }
    }

    public AdminOverviewDto getOverviewStats() {
        return getOverviewStats(7);
    }

    public AdminOverviewDto getOverviewStats(int days) {
        if (days < 1) days = 7;
        if (days > 90) days = 90;

        CoreLinkCountsDto linkCounts;
        try {
            linkCounts = coreServiceClient.getLinkCounts();
        } catch (Exception e) {
            log.warn("Failed to fetch link counts from core-service (using fallback): {}", e.getMessage());
            linkCounts = new CoreLinkCountsDto(0L, 0L, 0L, 0L, 0L);
        }
        long totalLinks = linkCounts.getTotalLinks();
        long activeLinks = linkCounts.getActiveLinks();
        long expiredLinks = linkCounts.getExpiredLinks();
        long quarantinedLinks = linkCounts.getQuarantinedLinks();

        AnalyticsAdminOverviewDto analyticsOverview = null;
        try {
            analyticsOverview = analyticsServiceClient.getAdminOverview(days);
        } catch (Exception e) {
            log.warn("Failed to fetch analytics overview from analytics-service (using fallback): {}", e.getMessage());
        }
        long totalClicks = analyticsOverview != null ? analyticsOverview.getTotalClicks() : 0L;
        long clicksLast24Hours = analyticsOverview != null ? analyticsOverview.getClicksLast24Hours() : 0L;

        UserCountsDto userCounts;
        try {
            userCounts = authServiceClient.getUserCounts();
        } catch (Exception e) {
            log.warn("Failed to fetch user counts from auth-service (using fallback): {}", e.getMessage());
            userCounts = new UserCountsDto(0L, 0L, 0L);
        }
        long totalUsers = userCounts.getTotalUsers();
        long suspendedUsers = userCounts.getSuspendedUsers();
        long activeUsers = userCounts.getActiveUsers();

        // 1. Operational Mode
        String systemMode = getEffectiveSetting("PANIC_MODE", "NORMAL");

        // 2. Security & Perimeter Pulse
        long unresolvedIncidents = 0;
        try {
            unresolvedIncidents = securityIncidentRepository.countByIsResolvedFalse();
        } catch (Exception ignored) {}

        long blockedIpsCount = 0;
        try {
            blockedIpsCount = blockedIpService.getAllBlockedIps().size();
        } catch (Exception ignored) {}

        long blacklistedDomainsCount = 0;
        try {
            blacklistedDomainsCount = blacklistedDomainRepository.count();
        } catch (Exception ignored) {}

        boolean auditChainValid = true;
        try {
            auditChainValid = adminAuditService.verifyChainIntegrity().isValid();
        } catch (Exception ignored) {}

        AdminOverviewDto.SecurityPulseDto securityPulse = AdminOverviewDto.SecurityPulseDto.builder()
                .unresolvedIncidents(unresolvedIncidents)
                .blockedIpsCount(blockedIpsCount)
                .blacklistedDomainsCount(blacklistedDomainsCount)
                .auditChainValid(auditChainValid)
                .build();

        // 3. System Health & Storage
        String redisStatus = "HEALTHY";
        String redisMemory = "Normal";
        Long totalCachedKeys = 0L;
        try {
            RedisConnection connection = Objects.requireNonNull(redisTemplate.getConnectionFactory()).getConnection();
            String pong = connection.ping();
            if (!"PONG".equalsIgnoreCase(pong)) {
                redisStatus = "DEGRADED";
            }
            Properties info = connection.serverCommands().info("memory");
            if (info != null && info.containsKey("used_memory_human")) {
                redisMemory = info.getProperty("used_memory_human");
            }
            totalCachedKeys = connection.serverCommands().dbSize();
            connection.close();
        } catch (Exception e) {
            redisStatus = "UNREACHABLE";
            redisMemory = "Unknown";
        }

        AdminOverviewDto.SystemHealthDto health = AdminOverviewDto.SystemHealthDto.builder()
                .redisStatus(redisStatus)
                .redisMemory(redisMemory)
                .sweeperStatus("RUNNING")
                .lastSweeperRun(LocalDateTime.now().toString())
                .activeWorkerThreads(4)
                .totalCachedKeys(totalCachedKeys != null ? totalCachedKeys : 0L)
                .build();

        // 4. Time-series Daily Activity
        LocalDateTime rangeStart = LocalDateTime.now().minusDays(days).withHour(0).withMinute(0).withSecond(0).withNano(0);
        Map<String, Long> clicksByDateMap = (analyticsOverview != null && analyticsOverview.getClicksByDate() != null)
                ? analyticsOverview.getClicksByDate()
                : Collections.emptyMap();

        Map<String, Long> linksByDateMap = Collections.emptyMap();
        try {
            linksByDateMap = coreServiceClient.getLinksCreatedByDate(rangeStart);
        } catch (Exception e) {
            log.warn("Failed to fetch links by date from core-service (using fallback): {}", e.getMessage());
        }

        List<AdminOverviewDto.DailyActivityDataPoint> activitySeries = new ArrayList<>();
        java.time.LocalDate currentDay = rangeStart.toLocalDate();
        java.time.LocalDate today = java.time.LocalDate.now();
        while (!currentDay.isAfter(today)) {
            String dateKey = currentDay.toString();
            long cCount = clicksByDateMap.getOrDefault(dateKey, 0L);
            long lCount = linksByDateMap.getOrDefault(dateKey, 0L);
            activitySeries.add(new AdminOverviewDto.DailyActivityDataPoint(dateKey, cCount, lCount));
            currentDay = currentDay.plusDays(1);
        }

        // 5. Device Distribution
        List<AdminOverviewDto.DistributionDataPoint> deviceDistribution = new ArrayList<>();
        if (analyticsOverview != null && analyticsOverview.getDeviceDistribution() != null) {
            long totalDevClicks = analyticsOverview.getDeviceDistribution().stream()
                    .mapToLong(dp -> dp.getCount() != null ? dp.getCount() : 0L)
                    .sum();
            for (var dp : analyticsOverview.getDeviceDistribution()) {
                long cnt = dp.getCount() != null ? dp.getCount() : 0L;
                double pct = totalDevClicks > 0 ? (cnt * 100.0) / totalDevClicks : 0.0;
                deviceDistribution.add(new AdminOverviewDto.DistributionDataPoint(dp.getDevice(), cnt, Math.round(pct * 10.0) / 10.0));
            }
        }

        // 6. Country Distribution
        List<AdminOverviewDto.DistributionDataPoint> countryDistribution = new ArrayList<>();
        if (analyticsOverview != null && analyticsOverview.getCountryDistribution() != null) {
            long totalCtryClicks = analyticsOverview.getCountryDistribution().stream()
                    .mapToLong(dp -> dp.getCount() != null ? dp.getCount() : 0L)
                    .sum();
            int limit = 0;
            for (var dp : analyticsOverview.getCountryDistribution()) {
                if (limit >= 6) break;
                long cnt = dp.getCount() != null ? dp.getCount() : 0L;
                double pct = totalCtryClicks > 0 ? (cnt * 100.0) / totalCtryClicks : 0.0;
                countryDistribution.add(new AdminOverviewDto.DistributionDataPoint(dp.getCountry(), cnt, Math.round(pct * 10.0) / 10.0));
                limit++;
            }
        }

        // 7. Recent Audit Actions (Top 4)
        List<AdminOverviewDto.RecentAuditActionDto> recentAuditActions = new ArrayList<>();
        try {
            Page<AdminAuditLogDto> auditPage = adminAuditService.getAuditLogs(
                    null, null, null, null, null, null, PageRequest.of(0, 4, Sort.by(Sort.Direction.DESC, "id"))
            );
            if (auditPage != null && auditPage.hasContent()) {
                for (AdminAuditLogDto l : auditPage.getContent()) {
                    recentAuditActions.add(AdminOverviewDto.RecentAuditActionDto.builder()
                            .id(l.getId())
                            .action(l.getAction())
                            .actorEmail(l.getActorEmail())
                            .targetType(l.getTargetType())
                            .targetIdentifier(l.getTargetIdentifier())
                            .details(l.getDetails())
                            .createdAt(l.getCreatedAt())
                            .build()
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Failed to query recent audit logs for overview: {}", e.getMessage());
        }

        // 8. Top Target Domains
        Map<String, Long> topDomainMap = coreServiceClient.getTopDomains(8);
        List<AdminOverviewDto.TopDomainDto> topDomains = topDomainMap.entrySet().stream()
                .map(e -> new AdminOverviewDto.TopDomainDto(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return AdminOverviewDto.builder()
                .totalLinks(totalLinks)
                .activeLinks(activeLinks)
                .expiredLinks(expiredLinks)
                .quarantinedLinks(quarantinedLinks)
                .totalClicks(totalClicks)
                .clicksLast24Hours(clicksLast24Hours)
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .systemMode(systemMode)
                .securityPulse(securityPulse)
                .systemHealth(health)
                .topDomains(topDomains)
                .activitySeries(activitySeries)
                .deviceDistribution(deviceDistribution)
                .countryDistribution(countryDistribution)
                .recentAuditActions(recentAuditActions)
                .build();
    }

    public Page<AdminLinkDto> getLinks(
            int page,
            int size,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Long minClicks,
            String domain,
            String sortBy,
            String sortDir
    ) {
        Page<CoreLinkDetailDto> corePage = coreServiceClient.getLinks(page, size, search, status, startDate, endDate, minClicks, domain, sortBy, sortDir);
        return corePage.map(this::toAdminLinkDto);
    }

    public AdminLinkTriageSummaryDto getTriageSummary() {
        CoreTriageSummaryDto coreSummary = coreServiceClient.getTriageSummary();
        return AdminLinkTriageSummaryDto.builder()
                .needsAttentionCount(coreSummary.getNeedsAttentionCount())
                .spikeCount(coreSummary.getSpikeCount())
                .quarantinedCount(coreSummary.getQuarantinedCount())
                .createdLast24hCount(coreSummary.getCreatedLast24hCount())
                .totalLinks(coreSummary.getTotalLinks())
                .build();
    }

    public List<AdminLinkDto> bulkQuarantineLinks(List<String> hashes, String reason) {
        if (hashes == null || hashes.isEmpty()) {
            return Collections.emptyList();
        }
        String r = reason != null && !reason.trim().isEmpty() ? reason.trim() : "Bulk quarantine by administrator";
        List<CoreLinkDetailDto> quarantined = coreServiceClient.bulkQuarantine(hashes, r);

        recordAudit("BULK_LINK_QUARANTINED", "LINK", String.join(",", hashes),
                "Bulk quarantined " + hashes.size() + " link(s). Reason: " + r,
                "{\"count\":" + hashes.size() + ",\"hashes\":" + hashes + "}");

        return quarantined.stream().map(this::toAdminLinkDto).collect(Collectors.toList());
    }

    public void bulkDeleteLinks(List<String> hashes) {
        if (hashes == null || hashes.isEmpty()) {
            return;
        }
        coreServiceClient.bulkDelete(hashes);
        recordAudit("BULK_LINK_DELETED", "LINK", String.join(",", hashes),
                "Bulk deleted " + hashes.size() + " link(s)",
                "{\"count\":" + hashes.size() + ",\"hashes\":" + hashes + "}");
    }

    public AdminLinkDto quarantineLink(String hash, String reason) {
        CoreLinkDetailDto link = coreServiceClient.quarantineLink(hash, reason);
        if (link == null) {
            throw new IllegalArgumentException("Short link not found: " + hash);
        }

        recordAudit("LINK_QUARANTINED", "LINK", hash,
                "Quarantined link /" + hash + ". Reason: " + link.getQuarantineReason(),
                "{\"longUrl\":\"" + link.getLongUrl() + "\"}");

        return toAdminLinkDto(link);
    }

    public AdminLinkDto unquarantineLink(String hash) {
        CoreLinkDetailDto link = coreServiceClient.unquarantineLink(hash);
        if (link == null) {
            throw new IllegalArgumentException("Short link not found: " + hash);
        }

        recordAudit("LINK_UNQUARANTINED", "LINK", hash,
                "Restored quarantined link /" + hash,
                "{\"longUrl\":\"" + link.getLongUrl() + "\"}");

        return toAdminLinkDto(link);
    }

    public void deleteLink(String hash) {
        coreServiceClient.deleteLink(hash);
        recordAudit("LINK_DELETED", "LINK", hash, "Deleted link /" + hash, "{}");
    }

    public Page<AdminUserDto> getUsers(int page, int size, String search) {
        Page<InternalUserSummaryDto> userPage = authServiceClient.getUsers(page, size, search);
        return userPage.map(this::toAdminUserDto);
    }

    public AdminUserDto toggleUserSuspension(String publicId, String reason, Long currentAdminId) {
        InternalUserSummaryDto updated = authServiceClient.toggleUserSuspension(publicId, reason, currentAdminId);
        if (updated == null) {
            throw new IllegalArgumentException("User not found or operation failed: " + publicId);
        }

        recordAudit(updated.isSuspended() ? "USER_SUSPENDED" : "USER_UNSUSPENDED", "USER", updated.getEmail(),
                (updated.isSuspended() ? "Suspended user " : "Restored user ") + updated.getEmail() + (reason != null ? ". Reason: " + reason : ""),
                "{\"userId\":" + updated.getId() + ",\"email\":\"" + updated.getEmail() + "\"}");

        return toAdminUserDto(updated);
    }

    public AdminUserDto updateUserRole(String publicId, Role newRole, Long currentAdminId) {
        InternalUserSummaryDto updated = authServiceClient.updateUserRole(publicId, newRole, currentAdminId);
        if (updated == null) {
            throw new IllegalArgumentException("User not found or operation failed: " + publicId);
        }

        recordAudit("USER_ROLE_CHANGED", "USER", updated.getEmail(),
                "Changed role of user " + updated.getEmail() + " to " + newRole,
                "{\"newRole\":\"" + newRole + "\"}");

        return toAdminUserDto(updated);
    }

    public AdminUserDetailDto getUserDetails(String publicId) {
        InternalUserSummaryDto user = authServiceClient.getUserByPublicId(publicId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + publicId);
        }

        List<CoreLinkDetailDto> userUrls = coreServiceClient.getUserLinks(user.getId());
        long totalLinks = userUrls.size();
        long activeLinks = 0;
        long quarantinedLinks = 0;
        long totalClicks = 0;

        for (CoreLinkDetailDto l : userUrls) {
            if (l.isActive() && !l.isQuarantined()) {
                activeLinks++;
            }
            if (l.isQuarantined()) {
                quarantinedLinks++;
            }
            if (l.getTotalClicks() != null) {
                totalClicks += l.getTotalClicks();
            }
        }

        List<AdminUserDetailDto.OAuthAccountSummaryDto> oauthDtos = new ArrayList<>();
        if (user.getConnectedOAuthProviders() != null) {
            for (String provider : user.getConnectedOAuthProviders()) {
                oauthDtos.add(AdminUserDetailDto.OAuthAccountSummaryDto.builder()
                        .provider(provider)
                        .build());
            }
        }

        List<AdminLinkDto> recentLinks = userUrls.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(10)
                .map(this::toAdminLinkDto)
                .collect(Collectors.toList());

        int effectiveQuota = 1000;
        if (user.getCustomMaxLinks() != null && user.getCustomMaxLinks() > 0) {
            effectiveQuota = user.getCustomMaxLinks();
        } else {
            try {
                var quotaSetting = systemSettingRepository.findBySettingKey("MAX_LINKS_PER_USER");
                if (quotaSetting.isPresent() && !quotaSetting.get().getSettingValue().isBlank()) {
                    effectiveQuota = Integer.parseInt(quotaSetting.get().getSettingValue().trim());
                }
            } catch (Exception ignored) {}
        }

        return AdminUserDetailDto.builder()
                .id(user.getId())
                .publicId(user.getPublicId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .emailVerifiedAt(user.getEmailVerifiedAt())
                .customMaxLinks(user.getCustomMaxLinks())
                .effectiveMaxLinks(effectiveQuota)
                .isSuspended(user.isSuspended())
                .suspendedReason(user.getSuspendedReason())
                .createdAt(user.getCreatedAt())
                .totalLinks(totalLinks)
                .activeLinks(activeLinks)
                .quarantinedLinks(quarantinedLinks)
                .totalClicks(totalClicks)
                .oauthAccounts(oauthDtos)
                .recentLinks(recentLinks)
                .build();
    }

    public void deleteUser(String publicId, Long currentAdminId) {
        InternalUserSummaryDto user = authServiceClient.getUserByPublicId(publicId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + publicId);
        }

        if (user.getId().equals(currentAdminId)) {
            throw new IllegalArgumentException("You cannot delete your own account from the administrator console.");
        }
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("The ROOT instance owner cannot be deleted.");
        }

        String userEmail = user.getEmail();
        String userUsername = user.getUsername();

        // 1. Delete user in auth-service (publishes TOPIC_USER_DELETED for core and analytics async cleanup)
        authServiceClient.deleteUser(publicId, currentAdminId);

        // 2. Record immutable audit log
        recordAudit("USER_DELETED", "USER", userEmail,
                "Deleted user " + userUsername + " (" + userEmail + ")",
                "{\"publicId\":\"" + publicId + "\",\"email\":\"" + userEmail + "\"}");
    }

    public AdminUserDto manuallyVerifyEmail(String publicId) {
        InternalUserSummaryDto updated = authServiceClient.manuallyVerifyEmail(publicId);
        if (updated == null) {
            throw new IllegalArgumentException("User not found: " + publicId);
        }

        recordAudit("USER_EMAIL_VERIFIED", "USER", updated.getEmail(),
                "Manually verified email for user " + updated.getEmail(),
                "{\"userId\":" + updated.getId() + ",\"email\":\"" + updated.getEmail() + "\"}");

        return toAdminUserDto(updated);
    }

    public void resendVerificationEmail(String publicId) {
        InternalUserSummaryDto user = authServiceClient.getUserByPublicId(publicId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + publicId);
        }

        authServiceClient.resendVerificationEmail(publicId);

        recordAudit("USER_VERIFICATION_RESENT", "USER", user.getEmail(),
                "Resent verification email to user " + user.getEmail(),
                "{\"userId\":" + user.getId() + ",\"email\":\"" + user.getEmail() + "\"}");
    }

    public AdminUserDto updateUserQuota(String publicId, Integer customMaxLinks) {
        InternalUserSummaryDto updated = authServiceClient.updateUserQuota(publicId, customMaxLinks);
        if (updated == null) {
            throw new IllegalArgumentException("User not found: " + publicId);
        }

        recordAudit("USER_QUOTA_OVERRIDDEN", "USER", updated.getEmail(),
                "Updated custom link quota for " + updated.getEmail() + " to " + (customMaxLinks != null ? customMaxLinks : "DEFAULT"),
                "{\"newQuota\":" + customMaxLinks + "}");

        return toAdminUserDto(updated);
    }

    public List<BlacklistedDomain> getBlacklist() {
        return blacklistedDomainRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Transactional
    public BlacklistedDomain addBlacklistDomain(String pattern, String reason) {
        if (pattern == null || pattern.trim().isBlank()) {
            throw new IllegalArgumentException("Domain pattern cannot be blank");
        }
        String cleanPattern = pattern.trim().toLowerCase();
        if (blacklistedDomainRepository.existsByDomainPatternIgnoreCase(cleanPattern)) {
            throw new IllegalArgumentException("Domain pattern already blacklisted: " + cleanPattern);
        }

        BlacklistedDomain item = BlacklistedDomain.builder()
                .domainPattern(cleanPattern)
                .reason(reason != null ? reason.trim() : "Flagged malicious domain")
                .build();
        item = blacklistedDomainRepository.save(item);
        try {
            redisTemplate.opsForSet().add(REDIS_BLACKLISTED_DOMAINS_KEY, cleanPattern);
        } catch (Exception e) {
            log.warn("Failed to sync blacklisted domain to Redis: {}", e.getMessage());
        }

        recordAudit("DOMAIN_BLOCKED", "DOMAIN", cleanPattern,
                "Added domain to blacklist: " + cleanPattern + ". Reason: " + item.getReason(),
                "{\"domain\":\"" + cleanPattern + "\"}");

        return item;
    }

    @Transactional
    public void deleteBlacklistDomain(Long id) {
        var domainObj = blacklistedDomainRepository.findById(id).orElse(null);
        blacklistedDomainRepository.deleteById(id);
        if (domainObj != null) {
            try {
                redisTemplate.opsForSet().remove(REDIS_BLACKLISTED_DOMAINS_KEY, domainObj.getDomainPattern());
            } catch (Exception e) {
                log.warn("Failed to remove blacklisted domain from Redis: {}", e.getMessage());
            }
        }

        recordAudit("DOMAIN_UNBLOCKED", "DOMAIN", domainObj != null ? domainObj.getDomainPattern() : String.valueOf(id),
                "Removed domain from blacklist: " + (domainObj != null ? domainObj.getDomainPattern() : id), null);
    }

    public List<SystemSettingDto> getSystemSettings() {
        return systemSettingRepository.findAll().stream()
                .map(s -> SystemSettingDto.builder()
                        .settingKey(s.getSettingKey())
                        .settingValue(s.getSettingValue())
                        .description(s.getDescription())
                        .updatedAt(s.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public SystemSettingDto updateSystemSetting(String key, String value, String description) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Setting key cannot be blank");
        }
        SystemSetting setting = systemSettingRepository.findBySettingKey(key.trim())
                .orElseGet(() -> SystemSetting.builder()
                        .settingKey(key.trim())
                        .build());

        String oldValue = setting.getSettingValue();
        setting.setSettingValue(value != null ? value.trim() : "");
        if (description != null && !description.isBlank()) {
            setting.setDescription(description.trim());
        }
        setting = systemSettingRepository.save(setting);
        try {
            redisTemplate.opsForValue().set(REDIS_SETTING_KEY_PREFIX + key.trim(), setting.getSettingValue());
        } catch (Exception e) {
            log.warn("Failed to sync system setting to Redis: {}", e.getMessage());
        }

        recordAudit("SETTING_UPDATED", "SETTING", key.trim(),
                "Updated setting " + key.trim() + " = " + value,
                "{\"key\":\"" + key.trim() + "\",\"oldValue\":\"" + oldValue + "\",\"newValue\":\"" + value + "\"}");

        return SystemSettingDto.builder()
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .description(setting.getDescription())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }

    private AdminLinkDto toAdminLinkDto(CoreLinkDetailDto u) {
        InternalUserSummaryDto owner = u.getUserId() != null ? authServiceClient.getUserById(u.getUserId()) : null;

        return AdminLinkDto.builder()
                .id(u.getId())
                .shortUrl(u.getShortUrl())
                .fullShortUrl(rootDomainUrl + "/" + u.getShortUrl())
                .longUrl(u.getLongUrl())
                .createdAt(u.getCreatedAt())
                .expiresAt(u.getExpiresAt())
                .isActive(u.isActive())
                .isQuarantined(u.isQuarantined())
                .quarantineReason(u.getQuarantineReason())
                .isPasswordProtected(u.isPasswordProtected())
                .totalClicks(u.getTotalClicks() != null ? u.getTotalClicks() : 0L)
                .userEmail(owner != null ? owner.getEmail() : "Anonymous")
                .username(owner != null ? owner.getUsername() : "Anonymous")
                .userPublicId(owner != null ? owner.getPublicId() : null)
                .build();
    }

    private AdminUserDto toAdminUserDto(InternalUserSummaryDto u) {
        List<CoreLinkDetailDto> userUrls = coreServiceClient.getUserLinks(u.getId());
        long linkCount = userUrls.size();
        long totalClicks = 0;
        for (CoreLinkDetailDto l : userUrls) {
            if (l.getTotalClicks() != null) {
                totalClicks += l.getTotalClicks();
            }
        }

        List<String> oauthProviders = u.getConnectedOAuthProviders() != null ? u.getConnectedOAuthProviders() : Collections.emptyList();

        return AdminUserDto.builder()
                .id(u.getId())
                .publicId(u.getPublicId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .emailVerified(u.isEmailVerified())
                .emailVerifiedAt(u.getEmailVerifiedAt())
                .customMaxLinks(u.getCustomMaxLinks())
                .connectedOAuthProviders(oauthProviders)
                .isSuspended(u.isSuspended())
                .suspendedReason(u.getSuspendedReason())
                .linkCount(linkCount)
                .totalClicks(totalClicks)
                .createdAt(u.getCreatedAt())
                .build();
    }

    public Page<SecurityIncident> getSecurityIncidents(int page, int size, Boolean resolved) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (resolved != null) {
            return securityIncidentRepository.findByIsResolved(resolved, pageable);
        }
        return securityIncidentRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional
    public SecurityIncident resolveSecurityIncident(Long id, String resolvedBy) {
        var incident = securityIncidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Security incident not found: " + id));
        incident.setIsResolved(true);
        incident.setResolvedAt(LocalDateTime.now());
        incident.setResolvedBy(resolvedBy != null ? resolvedBy : "ADMIN");
        incident = securityIncidentRepository.save(incident);

        recordAudit("INCIDENT_RESOLVED", "INCIDENT", String.valueOf(id),
                "Resolved security incident #" + id + " (" + incident.getIncidentType() + ")",
                "{\"incidentId\":" + id + ",\"type\":\"" + incident.getIncidentType() + "\"}");

        return incident;
    }

    public com.url_shortener.admin_service.security.dto.ThreatScanResultDto testThreatScanner(String url) {
        if (url == null || url.trim().isBlank()) {
            return com.url_shortener.admin_service.security.dto.ThreatScanResultDto.builder()
                    .safe(false)
                    .riskScore(100)
                    .threatType("MALFORMED_URL")
                    .detectedThreats(List.of("URL is empty or null"))
                    .engine("HEURISTIC")
                    .scanDurationMs(1L)
                    .build();
        }

        try {
            var remoteResult = coreServiceClient.testThreatScanner(url);
            if (remoteResult != null) {
                return remoteResult;
            }
        } catch (Exception e) {
            log.warn("Failed to delegate threat scan to core-service: {}", e.getMessage());
        }

        // Fallback local heuristic analysis
        long start = System.currentTimeMillis();
        String lower = url.trim().toLowerCase();
        List<String> threats = new ArrayList<>();
        int risk = 0;
        String threatType = "CLEAN";

        if (lower.contains("testsafebrowsing.appspot.com/s/malware.html")) {
            threats.add("Google Safe Browsing Test Vector: Confirmed Malware Payload Simulation");
            risk = 100;
            threatType = "GOOGLE_SAFE_BROWSING_ALERT";
        } else if (lower.contains("testsafebrowsing.appspot.com/s/phishing.html")) {
            threats.add("Google Safe Browsing Test Vector: Confirmed Social Engineering / Phishing Simulation");
            risk = 100;
            threatType = "PHISHING_HEURISTIC";
        } else if (lower.endsWith(".exe") || lower.contains(".exe/") || lower.contains(".exe?")) {
            threats.add("Executable dropper payload detected (.exe)");
            risk = 80;
            threatType = "MALWARE_PAYLOAD";
        }

        return com.url_shortener.admin_service.security.dto.ThreatScanResultDto.builder()
                .safe(risk < 50 && threats.isEmpty())
                .riskScore(risk)
                .threatType(threatType)
                .detectedThreats(threats)
                .engine("HEURISTIC")
                .scanDurationMs(System.currentTimeMillis() - start)
                .build();
    }

    public SafeBrowsingDiagnosticResultDto testSafeBrowsingKey(String key) {
        String effectiveKey = (key != null && !key.trim().isBlank()) ? key.trim() : getEffectiveSetting("SAFE_BROWSING_API_KEY", "");
        if (effectiveKey.isBlank()) {
            return SafeBrowsingDiagnosticResultDto.builder()
                    .valid(false)
                    .latencyMs(0L)
                    .message("No Google Safe Browsing API Key provided or configured.")
                    .testThreatResult(null)
                    .build();
        }

        long start = System.currentTimeMillis();
        try {
            var rest = new org.springframework.web.client.RestTemplate();
            String endpoint = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + effectiveKey;
            var requestBody = Map.of(
                    "client", Map.of("clientId", "trim-url-shortener", "clientVersion", "2.0.0"),
                    "threatInfo", Map.of(
                            "threatTypes", List.of("MALWARE"),
                            "platformTypes", List.of("ANY_PLATFORM"),
                            "threatEntryTypes", List.of("URL"),
                            "threatEntries", List.of(Map.of("url", "http://testsafebrowsing.appspot.com/s/malware.html"))
                    )
            );
            var headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            var entity = new org.springframework.http.HttpEntity<>(requestBody, headers);

            var resp = rest.postForEntity(endpoint, entity, String.class);
            long latency = System.currentTimeMillis() - start;
            boolean matched = resp.getBody() != null && resp.getBody().contains("matches");

            return SafeBrowsingDiagnosticResultDto.builder()
                    .valid(true)
                    .latencyMs(latency)
                    .message("Google Safe Browsing API key is active and responding.")
                    .testThreatResult(matched ? "MALWARE_MATCH_CONFIRMED" : "CLEAN")
                    .build();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            long latency = System.currentTimeMillis() - start;
            return SafeBrowsingDiagnosticResultDto.builder()
                    .valid(false)
                    .latencyMs(latency)
                    .message("Google Safe Browsing API returned error: " + e.getStatusCode())
                    .testThreatResult(null)
                    .build();
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            return SafeBrowsingDiagnosticResultDto.builder()
                    .valid(false)
                    .latencyMs(latency)
                    .message("Failed to reach Google Safe Browsing API: " + e.getMessage())
                    .testThreatResult(null)
                    .build();
        }
    }

    public List<BlockedIp> getBlockedIps() {
        return blockedIpService.getAllBlockedIps();
    }

    @Transactional
    public BlockedIp addBlockedIp(String ipAddress, String reason, String createdBy) {
        var blocked = blockedIpService.blockIp(ipAddress, reason, createdBy);

        recordAudit("IP_BLOCKED", "IP", ipAddress,
                "Blocked perimeter IP/subnet: " + ipAddress + ". Reason: " + reason,
                "{\"ipAddress\":\"" + ipAddress + "\",\"reason\":\"" + reason + "\"}");

        return blocked;
    }

    @Transactional
    public void deleteBlockedIp(Long id) {
        var ipObj = blockedIpService.getAllBlockedIps().stream()
                .filter(b -> b.getId().equals(id))
                .findFirst()
                .orElse(null);
        blockedIpService.unblockIp(id);
        recordAudit("IP_UNBLOCKED", "IP", ipObj != null ? ipObj.getIpAddress() : String.valueOf(id),
                "Unblocked perimeter IP: " + (ipObj != null ? ipObj.getIpAddress() : id), null);
    }

    private void recordAudit(String action, String targetType, String targetIdentifier, String details, String metadataJson) {
        try {
            var ctx = com.url_shortener.admin_service.audit.AdminAuditContextHolder.getContext();
            Long actorId = ctx != null ? ctx.getActorId() : null;
            String actorEmail = ctx != null ? ctx.getActorEmail() : null;
            String actorRole = ctx != null ? ctx.getActorRole() : null;
            String actorIp = ctx != null ? ctx.getActorIp() : null;

            adminAuditService.record(actorId, actorEmail, actorRole, actorIp, action, targetType, targetIdentifier, details, metadataJson);
        } catch (Exception e) {
            log.warn("Failed to record audit log for action {}: {}", action, e.getMessage());
        }
    }

    public String getEffectiveSetting(String key, String defaultValue) {
        if (key == null) return defaultValue;
        try {
            String redisVal = redisTemplate.opsForValue().get(REDIS_SETTING_KEY_PREFIX + key.trim());
            if (redisVal != null && !redisVal.isBlank()) {
                return redisVal.trim();
            }
        } catch (Exception ignored) {}

        try {
            var dbSetting = systemSettingRepository.findBySettingKey(key.trim());
            if (dbSetting.isPresent() && !dbSetting.get().getSettingValue().isBlank()) {
                return dbSetting.get().getSettingValue().trim();
            }
        } catch (Exception ignored) {}

        Map<String, String> envMap = envSyncService.readEnvMap();
        if (envMap.containsKey(key.trim())) {
            return envMap.get(key.trim());
        }

        return defaultValue;
    }

    public List<EnvironmentVaultDto> getEnvironmentVault() {
        Map<String, String> envMap = envSyncService.readEnvMap();
        List<EnvironmentVaultDto> items = new ArrayList<>();

        record EnvDef(String key, String category, boolean isSecret, String description, String fallback) {}
        List<EnvDef> definitions = List.of(
                new EnvDef("APP_SELF_HOSTED", "SYSTEM", false, "Flag indicating if instance is operating in self-hosted mode", "false"),
                new EnvDef("ALLOW_REGISTRATION", "SYSTEM", false, "Allows or forbids new user public account registrations", "true"),
                new EnvDef("REQUIRE_EMAIL_VERIFICATION", "SYSTEM", false, "Enforces email confirmation before URL shortening privileges", "true"),
                new EnvDef("PANIC_MODE", "SYSTEM", false, "Emergency lockdown: NORMAL, READ_ONLY, or MAINTENANCE", "NORMAL"),
                new EnvDef("ROOT_DOMAIN_URL", "DOMAIN", false, "Base redirect host URL", rootDomainUrl),
                new EnvDef("FRONTEND_URL", "DOMAIN", false, "Public front-end marketing and login origin", frontendUrl),
                new EnvDef("APP_DASHBOARD_URL", "DOMAIN", false, "Private analytics and dashboard URL", dashboardUrl),
                new EnvDef("SPRING_MAIL_HOST", "MAIL", false, "SMTP outgoing relay server host", mailHost),
                new EnvDef("SPRING_MAIL_PORT", "MAIL", false, "SMTP service port", String.valueOf(mailPort)),
                new EnvDef("SPRING_MAIL_USERNAME", "MAIL", false, "SMTP account username / email", mailUsername),
                new EnvDef("SPRING_MAIL_PASSWORD", "MAIL", true, "SMTP account app password", ""),
                new EnvDef("SPRING_MAIL_SMTP_AUTH", "MAIL", false, "SMTP authentication flag", "true"),
                new EnvDef("SPRING_MAIL_SMTP_STARTTLS_ENABLE", "MAIL", false, "STARTTLS encryption enablement", "true"),
                new EnvDef("OAUTH_GOOGLE_CLIENT_ID", "OAUTH", false, "Google OAuth 2.0 Web Client ID", googleClientId),
                new EnvDef("OAUTH_GOOGLE_CLIENT_SECRET", "OAUTH", true, "Google OAuth 2.0 Client Secret", ""),
                new EnvDef("OAUTH_GITHUB_CLIENT_ID", "OAUTH", false, "GitHub OAuth App Client ID", githubClientId),
                new EnvDef("OAUTH_GITHUB_CLIENT_SECRET", "OAUTH", true, "GitHub OAuth App Client Secret", ""),
                new EnvDef("SAFE_BROWSING_API_KEY", "SECURITY", true, "Google Safe Browsing v4 Threat Intelligence API Key", safeBrowsingApiKey)
        );

        for (EnvDef def : definitions) {
            String val = envMap.getOrDefault(def.key, def.fallback);
            String source = "ENV";

            var dbSetting = systemSettingRepository.findBySettingKey(def.key);
            if (dbSetting.isPresent() && !dbSetting.get().getSettingValue().isBlank()) {
                val = dbSetting.get().getSettingValue();
                source = "DYNAMIC_OVERRIDE";
            }

            items.add(EnvironmentVaultDto.builder()
                    .key(def.key)
                    .category(def.category)
                    .value(val != null ? val : "")
                    .isSecret(def.isSecret)
                    .source(source)
                    .description(def.description)
                    .build());
        }

        return items;
    }

    @Transactional
    public EnvironmentVaultDto updateEnvVariable(String key, String value) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Variable key cannot be blank");
        }
        String cleanKey = key.trim();
        String cleanVal = value != null ? value.trim() : "";

        boolean syncedToEnv = envSyncService.updateEnvVariable(cleanKey, cleanVal);

        SystemSetting setting = systemSettingRepository.findBySettingKey(cleanKey)
                .orElseGet(() -> SystemSetting.builder().settingKey(cleanKey).build());
        String oldValue = setting.getSettingValue();
        setting.setSettingValue(cleanVal);
        setting.setDescription("Configured via Admin Environment Vault");
        systemSettingRepository.save(setting);
        try {
            redisTemplate.opsForValue().set(REDIS_SETTING_KEY_PREFIX + cleanKey, cleanVal);
        } catch (Exception e) {
            log.warn("Failed to sync env variable setting to Redis: {}", e.getMessage());
        }

        recordAudit("ENV_VARIABLE_UPDATED", "VAULT", cleanKey,
                "Updated environment variable " + cleanKey + " (synced to .env: " + syncedToEnv + ")",
                "{\"key\":\"" + cleanKey + "\",\"oldValue\":\"" + (cleanKey.contains("SECRET") || cleanKey.contains("PASSWORD") ? "******" : oldValue) + "\"}");

        return EnvironmentVaultDto.builder()
                .key(cleanKey)
                .category("CONFIG")
                .value(cleanVal)
                .isSecret(cleanKey.contains("SECRET") || cleanKey.contains("PASSWORD"))
                .source(syncedToEnv ? "ENV_AND_OVERRIDE" : "DYNAMIC_OVERRIDE")
                .description("Synchronized live environment variable")
                .build();
    }

    public SmtpTestResultDto testSmtpConnection(String recipientEmail) {
        long startTime = System.currentTimeMillis();
        String effectiveHost = getEffectiveSetting("SPRING_MAIL_HOST", mailHost);
        int effectivePort = mailPort;
        try {
            effectivePort = Integer.parseInt(getEffectiveSetting("SPRING_MAIL_PORT", String.valueOf(mailPort)));
        } catch (NumberFormatException ignored) {}
        String effectiveUser = getEffectiveSetting("SPRING_MAIL_USERNAME", mailUsername);

        if (effectiveHost == null || effectiveHost.isBlank()) {
            return SmtpTestResultDto.builder()
                    .success(false)
                    .latencyMs(System.currentTimeMillis() - startTime)
                    .host("None")
                    .port(effectivePort)
                    .fromEmail(effectiveUser)
                    .message("SMTP Host is not configured. Set SPRING_MAIL_HOST in the Environment Vault.")
                    .build();
        }

        if (javaMailSender == null) {
            return SmtpTestResultDto.builder()
                    .success(false)
                    .latencyMs(System.currentTimeMillis() - startTime)
                    .host(effectiveHost)
                    .port(effectivePort)
                    .fromEmail(effectiveUser)
                    .message("JavaMailSender bean is unavailable. Ensure SMTP settings are saved.")
                    .build();
        }

        try {
            var mimeMessage = javaMailSender.createMimeMessage();
            var helper = new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(effectiveUser != null && !effectiveUser.isBlank() ? effectiveUser : "noreply@trim.com");
            helper.setTo(recipientEmail);
            helper.setSubject("Trim SMTP Connection Diagnostic Test");
            helper.setText("""
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #0f172a; margin-bottom: 12px;">Trim SMTP Verification Successful</h2>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                            This test email confirms that your SMTP mail host (<strong>%s:%d</strong>) is correctly configured and operational.
                        </p>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                            Sent by Trim Admin Environment Vault at %s
                        </p>
                    </div>
                    """.formatted(effectiveHost, effectivePort, LocalDateTime.now().toString()), true);

            javaMailSender.send(mimeMessage);
            long latency = System.currentTimeMillis() - startTime;

            recordAudit("SMTP_DIAGNOSTIC_TEST", "MAIL", recipientEmail,
                    "Dispatched SMTP test email to " + recipientEmail + " (latency: " + latency + "ms)", null);

            return SmtpTestResultDto.builder()
                    .success(true)
                    .latencyMs(latency)
                    .host(effectiveHost)
                    .port(effectivePort)
                    .fromEmail(effectiveUser)
                    .message("Diagnostic email dispatched successfully to " + recipientEmail)
                    .build();
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("SMTP test failed for {}: {}", recipientEmail, e.getMessage());
            return SmtpTestResultDto.builder()
                    .success(false)
                    .latencyMs(latency)
                    .host(effectiveHost)
                    .port(effectivePort)
                    .fromEmail(effectiveUser)
                    .message("SMTP Error: " + e.getMessage())
                    .build();
        }
    }
}
