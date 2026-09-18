package com.url_shortener.analytics_service.controller;

import com.url_shortener.analytics_service.service.AnalyticsService;
import com.url_shortener.common.dto.analytics.AnalyticsAdminOverviewDto;
import com.url_shortener.common.dto.analytics.AnalyticsResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/internal/analytics")
@RequiredArgsConstructor
public class InternalAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/admin/overview")
    public ResponseEntity<AnalyticsAdminOverviewDto> getAdminOverview(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(analyticsService.getAdminOverviewStats(days));
    }

    @GetMapping("/urls/{urlId}/count")
    public ResponseEntity<Long> getUrlClickCount(@PathVariable Long urlId) {
        return ResponseEntity.ok(analyticsService.getUrlClickCount(urlId));
    }

    @GetMapping("/query")
    public ResponseEntity<AnalyticsResponseDto> queryAnalytics(
            @RequestParam Long urlId,
            @RequestParam(name = "period", defaultValue = "all") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String utmSource,
            @RequestParam(required = false) String utmMedium,
            @RequestParam(required = false) String utmCampaign,
            @RequestParam(required = false) String utmTerm,
            @RequestParam(required = false) String utmContent,
            @RequestParam(required = false) String referer
    ) {
        return ResponseEntity.ok(analyticsService.getAnalytics(
                urlId, period, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer
        ));
    }

    @GetMapping("/maintenance/preview-click-pruning")
    public ResponseEntity<Long> previewClickPruning(@RequestParam(defaultValue = "90") int daysOlderThan) {
        return ResponseEntity.ok(analyticsService.countClickEventsOlderThan(daysOlderThan));
    }

    @PostMapping("/maintenance/execute-click-pruning")
    public ResponseEntity<Integer> executeClickPruning(@RequestParam(defaultValue = "90") int daysOlderThan) {
        return ResponseEntity.ok(analyticsService.pruneClickEvents(daysOlderThan));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUserAnalytics(@PathVariable Long userId) {
        analyticsService.purgeUserData(userId);
        return ResponseEntity.ok(Map.of("message", "User analytics purged"));
    }
}
