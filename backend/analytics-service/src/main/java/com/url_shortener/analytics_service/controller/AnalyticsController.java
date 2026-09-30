package com.url_shortener.analytics_service.controller;

import com.url_shortener.analytics_service.service.AnalyticsService;
import com.url_shortener.analytics_service.service.EventStreamService;
import com.url_shortener.common.dto.analytics.AnalyticsResponseDto;
import com.url_shortener.common.dto.analytics.ClickEventDto;
import com.url_shortener.common.dto.analytics.UserUsageStatsDto;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final EventStreamService eventStreamService;

    @GetMapping("/analytics/{urlId}")
    @Operation(summary = "Get detailed analytics for a short URL by its ID or hash")
    public ResponseEntity<AnalyticsResponseDto> getAnalytics(
            @PathVariable Long urlId,
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
        AnalyticsResponseDto response = analyticsService.getAnalytics(
                urlId, period, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get overall analytics for all URLs owned by current user")
    public ResponseEntity<AnalyticsResponseDto> getOverallAnalytics(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(name = "period", defaultValue = "all") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String hash,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String utmSource,
            @RequestParam(required = false) String utmMedium,
            @RequestParam(required = false) String utmCampaign,
            @RequestParam(required = false) String utmTerm,
            @RequestParam(required = false) String utmContent,
            @RequestParam(required = false) String referer
    ) {
        return ResponseEntity.ok(analyticsService.getOverallAnalytics(
                userId, period, startDate, endDate, hash, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer
        ));
    }

    @GetMapping("/analytics/folder/{folderId}")
    @Operation(summary = "Get analytics for a specific folder")
    public ResponseEntity<AnalyticsResponseDto> getFolderAnalytics(
            @PathVariable Long folderId,
            @RequestHeader("X-User-Id") Long userId,
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
        return ResponseEntity.ok(analyticsService.getFolderAnalytics(
                folderId, userId, period, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer
        ));
    }

    @GetMapping("/analytics/usage")
    @Operation(summary = "Get global usage stats for the current user")
    public ResponseEntity<UserUsageStatsDto> getUserUsageStats(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(analyticsService.getUserUsageStats(userId));
    }

    @GetMapping("/analytics/events")
    @Operation(summary = "Get paginated raw click events stream for the current user")
    public ResponseEntity<Page<ClickEventDto>> getEvents(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(name = "period", defaultValue = "all") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String hash,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String device,
            @RequestParam(required = false) String browser,
            @RequestParam(required = false) String os,
            @RequestParam(required = false) String campaign,
            @RequestParam(required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "30") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        return ResponseEntity.ok(analyticsService.getPaginatedEvents(
                userId, period, startDate, endDate, hash, country, city, device, browser, os, campaign, search, pageable
        ));
    }

    @GetMapping(value = "/analytics/events/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to live real-time click events stream via Server-Sent Events (SSE)")
    public SseEmitter streamEvents(@RequestHeader("X-User-Id") Long userId) {
        return eventStreamService.subscribe(userId);
    }
}
