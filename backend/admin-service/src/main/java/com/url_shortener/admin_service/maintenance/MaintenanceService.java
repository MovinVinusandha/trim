package com.url_shortener.admin_service.maintenance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.url_shortener.admin_service.audit.AdminAuditContextHolder;
import com.url_shortener.admin_service.audit.AdminAuditService;
import com.url_shortener.admin_service.client.AnalyticsServiceClient;
import com.url_shortener.admin_service.client.CoreServiceClient;
import com.url_shortener.common.dto.core.CoreLinkCleanupRequestDto;
import com.url_shortener.common.dto.core.CoreLinkCleanupResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final StringRedisTemplate redisTemplate;
    private final CoreServiceClient coreServiceClient;
    private final AnalyticsServiceClient analyticsServiceClient;
    private final AdminAuditService auditService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get real-time storage metrics from MySQL information_schema and Redis INFO.
     */
    public MaintenanceOverviewDto getOverview() {
        MaintenanceOverviewDto.MaintenanceOverviewDtoBuilder builder = MaintenanceOverviewDto.builder();

        // 1. Redis Telemetry
        try {
            Properties info = redisTemplate.getRequiredConnectionFactory().getConnection().serverCommands().info();
            if (info != null) {
                builder.redisConnected(true);
                builder.redisVersion(info.getProperty("redis_version", "unknown"));
                builder.usedMemoryHuman(info.getProperty("used_memory_human", "N/A"));
                builder.peakMemoryHuman(info.getProperty("used_memory_peak_human", "N/A"));
                builder.connectedClients(parseLong(info.getProperty("connected_clients")));
                builder.uptimeSeconds(parseLong(info.getProperty("uptime_in_seconds")));
                long hits = parseLong(info.getProperty("keyspace_hits"));
                long misses = parseLong(info.getProperty("keyspace_misses"));
                builder.keyspaceHits(hits);
                builder.keyspaceMisses(misses);
                long totalOps = hits + misses;
                double hitRatio = totalOps > 0 ? ((double) hits / totalOps) * 100.0 : 0.0;
                builder.hitRatioPercentage(Math.round(hitRatio * 10.0) / 10.0);
            }

            Long totalKeys = redisTemplate.execute(RedisConnection::dbSize);
            builder.totalKeys(totalKeys != null ? totalKeys : 0L);

            // Count keys matching urls::*
            long urlKeyCount = 0;
            ScanOptions options = ScanOptions.scanOptions().match("urls::*").count(100).build();
            try (Cursor<byte[]> cursor = redisTemplate.getRequiredConnectionFactory().getConnection().keyCommands().scan(options)) {
                while (cursor.hasNext()) {
                    cursor.next();
                    urlKeyCount++;
                }
            }
            builder.urlKeysCount(urlKeyCount);

        } catch (Exception e) {
            log.warn("Failed to retrieve Redis telemetry: {}", e.getMessage());
            builder.redisConnected(false);
            builder.usedMemoryHuman("Unavailable");
            builder.peakMemoryHuman("Unavailable");
            builder.totalKeys(0L);
            builder.urlKeysCount(0L);
            builder.hitRatioPercentage(0.0);
        }

        // 2. MySQL Database Telemetry
        try {
            String sql = """
                SELECT 
                    table_name AS tbl_name, 
                    ROUND(((data_length + index_length) / 1024 / 1024), 3) AS size_mb,
                    table_rows AS row_cnt
                FROM information_schema.TABLES 
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC
            """;

            List<MaintenanceOverviewDto.TableStorageDto> tableList = jdbcTemplate.query(sql, (rs, rowNum) ->
                    MaintenanceOverviewDto.TableStorageDto.builder()
                            .tableName(rs.getString("tbl_name"))
                            .sizeMb(rs.getDouble("size_mb"))
                            .rowCount(rs.getLong("row_cnt"))
                            .build()
            );

            double totalDbSize = tableList.stream()
                    .mapToDouble(MaintenanceOverviewDto.TableStorageDto::getSizeMb)
                    .sum();

            builder.totalDatabaseSizeMb(Math.round(totalDbSize * 100.0) / 100.0);
            builder.tables(tableList);
        } catch (Exception e) {
            log.warn("Failed to retrieve MySQL table telemetry: {}", e.getMessage());
            builder.totalDatabaseSizeMb(0.0);
            builder.tables(Collections.emptyList());
        }

        return builder.build();
    }

    /**
     * Evict a specific cache key or URL hash.
     */
    public boolean evictKey(String key) {
        String normalizedKey = key.startsWith("urls::") ? key : "urls::" + key;
        Boolean deleted = redisTemplate.delete(normalizedKey);
        recordAudit(
                "CACHE_EVICT_KEY",
                "REDIS",
                normalizedKey,
                "Admin manually evicted key " + normalizedKey,
                Map.of("key", normalizedKey, "existed", Boolean.TRUE.equals(deleted))
        );
        return Boolean.TRUE.equals(deleted);
    }

    /**
     * Flush all URL cache keys (`urls::*`).
     */
    public long flushUrlCache() {
        Set<String> keysToDelete = new HashSet<>();
        ScanOptions options = ScanOptions.scanOptions().match("urls::*").count(200).build();
        try (Cursor<byte[]> cursor = redisTemplate.getRequiredConnectionFactory().getConnection().keyCommands().scan(options)) {
            while (cursor.hasNext()) {
                keysToDelete.add(new String(cursor.next()));
            }
        }

        if (!keysToDelete.isEmpty()) {
            redisTemplate.delete(keysToDelete);
        }

        recordAudit(
                "CACHE_FLUSH_URLS",
                "REDIS",
                "urls::*",
                "Flushed all cached URL keys",
                Map.of("keysFlushed", keysToDelete.size())
        );

        return keysToDelete.size();
    }

    /**
     * Flush entire Redis database (ROOT only).
     */
    public void flushAllCache() {
        redisTemplate.getRequiredConnectionFactory().getConnection().serverCommands().flushDb();
        recordAudit(
                "CACHE_FLUSH_ALL",
                "REDIS",
                "ALL_DATABASES",
                "Full Redis FLUSHDB invoked by Root",
                Collections.emptyMap()
        );
    }

    /**
     * Warm up Redis cache with top accessed short URLs.
     */
    public int warmUpCache(int topCount) {
        int warmedCount = coreServiceClient.warmUpCache(topCount);

        recordAudit(
                "CACHE_WARM_UP",
                "REDIS",
                "TOP_" + topCount,
                "Pre-populated Redis with top active URLs",
                Map.of("requestedCount", topCount, "warmedCount", warmedCount)
        );

        return warmedCount;
    }

    /**
     * Preview candidate links for garbage collection.
     */
    public CleanupResultDto previewLinkCleanup(CleanupCriteriaDto criteria) {
        CoreLinkCleanupRequestDto request = CoreLinkCleanupRequestDto.builder()
                .cleanupType(criteria.getCleanupType().name())
                .daysThreshold(criteria.getDaysThreshold())
                .hardDelete(criteria.isHardDelete())
                .build();

        CoreLinkCleanupResultDto coreResult = coreServiceClient.previewCleanup(request);

        return CleanupResultDto.builder()
                .dryRun(true)
                .affectedCount(coreResult != null ? coreResult.getAffectedCount() : 0)
                .operation(criteria.isHardDelete() ? "HARD_DELETE" : "DEACTIVATE")
                .message(coreResult != null ? coreResult.getMessage() : "Preview complete")
                .sampleAffectedUrls(coreResult != null ? coreResult.getSampleAffectedUrls() : Collections.emptyList())
                .timestamp(coreResult != null && coreResult.getTimestamp() != null ? coreResult.getTimestamp() : java.time.LocalDateTime.now())
                .build();
    }

    /**
     * Execute garbage collection on candidate links.
     */
    public CleanupResultDto executeLinkCleanup(CleanupCriteriaDto criteria) {
        CoreLinkCleanupRequestDto request = CoreLinkCleanupRequestDto.builder()
                .cleanupType(criteria.getCleanupType().name())
                .daysThreshold(criteria.getDaysThreshold())
                .hardDelete(criteria.isHardDelete())
                .build();

        CoreLinkCleanupResultDto coreResult = coreServiceClient.executeCleanup(request);
        long count = coreResult != null ? coreResult.getAffectedCount() : 0;

        recordAudit(
                criteria.isHardDelete() ? "LINKS_PURGE_HARD" : "LINKS_PURGE_DEACTIVATE",
                "URL_STORE",
                criteria.getCleanupType().name(),
                "Garbage collected " + count + " links",
                Map.of(
                        "type", criteria.getCleanupType().name(),
                        "hardDelete", criteria.isHardDelete(),
                        "count", count
                )
        );

        return CleanupResultDto.builder()
                .dryRun(false)
                .affectedCount(count)
                .operation(criteria.isHardDelete() ? "HARD_DELETE" : "DEACTIVATE")
                .message(coreResult != null ? coreResult.getMessage() : "Cleanup executed")
                .sampleAffectedUrls(coreResult != null ? coreResult.getSampleAffectedUrls() : Collections.emptyList())
                .timestamp(coreResult != null && coreResult.getTimestamp() != null ? coreResult.getTimestamp() : java.time.LocalDateTime.now())
                .build();
    }

    /**
     * Preview click events older than threshold.
     */
    public CleanupResultDto previewClickPruning(int daysOlderThan) {
        long count = analyticsServiceClient.previewClickPruning(daysOlderThan);

        return CleanupResultDto.builder()
                .dryRun(true)
                .affectedCount(count)
                .operation("PRUNE_CLICK_EVENTS")
                .message("Found " + count + " raw click events older than " + daysOlderThan + " days")
                .sampleAffectedUrls(Collections.emptyList())
                .timestamp(java.time.LocalDateTime.now())
                .build();
    }

    /**
     * Execute click event pruning.
     */
    public CleanupResultDto executeClickPruning(int daysOlderThan) {
        int deleted = analyticsServiceClient.executeClickPruning(daysOlderThan);

        recordAudit(
                "CLICK_EVENTS_PRUNED",
                "ANALYTICS_STORE",
                "OLDER_THAN_" + daysOlderThan + "_DAYS",
                "Pruned raw click events older than " + daysOlderThan + " days",
                Map.of("daysOlderThan", daysOlderThan, "deletedRecords", deleted)
        );

        return CleanupResultDto.builder()
                .dryRun(false)
                .affectedCount(deleted)
                .operation("PRUNE_CLICK_EVENTS")
                .message("Successfully pruned " + deleted + " raw click events")
                .sampleAffectedUrls(Collections.emptyList())
                .timestamp(java.time.LocalDateTime.now())
                .build();
    }

    private void recordAudit(String action, String targetType, String targetIdentifier, String details, Map<String, Object> metadata) {
        try {
            var ctx = AdminAuditContextHolder.getContext();
            Long actorId = ctx != null ? ctx.getActorId() : null;
            String actorEmail = ctx != null ? ctx.getActorEmail() : "system@trim.local";
            String actorRole = ctx != null ? ctx.getActorRole() : "ADMIN";
            String actorIp = ctx != null ? ctx.getActorIp() : "127.0.0.1";

            String metaJson = metadata != null ? objectMapper.writeValueAsString(metadata) : "{}";
            auditService.record(actorId, actorEmail, actorRole, actorIp, action, targetType, targetIdentifier, details, metaJson);
        } catch (Exception e) {
            log.warn("Failed to record maintenance audit log for action {}: {}", action, e.getMessage());
        }
    }

    private long parseLong(String val) {
        if (val == null || val.isBlank()) return 0L;
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
