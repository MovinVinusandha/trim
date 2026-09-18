package com.url_shortener.url_shortener.client;

import com.url_shortener.common.dto.analytics.AnalyticsAdminOverviewDto;
import com.url_shortener.common.dto.analytics.AnalyticsResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Component
@Slf4j
public class AnalyticsServiceClient {

    private final RestTemplate restTemplate;
    private final String analyticsServiceUrl;

    public AnalyticsServiceClient(
            RestTemplate restTemplate,
            @Value("${app.services.analytics-service-url:${ANALYTICS_SERVICE_INTERNAL_URL:http://analytics-service:8083}}") String analyticsServiceUrl
    ) {
        this.restTemplate = restTemplate;
        this.analyticsServiceUrl = analyticsServiceUrl;
    }

    public long getUrlClickCount(Long urlId) {
        try {
            Long count = restTemplate.getForObject(analyticsServiceUrl + "/internal/analytics/urls/" + urlId + "/count", Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            log.warn("Failed to get click count from analytics-service for urlId {}: {}", urlId, e.getMessage());
            return 0L;
        }
    }

    public AnalyticsAdminOverviewDto getAdminOverview(int days) {
        try {
            return restTemplate.getForObject(analyticsServiceUrl + "/internal/analytics/admin/overview?days=" + days, AnalyticsAdminOverviewDto.class);
        } catch (Exception e) {
            log.warn("Failed to get admin overview stats from analytics-service: {}", e.getMessage());
            return AnalyticsAdminOverviewDto.builder()
                    .totalClicks(0)
                    .clicksLast24Hours(0)
                    .clicksByDate(Collections.emptyMap())
                    .deviceDistribution(Collections.emptyList())
                    .countryDistribution(Collections.emptyList())
                    .build();
        }
    }

    public long previewClickPruning(int daysOlderThan) {
        try {
            Long count = restTemplate.getForObject(analyticsServiceUrl + "/internal/analytics/maintenance/preview-click-pruning?daysOlderThan=" + daysOlderThan, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            log.warn("Failed to preview click pruning from analytics-service: {}", e.getMessage());
            return 0L;
        }
    }

    public int executeClickPruning(int daysOlderThan) {
        try {
            Integer deleted = restTemplate.postForObject(analyticsServiceUrl + "/internal/analytics/maintenance/execute-click-pruning?daysOlderThan=" + daysOlderThan, null, Integer.class);
            return deleted != null ? deleted : 0;
        } catch (Exception e) {
            log.warn("Failed to execute click pruning from analytics-service: {}", e.getMessage());
            return 0;
        }
    }

    public void purgeUserData(Long userId) {
        try {
            restTemplate.delete(analyticsServiceUrl + "/internal/analytics/users/" + userId);
        } catch (Exception e) {
            log.warn("Failed to purge user data from analytics-service for userId {}: {}", userId, e.getMessage());
        }
    }
}
