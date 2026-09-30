package com.url_shortener.analytics_service.service;

import com.url_shortener.analytics_service.model.ClickEvent;
import com.url_shortener.analytics_service.repository.ClickEventRepository;
import com.url_shortener.common.dto.analytics.*;
import com.url_shortener.common.event.UrlClickedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final ClickEventRepository clickEventRepository;
    private final UserAgentParserService userAgentParserService;
    private final GeoLocationService geoLocationService;
    private final EventStreamService eventStreamService;

    @Async("analyticsExecutor")
    public void processUrlClicked(UrlClickedEvent event) {
        try {
            UserAgentParserService.DeviceInfo deviceInfo = userAgentParserService.parse(event.getUserAgent());
            GeoLocationService.GeoInfo geoInfo = geoLocationService.lookup(event.getClientIp());

            String longUrl = event.getLongUrl();
            String utmSource = extractParam(longUrl, event.getQueryParams(), "utm_source");
            String utmMedium = extractParam(longUrl, event.getQueryParams(), "utm_medium");
            String utmCampaign = extractParam(longUrl, event.getQueryParams(), "utm_campaign");
            String utmTerm = extractParam(longUrl, event.getQueryParams(), "utm_term");
            String utmContent = extractParam(longUrl, event.getQueryParams(), "utm_content");

            String resolvedReferer = (event.getReferer() != null && !event.getReferer().isBlank())
                    ? cleanReferer(event.getReferer())
                    : extractParam(longUrl, event.getQueryParams(), "ref");

            String hashedIp = hashIp(event.getClientIp());

            ClickEvent click = ClickEvent.builder()
                    .urlId(event.getUrlId())
                    .userId(event.getUserId())
                    .folderId(event.getFolderId())
                    .shortUrl(event.getShortUrlHash())
                    .longUrl(longUrl)
                    .timestamp(event.getTimestamp() != null ? event.getTimestamp() : LocalDateTime.now(java.time.ZoneOffset.UTC))
                    .device(deviceInfo.device())
                    .browser(deviceInfo.browser())
                    .os(deviceInfo.os())
                    .country(geoInfo.country())
                    .city(geoInfo.city())
                    .region(geoInfo.region())
                    .continent(geoInfo.continent())
                    .latitude(geoInfo.latitude())
                    .longitude(geoInfo.longitude())
                    .utmSource(utmSource)
                    .utmMedium(utmMedium)
                    .utmCampaign(utmCampaign)
                    .utmTerm(utmTerm)
                    .utmContent(utmContent)
                    .referer(resolvedReferer)
                    .ipAddress(hashedIp)
                    .build();

            ClickEvent saved = clickEventRepository.save(click);

            // Broadcast SSE if user exists
            if (event.getUserId() != null) {
                ClickEventDto dto = ClickEventDto.builder()
                        .id(saved.getId())
                        .urlId(saved.getUrlId())
                        .shortUrlHash(saved.getShortUrl())
                        .originalUrl(saved.getLongUrl())
                        .timestamp(saved.getTimestamp())
                        .device(saved.getDevice())
                        .browser(saved.getBrowser())
                        .os(saved.getOs())
                        .country(saved.getCountry())
                        .city(saved.getCity())
                        .region(saved.getRegion())
                        .continent(saved.getContinent())
                        .latitude(saved.getLatitude())
                        .longitude(saved.getLongitude())
                        .utmSource(saved.getUtmSource())
                        .utmMedium(saved.getUtmMedium())
                        .utmCampaign(saved.getUtmCampaign())
                        .utmTerm(saved.getUtmTerm())
                        .utmContent(saved.getUtmContent())
                        .referer(saved.getReferer())
                        .ipAddress(saved.getIpAddress())
                        .build();
                eventStreamService.broadcastEvent(event.getUserId(), dto);
            }

            log.debug("Recorded click event id={} for shortUrl={}, userId={}", saved.getId(), saved.getShortUrl(), saved.getUserId());
        } catch (Exception e) {
            log.error("Failed to process UrlClickedEvent: {}", e.getMessage(), e);
        }
    }

    public UserUsageStatsDto getUserUsageStats(Long currentUserId) {
        long totalClicks = clickEventRepository.countByUserId(currentUserId);
        return UserUsageStatsDto.builder()
                .totalLinks(0) // total links populated by caller or frontend
                .totalClicks(totalClicks)
                .build();
    }

    public AnalyticsResponseDto getAnalytics(Long urlId, String period, String startDateStr, String endDateStr, String utmSource, String utmMedium, String utmCampaign, String utmTerm, String utmContent, String referer) {
        DateRange dates = parseDates(startDateStr, endDateStr, period);
        LocalDateTime startDate = dates.start();
        LocalDateTime endDate = dates.end();

        Long totalClicksRaw = clickEventRepository.countByUrlId(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer);
        Long totalClicks = totalClicksRaw != null ? totalClicksRaw : 0L;

        List<ClickDataPoint> clicksByDate;
        if (isHourlyGranularity(period, startDate, endDate)) {
            List<ClickDataPoint> rawClicksByDate = clickEventRepository.countByHourForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                    .stream()
                    .map(row -> new ClickDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            clicksByDate = fillMissingHours(rawClicksByDate, startDate, endDate);
        } else {
            List<ClickDataPoint> rawClicksByDate = clickEventRepository.countByDateForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                    .stream()
                    .map(row -> new ClickDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            clicksByDate = fillMissingDates(rawClicksByDate, startDate, endDate);
        }

        List<CountryDataPoint> clicksByCountry = clickEventRepository.countByCountryForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new CountryDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<DeviceDataPoint> clicksByDevice = clickEventRepository.countByDeviceForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new DeviceDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<BrowserDataPoint> clicksByBrowser = clickEventRepository.countByBrowserForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new BrowserDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<UtmDataPoint> clicksByUtmSource = mapToUtmDataPoints(clickEventRepository.countByUtmSourceForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmMedium = mapToUtmDataPoints(clickEventRepository.countByUtmMediumForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmCampaign = mapToUtmDataPoints(clickEventRepository.countByUtmCampaignForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmTerm = mapToUtmDataPoints(clickEventRepository.countByUtmTermForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmContent = mapToUtmDataPoints(clickEventRepository.countByUtmContentForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByReferer = mapToUtmDataPoints(clickEventRepository.countByRefererForUrl(urlId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));

        return AnalyticsResponseDto.builder()
                .totalClicks(totalClicks)
                .clicksByDate(clicksByDate)
                .clicksByCountry(clicksByCountry)
                .clicksByDevice(clicksByDevice)
                .clicksByBrowser(clicksByBrowser)
                .clicksByUtmSource(clicksByUtmSource)
                .clicksByUtmMedium(clicksByUtmMedium)
                .clicksByUtmCampaign(clicksByUtmCampaign)
                .clicksByUtmTerm(clicksByUtmTerm)
                .clicksByUtmContent(clicksByUtmContent)
                .clicksByReferer(clicksByReferer)
                .build();
    }

    public AnalyticsResponseDto getOverallAnalytics(Long currentUserId, String period, String startDateStr, String endDateStr, String hash, Long folderId, String utmSource, String utmMedium, String utmCampaign, String utmTerm, String utmContent, String referer) {
        Long userId = currentUserId;
        DateRange dates = parseDates(startDateStr, endDateStr, period);
        LocalDateTime startDate = dates.start();
        LocalDateTime endDate = dates.end();

        Long totalClicksRaw = clickEventRepository.countTotalOverallClicks(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer);
        Long totalClicks = totalClicksRaw != null ? totalClicksRaw : 0L;

        List<ClickDataPoint> clicksByDate;
        if (isHourlyGranularity(period, startDate, endDate)) {
            List<ClickDataPoint> rawClicksByDate = clickEventRepository.countOverallClicksByHour(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                    .stream()
                    .map(row -> new ClickDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            clicksByDate = fillMissingHours(rawClicksByDate, startDate, endDate);
        } else {
            List<ClickDataPoint> rawClicksByDate = clickEventRepository.countOverallClicksByDate(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                    .stream()
                    .map(row -> new ClickDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            clicksByDate = fillMissingDates(rawClicksByDate, startDate, endDate);
        }

        List<CountryDataPoint> clicksByCountry = clickEventRepository.countOverallClicksByCountry(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new CountryDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<DeviceDataPoint> clicksByDevice = clickEventRepository.countOverallClicksByDevice(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new DeviceDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<BrowserDataPoint> clicksByBrowser = clickEventRepository.countOverallClicksByBrowser(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new BrowserDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<UtmDataPoint> clicksByUtmSource = mapToUtmDataPoints(clickEventRepository.countOverallClicksByUtmSource(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmMedium = mapToUtmDataPoints(clickEventRepository.countOverallClicksByUtmMedium(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmCampaign = mapToUtmDataPoints(clickEventRepository.countOverallClicksByUtmCampaign(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmTerm = mapToUtmDataPoints(clickEventRepository.countOverallClicksByUtmTerm(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmContent = mapToUtmDataPoints(clickEventRepository.countOverallClicksByUtmContent(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByReferer = mapToUtmDataPoints(clickEventRepository.countOverallClicksByReferer(userId, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));

        return AnalyticsResponseDto.builder()
                .totalClicks(totalClicks)
                .clicksByDate(clicksByDate)
                .clicksByCountry(clicksByCountry)
                .clicksByDevice(clicksByDevice)
                .clicksByBrowser(clicksByBrowser)
                .clicksByUtmSource(clicksByUtmSource)
                .clicksByUtmMedium(clicksByUtmMedium)
                .clicksByUtmCampaign(clicksByUtmCampaign)
                .clicksByUtmTerm(clicksByUtmTerm)
                .clicksByUtmContent(clicksByUtmContent)
                .clicksByReferer(clicksByReferer)
                .build();
    }

    public AnalyticsResponseDto getFolderAnalytics(Long folderId, Long currentUserId, String period, String startDateStr, String endDateStr, String utmSource, String utmMedium, String utmCampaign, String utmTerm, String utmContent, String referer) {
        Long userId = currentUserId;
        DateRange dates = parseDates(startDateStr, endDateStr, period);
        LocalDateTime startDate = dates.start();
        LocalDateTime endDate = dates.end();

        Long totalClicksRaw = clickEventRepository.countTotalFolderClicks(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer);
        Long totalClicks = totalClicksRaw != null ? totalClicksRaw : 0L;

        List<ClickDataPoint> clicksByDate;
        if (isHourlyGranularity(period, startDate, endDate)) {
            List<ClickDataPoint> rawClicksByDate = clickEventRepository.countFolderClicksByHour(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                    .stream()
                    .map(row -> new ClickDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            clicksByDate = fillMissingHours(rawClicksByDate, startDate, endDate);
        } else {
            List<ClickDataPoint> rawClicksByDate = clickEventRepository.countFolderClicksByDate(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                    .stream()
                    .map(row -> new ClickDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            clicksByDate = fillMissingDates(rawClicksByDate, startDate, endDate);
        }

        List<CountryDataPoint> clicksByCountry = clickEventRepository.countFolderClicksByCountry(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new CountryDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<DeviceDataPoint> clicksByDevice = clickEventRepository.countFolderClicksByDevice(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new DeviceDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<BrowserDataPoint> clicksByBrowser = clickEventRepository.countFolderClicksByBrowser(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer)
                .stream()
                .map(row -> new BrowserDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<UtmDataPoint> clicksByUtmSource = mapToUtmDataPoints(clickEventRepository.countFolderClicksByUtmSource(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmMedium = mapToUtmDataPoints(clickEventRepository.countFolderClicksByUtmMedium(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmCampaign = mapToUtmDataPoints(clickEventRepository.countFolderClicksByUtmCampaign(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmTerm = mapToUtmDataPoints(clickEventRepository.countFolderClicksByUtmTerm(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByUtmContent = mapToUtmDataPoints(clickEventRepository.countFolderClicksByUtmContent(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
        List<UtmDataPoint> clicksByReferer = mapToUtmDataPoints(clickEventRepository.countFolderClicksByReferer(folderId, userId, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));

        return AnalyticsResponseDto.builder()
                .totalClicks(totalClicks)
                .clicksByDate(clicksByDate)
                .clicksByCountry(clicksByCountry)
                .clicksByDevice(clicksByDevice)
                .clicksByBrowser(clicksByBrowser)
                .clicksByUtmSource(clicksByUtmSource)
                .clicksByUtmMedium(clicksByUtmMedium)
                .clicksByUtmCampaign(clicksByUtmCampaign)
                .clicksByUtmTerm(clicksByUtmTerm)
                .clicksByUtmContent(clicksByUtmContent)
                .clicksByReferer(clicksByReferer)
                .build();
    }

    public Page<ClickEventDto> getPaginatedEvents(
            Long currentUserId,
            String period,
            String startDateStr,
            String endDateStr,
            String hash,
            String country,
            String city,
            String device,
            String browser,
            String os,
            String campaign,
            String search,
            Pageable pageable
    ) {
        DateRange dates = parseDates(startDateStr, endDateStr, period);
        LocalDateTime startDate = dates.start();
        LocalDateTime endDate = dates.end();

        return clickEventRepository.findEventsForUser(
                currentUserId,
                (hash != null && !hash.isBlank()) ? hash : null,
                (country != null && !country.isBlank()) ? country : null,
                (city != null && !city.isBlank()) ? city : null,
                (device != null && !device.isBlank()) ? device : null,
                (browser != null && !browser.isBlank()) ? browser : null,
                (os != null && !os.isBlank()) ? os : null,
                (campaign != null && !campaign.isBlank()) ? campaign : null,
                (search != null && !search.isBlank()) ? search.trim() : null,
                startDate,
                endDate,
                pageable
        ).map(event -> ClickEventDto.builder()
                .id(event.getId())
                .urlId(event.getUrlId())
                .shortUrlHash(event.getShortUrl())
                .originalUrl(event.getLongUrl())
                .timestamp(event.getTimestamp())
                .device(event.getDevice())
                .browser(event.getBrowser())
                .os(event.getOs())
                .country(event.getCountry())
                .city(event.getCity())
                .region(event.getRegion())
                .continent(event.getContinent())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .utmSource(event.getUtmSource())
                .utmMedium(event.getUtmMedium())
                .utmCampaign(event.getUtmCampaign())
                .utmTerm(event.getUtmTerm())
                .utmContent(event.getUtmContent())
                .referer(event.getReferer())
                .ipAddress(event.getIpAddress())
                .build()
        );
    }

    public void purgeUserData(Long userId) {
        if (userId != null) {
            clickEventRepository.deleteByUserId(userId);
            log.info("Purged all click records for userId={}", userId);
        }
    }

    public long getUrlClickCount(Long urlId) {
        return clickEventRepository.countByUrlId(urlId);
    }

    public AnalyticsAdminOverviewDto getAdminOverviewStats(int days) {
        long totalClicks = 0;
        try {
            totalClicks = clickEventRepository.count();
        } catch (Exception ignored) {}

        long clicksLast24Hours = 0;
        try {
            clicksLast24Hours = clickEventRepository.countByTimestampAfter(LocalDateTime.now().minusHours(24));
        } catch (Exception ignored) {}

        LocalDateTime rangeStart = LocalDateTime.now().minusDays(days).withHour(0).withMinute(0).withSecond(0).withNano(0);
        Map<String, Long> clicksByDateMap = new java.util.HashMap<>();
        try {
            List<Object[]> rows = clickEventRepository.countClicksByDateInstance(rangeStart);
            for (Object[] r : rows) {
                if (r != null && r.length >= 2 && r[0] != null) {
                    clicksByDateMap.put(r[0].toString(), ((Number) r[1]).longValue());
                }
            }
        } catch (Exception ignored) {}

        List<DeviceDataPoint> devList = new java.util.ArrayList<>();
        try {
            List<Object[]> devRows = clickEventRepository.countClicksByDeviceInstance(rangeStart);
            for (Object[] r : devRows) {
                if (r != null && r.length >= 2) {
                    devList.add(new DeviceDataPoint(r[0] != null ? r[0].toString() : "Other", ((Number) r[1]).longValue()));
                }
            }
        } catch (Exception ignored) {}

        List<CountryDataPoint> ctryList = new java.util.ArrayList<>();
        try {
            List<Object[]> ctryRows = clickEventRepository.countClicksByCountryInstance(rangeStart);
            for (Object[] r : ctryRows) {
                if (r != null && r.length >= 2) {
                    ctryList.add(new CountryDataPoint(r[0] != null ? r[0].toString() : "Unknown", ((Number) r[1]).longValue()));
                }
            }
        } catch (Exception ignored) {}

        return AnalyticsAdminOverviewDto.builder()
                .totalClicks(totalClicks)
                .clicksLast24Hours(clicksLast24Hours)
                .clicksByDate(clicksByDateMap)
                .deviceDistribution(devList)
                .countryDistribution(ctryList)
                .build();
    }

    public int pruneClickEvents(int daysOlderThan) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysOlderThan);
        return clickEventRepository.deleteByTimestampBefore(cutoff);
    }

    public long countClickEventsOlderThan(int daysOlderThan) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysOlderThan);
        return clickEventRepository.countByTimestampBefore(cutoff);
    }

    // ── Private Helpers ──────────────────────────────────────────────
    private String cleanReferer(String ref) {
        if (ref == null || ref.isBlank()) return null;
        try {
            java.net.URI uri = java.net.URI.create(ref.trim());
            if (uri.getHost() != null) {
                return uri.getHost();
            }
        } catch (Exception ignored) {}
        return ref.trim().length() > 255 ? ref.trim().substring(0, 255) : ref.trim();
    }

    private String extractParam(String longUrl, Map<String, String> queryParams, String key) {
        if (queryParams != null && queryParams.containsKey(key)) {
            String val = queryParams.get(key);
            if (val != null && !val.isBlank()) {
                return val.trim().length() > 150 ? val.trim().substring(0, 150) : val.trim();
            }
        }
        if (longUrl != null && longUrl.contains("?")) {
            try {
                String query = longUrl.substring(longUrl.indexOf('?') + 1);
                for (String pair : query.split("&")) {
                    int idx = pair.indexOf('=');
                    if (idx > 0) {
                        String k = java.net.URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                        if (k.equalsIgnoreCase(key)) {
                            String v = java.net.URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8).trim();
                            return v.length() > 150 ? v.substring(0, 150) : v;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String hashIp(String ip) {
        if (ip == null || ip.isBlank() || "Unknown".equalsIgnoreCase(ip)) {
            return "0000000000000000";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ip.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                sb.append(String.format("%02x", hash[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return "0000000000000000";
        }
    }

    private boolean isHourlyGranularity(String period, LocalDateTime startDate, LocalDateTime endDate) {
        if ("24h".equalsIgnoreCase(period)) {
            return true;
        }
        if (startDate != null && !startDate.equals(LocalDateTime.of(1970, 1, 1, 0, 0))) {
            LocalDateTime effectiveEnd = endDate != null ? endDate : LocalDateTime.now(java.time.ZoneOffset.UTC);
            java.time.Duration duration = java.time.Duration.between(startDate, effectiveEnd);
            return !duration.isNegative() && duration.toHours() <= 24;
        }
        return false;
    }

    private List<UtmDataPoint> mapToUtmDataPoints(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new UtmDataPoint(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    private List<ClickDataPoint> fillMissingDates(List<ClickDataPoint> rawData, LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime effectiveStart;
        if (startDate == null || startDate.equals(LocalDateTime.of(1970, 1, 1, 0, 0))) {
            effectiveStart = rawData.isEmpty()
                    ? LocalDateTime.now(java.time.ZoneOffset.UTC).minusDays(30)
                    : java.time.LocalDate.parse(rawData.get(0).getDate()).atStartOfDay();
        } else {
            effectiveStart = startDate;
        }

        LocalDateTime effectiveEnd = endDate == null ? LocalDateTime.now(java.time.ZoneOffset.UTC) : endDate;

        Map<String, Long> countMap = rawData.stream()
                .collect(Collectors.toMap(ClickDataPoint::getDate, ClickDataPoint::getCount, (v1, v2) -> v1));

        List<ClickDataPoint> result = new java.util.ArrayList<>();
        LocalDateTime current = effectiveStart;

        while (!current.toLocalDate().isAfter(effectiveEnd.toLocalDate())) {
            String dateKey = current.toLocalDate().toString();
            long count = countMap.getOrDefault(dateKey, 0L);
            result.add(new ClickDataPoint(dateKey, count));
            current = current.plusDays(1);
        }

        return result;
    }

    private List<ClickDataPoint> fillMissingHours(List<ClickDataPoint> rawData, LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime effectiveStart = startDate == null ? LocalDateTime.now(java.time.ZoneOffset.UTC).minusHours(24) : startDate;
        LocalDateTime effectiveEnd = endDate == null ? LocalDateTime.now(java.time.ZoneOffset.UTC) : endDate;

        Map<String, Long> countMap = rawData.stream()
                .collect(Collectors.toMap(ClickDataPoint::getDate, ClickDataPoint::getCount, (v1, v2) -> v1));

        List<ClickDataPoint> result = new java.util.ArrayList<>();
        LocalDateTime current = effectiveStart.withMinute(0).withSecond(0).withNano(0);
        LocalDateTime ceiling = effectiveEnd.withMinute(0).withSecond(0).withNano(0);

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00:00");
        while (!current.isAfter(ceiling)) {
            String dateKey = current.format(formatter);
            long count = countMap.getOrDefault(dateKey, 0L);
            result.add(new ClickDataPoint(dateKey, count));
            current = current.plusHours(1);
        }

        return result;
    }

    private DateRange parseDates(String startDateStr, String endDateStr, String period) {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
        LocalDateTime liveBufferEnd = now.plusMinutes(15);

        if (startDateStr != null && !startDateStr.isBlank()) {
            LocalDateTime start = parseIsoDateTime(startDateStr, true);
            LocalDateTime end = (endDateStr != null && !endDateStr.isBlank())
                    ? parseIsoDateTime(endDateStr, false)
                    : liveBufferEnd;
            return new DateRange(start, end);
        }

        if (period != null) {
            return switch (period.toLowerCase()) {
                case "24h" -> new DateRange(now.minusHours(24), liveBufferEnd);
                case "7d"  -> new DateRange(now.minusDays(7),  liveBufferEnd);
                case "30d" -> new DateRange(now.minusDays(30), liveBufferEnd);
                case "90d" -> new DateRange(now.minusDays(90), liveBufferEnd);
                case "all" -> new DateRange(LocalDateTime.of(1970, 1, 1, 0, 0), liveBufferEnd);
                default    -> new DateRange(now.minusDays(30), liveBufferEnd);
            };
        }

        return new DateRange(now.minusDays(30), liveBufferEnd);
    }

    private LocalDateTime parseIsoDateTime(String str, boolean isStart) {
        try {
            if (str.contains("T")) {
                return LocalDateTime.parse(str);
            }
            java.time.LocalDate date = java.time.LocalDate.parse(str);
            return isStart ? date.atStartOfDay() : date.atTime(23, 59, 59, 999999999);
        } catch (Exception e) {
            return isStart ? LocalDateTime.of(1970, 1, 1, 0, 0) : LocalDateTime.now(java.time.ZoneOffset.UTC);
        }
    }

    public record DateRange(LocalDateTime start, LocalDateTime end) {}
}
