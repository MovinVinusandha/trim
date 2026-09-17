package com.url_shortener.url_shortener.analytics;

import com.url_shortener.url_shortener.analytics.dto.AnalyticsResponseDto;
import com.url_shortener.url_shortener.urls.UrlNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
        private final EventStreamService eventStreamService;

    @GetMapping("/analytics/{hash}")
    @Operation(summary = "Get detailed analytics for a short URL")
    public ResponseEntity<AnalyticsResponseDto> getAnalytics(
            @PathVariable String hash,
            @RequestParam(name = "period", defaultValue = "all") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String utmSource,
            @RequestParam(required = false) String utmMedium,
            @RequestParam(required = false) String utmCampaign,
            @RequestParam(required = false) String utmTerm,
            @RequestParam(required = false) String utmContent,
            @RequestParam(required = false) String referer,
            @RequestHeader("X-User-Id") Long userId) {
        
                

        AnalyticsResponseDto response = analyticsService.getAnalytics(hash, userId, period, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get overall analytics for all URLs owned by the current user")
    public ResponseEntity<AnalyticsResponseDto> getOverallAnalytics(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(name = "period", defaultValue = "all") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String hash,
            @RequestParam(required = false) List<Long> tagId,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String utmSource,
            @RequestParam(required = false) String utmMedium,
            @RequestParam(required = false) String utmCampaign,
            @RequestParam(required = false) String utmTerm,
            @RequestParam(required = false) String utmContent,
            @RequestParam(required = false) String referer) {
                
        return ResponseEntity.ok(analyticsService.getOverallAnalytics(userId, period, startDate, endDate, hash, tagId, folderId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
    }

    @GetMapping("/analytics/folder/{folderId}")
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
            @RequestParam(required = false) String referer) {
                
        return ResponseEntity.ok(analyticsService.getFolderAnalytics(folderId, userId, period, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
    }

    @GetMapping("/analytics/folder/slug/{slug}")
    public ResponseEntity<AnalyticsResponseDto> getFolderAnalyticsBySlug(
            @PathVariable String slug, 
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(name = "period", defaultValue = "all") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String utmSource,
            @RequestParam(required = false) String utmMedium,
            @RequestParam(required = false) String utmCampaign,
            @RequestParam(required = false) String utmTerm,
            @RequestParam(required = false) String utmContent,
            @RequestParam(required = false) String referer) {
                
        return ResponseEntity.ok(analyticsService.getFolderAnalyticsBySlug(slug, userId, period, startDate, endDate, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referer));
    }
    @GetMapping("/analytics/usage")
    @Operation(summary = "Get global usage stats for the current user")
    public ResponseEntity<UserUsageStatsDto> getUserUsageStats(@RequestHeader("X-User-Id") Long userId) {
                
        return ResponseEntity.ok(analyticsService.getUserUsageStats(userId));
    }

    @GetMapping("/analytics/events")
    @Operation(summary = "Get paginated raw click events stream for the current user")
    public ResponseEntity<org.springframework.data.domain.Page<com.url_shortener.url_shortener.analytics.dto.ClickEventDto>> getEvents(
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
                

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(0, page),
                Math.min(100, Math.max(1, size))
        );

        return ResponseEntity.ok(analyticsService.getPaginatedEvents(
                userId, period, startDate, endDate, hash, country, city, device, browser, os, campaign, search, pageable
        ));
    }

    @GetMapping(value = "/analytics/events/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to live real-time click events stream via Server-Sent Events (SSE)")
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamEvents(@RequestHeader("X-User-Id") Long userId) {
                return eventStreamService.subscribe(userId);
    }
}
