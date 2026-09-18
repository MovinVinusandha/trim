package com.url_shortener.url_shortener.urls;

import com.url_shortener.common.dto.core.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/internal/core/links")
@RequiredArgsConstructor
public class InternalCoreLinkController {

    private final UrlRepository urlRepository;
    private final StringRedisTemplate redisTemplate;
    private final org.springframework.cache.CacheManager cacheManager;

    @GetMapping("/counts")
    public ResponseEntity<CoreLinkCountsDto> getCounts() {
        long totalLinks = urlRepository.count();
        long activeLinks = urlRepository.countByIsActiveTrueAndIsQuarantinedFalse();
        long expiredLinks = urlRepository.countByIsActiveFalse();
        long quarantinedLinks = urlRepository.countByIsQuarantinedTrue();
        long createdLast24h = urlRepository.countByCreatedAtAfter(LocalDateTime.now().minusHours(24));

        return ResponseEntity.ok(CoreLinkCountsDto.builder()
                .totalLinks(totalLinks)
                .activeLinks(activeLinks)
                .expiredLinks(expiredLinks)
                .quarantinedLinks(quarantinedLinks)
                .createdLast24hCount(createdLast24h)
                .build());
    }

    @GetMapping("/triage-summary")
    public ResponseEntity<CoreTriageSummaryDto> getTriageSummary() {
        long quarantined = urlRepository.countByIsQuarantinedTrue();
        long createdLast24h = urlRepository.countByCreatedAtAfter(LocalDateTime.now().minusHours(24));
        long spikes = 0;
        try {
            spikes = urlRepository.countByMinClicks(500L);
        } catch (Exception e) {
            log.warn("Failed to count spike clicks: {}", e.getMessage());
        }
        long needsAttention = quarantined + createdLast24h;
        long totalLinks = urlRepository.count();

        return ResponseEntity.ok(CoreTriageSummaryDto.builder()
                .needsAttentionCount(needsAttention)
                .spikeCount(spikes)
                .quarantinedCount(quarantined)
                .createdLast24hCount(createdLast24h)
                .totalLinks(totalLinks)
                .build());
    }

    @GetMapping
    public ResponseEntity<Page<CoreLinkDetailDto>> getLinks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long minClicks,
            @RequestParam(required = false) String domain,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String property = "createdAt";
        if ("clicks".equalsIgnoreCase(sortBy)) {
            property = "statistic.accessedTimes";
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Specification<Url> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("shortUrl")), term),
                        cb.like(cb.lower(root.get("longUrl")), term)
                ));
            }

            if (domain != null && !domain.trim().isEmpty()) {
                String domainTerm = "%" + domain.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("longUrl")), domainTerm));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (minClicks != null && minClicks > 0) {
                var statJoin = root.join("statistic", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.greaterThanOrEqualTo(statJoin.get("accessedTimes"), minClicks));
            }

            if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                String st = status.trim().toLowerCase();
                if ("needs_review".equals(st)) {
                    LocalDateTime past24h = LocalDateTime.now().minusHours(24);
                    predicates.add(cb.or(
                            cb.isTrue(root.get("isQuarantined")),
                            cb.greaterThanOrEqualTo(root.get("createdAt"), past24h)
                    ));
                } else if ("quarantined".equals(st)) {
                    predicates.add(cb.isTrue(root.get("isQuarantined")));
                } else if ("active".equals(st)) {
                    predicates.add(cb.and(
                            cb.isTrue(root.get("isActive")),
                            cb.isFalse(root.get("isQuarantined"))
                    ));
                } else if ("expired".equals(st)) {
                    predicates.add(cb.and(
                            cb.isFalse(root.get("isActive")),
                            cb.isFalse(root.get("isQuarantined"))
                    ));
                } else if ("spikes".equals(st)) {
                    var statJoin = root.join("statistic", jakarta.persistence.criteria.JoinType.LEFT);
                    predicates.add(cb.greaterThanOrEqualTo(statJoin.get("accessedTimes"), 500L));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Url> urlPage = urlRepository.findAll(spec, pageable);
        return ResponseEntity.ok(urlPage.map(this::toCoreLinkDetailDto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CoreLinkDetailDto>> getUserLinks(@PathVariable Long userId) {
        List<Url> urls = urlRepository.findByUserId(userId);
        return ResponseEntity.ok(urls.stream().map(this::toCoreLinkDetailDto).collect(Collectors.toList()));
    }

    @GetMapping("/top-domains")
    public ResponseEntity<Map<String, Long>> getTopDomains(@RequestParam(defaultValue = "8") int limit) {
        List<Url> sampleUrls = urlRepository.findAll();
        Map<String, Long> domainCounts = new HashMap<>();
        for (Url u : sampleUrls) {
            if (u.getLongUrl() != null) {
                try {
                    URI uri = new URI(u.getLongUrl());
                    String host = uri.getHost();
                    if (host != null && !host.isBlank()) {
                        host = host.toLowerCase().replaceFirst("^www\\.", "");
                        domainCounts.put(host, domainCounts.getOrDefault(host, 0L) + 1);
                    }
                } catch (Exception ignored) {}
            }
        }

        Map<String, Long> sorted = domainCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        return ResponseEntity.ok(sorted);
    }

    @GetMapping("/created-by-date")
    public ResponseEntity<Map<String, Long>> getLinksCreatedByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate
    ) {
        Map<String, Long> result = new HashMap<>();
        try {
            List<Object[]> rows = urlRepository.countLinksCreatedByDateInstance(startDate);
            for (Object[] r : rows) {
                if (r != null && r.length >= 2 && r[0] != null) {
                    result.put(r[0].toString(), ((Number) r[1]).longValue());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to query links created by date: {}", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{hash}/quarantine")
    @Transactional
    public ResponseEntity<CoreLinkDetailDto> quarantineLink(
            @PathVariable String hash,
            @RequestParam(required = false) String reason
    ) {
        Url url = urlRepository.findByShortUrl(hash);
        if (url == null) {
            return ResponseEntity.notFound().build();
        }
        url.setQuarantined(true);
        url.setQuarantineReason(reason != null && !reason.isBlank() ? reason.trim() : "Flagged for security policy violation");
        url.setActive(false);
        url = urlRepository.save(url);
        evictCache(url.getShortUrl());
        return ResponseEntity.ok(toCoreLinkDetailDto(url));
    }

    @PostMapping("/{hash}/unquarantine")
    @Transactional
    public ResponseEntity<CoreLinkDetailDto> unquarantineLink(@PathVariable String hash) {
        Url url = urlRepository.findByShortUrl(hash);
        if (url == null) {
            return ResponseEntity.notFound().build();
        }
        url.setQuarantined(false);
        url.setQuarantineReason(null);
        if (url.getExpiresAt() == null || url.getExpiresAt().isAfter(LocalDateTime.now())) {
            url.setActive(true);
        }
        url = urlRepository.save(url);
        evictCache(url.getShortUrl());
        return ResponseEntity.ok(toCoreLinkDetailDto(url));
    }

    @DeleteMapping("/{hash}")
    @Transactional
    public ResponseEntity<Void> deleteLink(@PathVariable String hash) {
        Url url = urlRepository.findByShortUrl(hash);
        if (url != null) {
            evictCache(url.getShortUrl());
            urlRepository.delete(url);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-quarantine")
    @Transactional
    public ResponseEntity<List<CoreLinkDetailDto>> bulkQuarantine(
            @RequestBody List<String> hashes,
            @RequestParam(required = false) String reason
    ) {
        if (hashes == null || hashes.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Url> urls = urlRepository.findAllByShortUrlIn(hashes);
        String r = reason != null && !reason.trim().isEmpty() ? reason.trim() : "Bulk quarantine by administrator";
        for (Url u : urls) {
            u.setQuarantined(true);
            u.setQuarantineReason(r);
            u.setActive(false);
            evictCache(u.getShortUrl());
        }
        urls = urlRepository.saveAll(urls);
        return ResponseEntity.ok(urls.stream().map(this::toCoreLinkDetailDto).collect(Collectors.toList()));
    }

    @PostMapping("/bulk-delete")
    @Transactional
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody List<String> hashes) {
        if (hashes == null || hashes.isEmpty()) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
        List<Url> urls = urlRepository.findAllByShortUrlIn(hashes);
        for (Url u : urls) {
            evictCache(u.getShortUrl());
        }
        urlRepository.deleteAll(urls);
        return ResponseEntity.ok(Map.of("count", urls.size()));
    }

    @PostMapping("/maintenance/preview-cleanup")
    public ResponseEntity<CoreLinkCleanupResultDto> previewCleanup(@RequestBody CoreLinkCleanupRequestDto criteria) {
        List<Url> candidates = findCleanupCandidates(criteria);
        List<String> samples = candidates.stream()
                .limit(10)
                .map(Url::getShortUrl)
                .collect(Collectors.toList());

        return ResponseEntity.ok(CoreLinkCleanupResultDto.builder()
                .dryRun(true)
                .affectedCount(candidates.size())
                .operation(criteria.isHardDelete() ? "HARD_DELETE" : "DEACTIVATE")
                .message("Found " + candidates.size() + " candidate URLs matching " + criteria.getCleanupType())
                .sampleAffectedUrls(samples)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/maintenance/execute-cleanup")
    @Transactional
    public ResponseEntity<CoreLinkCleanupResultDto> executeCleanup(@RequestBody CoreLinkCleanupRequestDto criteria) {
        List<Url> candidates = findCleanupCandidates(criteria);
        List<String> affectedHashes = new ArrayList<>();

        for (Url url : candidates) {
            affectedHashes.add(url.getShortUrl());
            evictCache(url.getShortUrl());

            if (criteria.isHardDelete()) {
                urlRepository.delete(url);
            } else {
                url.setActive(false);
                urlRepository.save(url);
            }
        }

        return ResponseEntity.ok(CoreLinkCleanupResultDto.builder()
                .dryRun(false)
                .affectedCount(candidates.size())
                .operation(criteria.isHardDelete() ? "HARD_DELETE" : "DEACTIVATE")
                .message("Successfully processed " + candidates.size() + " URLs")
                .sampleAffectedUrls(affectedHashes.stream().limit(10).collect(Collectors.toList()))
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/maintenance/warm-up")
    public ResponseEntity<Map<String, Object>> warmUpCache(@RequestParam(defaultValue = "100") int topCount) {
        List<Url> topUrls = urlRepository.findTopActiveUrls(PageRequest.of(0, Math.min(topCount, 500)));
        int warmedCount = 0;
        for (Url url : topUrls) {
            String key = "urls::" + url.getShortUrl();
            if (url.getExpiresAt() != null) {
                Duration ttl = Duration.between(LocalDateTime.now(), url.getExpiresAt());
                if (!ttl.isNegative() && !ttl.isZero()) {
                    redisTemplate.opsForValue().set(key, url.getLongUrl(), ttl);
                    warmedCount++;
                }
            } else {
                redisTemplate.opsForValue().set(key, url.getLongUrl(), Duration.ofHours(24));
                warmedCount++;
            }
        }
        return ResponseEntity.ok(Map.of("warmedCount", warmedCount, "requestedCount", topCount));
    }

    private List<Url> findCleanupCandidates(CoreLinkCleanupRequestDto criteria) {
        int days = criteria.getDaysThreshold() != null ? criteria.getDaysThreshold() : 30;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        String type = criteria.getCleanupType() != null ? criteria.getCleanupType().toUpperCase() : "EXPIRED";

        return switch (type) {
            case "EXPIRED" -> urlRepository.findByIsActiveTrueAndExpiresAtBefore(LocalDateTime.now());
            case "INACTIVE" -> urlRepository.findByIsActiveFalseAndUpdatedAtBefore(cutoff);
            case "DORMANT" -> urlRepository.findDormantUrls(cutoff);
            default -> Collections.emptyList();
        };
    }

    private CoreLinkDetailDto toCoreLinkDetailDto(Url u) {
        long clicks = u.getStatistic() != null && u.getStatistic().getAccessedTimes() != null
                ? u.getStatistic().getAccessedTimes() : 0L;

        return CoreLinkDetailDto.builder()
                .id(u.getId())
                .shortUrl(u.getShortUrl())
                .longUrl(u.getLongUrl())
                .createdAt(u.getCreatedAt())
                .expiresAt(u.getExpiresAt())
                .isActive(u.isActive())
                .isQuarantined(u.isQuarantined())
                .quarantineReason(u.getQuarantineReason())
                .isPasswordProtected(u.getPasswordHash() != null && !u.getPasswordHash().isEmpty())
                .totalClicks(clicks)
                .userId(u.getUserId())
                .build();
    }

    private void evictCache(String shortUrl) {
        if (shortUrl == null) return;
        try {
            redisTemplate.delete("urls::" + shortUrl);
            var cache = cacheManager.getCache("urls");
            if (cache != null) {
                cache.evict(shortUrl);
            }
        } catch (Exception e) {
            log.warn("Failed to evict cache for {}: {}", shortUrl, e.getMessage());
        }
    }
}
