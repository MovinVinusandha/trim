package com.url_shortener.redirect_service;

import com.url_shortener.common.event.EventTopics;
import com.url_shortener.common.event.UrlClickedEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Redirect", description = "High-speed URL redirection and unlocking")
public class RedirectController {

    private final RedirectService redirectService;
    private final EventPublisher eventPublisher;

    @Value("${app.dashboard.url:http://app.localhost}")
    private String dashboardUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnlockRequest {
        @NotBlank(message = "Password cannot be blank")
        private String password;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UnlockResponse {
        private String longUrl;
    }

    @GetMapping("/{hash:[a-zA-Z0-9-_]+}")
    @Operation(summary = "Redirect to target URL and record async click event")
    public ResponseEntity<Void> redirect(
            @PathVariable String hash,
            HttpServletRequest request
    ) {
        try {
            RedirectUrl url = redirectService.getRedirectTarget(hash);
            String longUrl = redirectService.resolveLongUrlWithCache(url);

            // Fire async click tracking via Redis event publisher
            publishClickEvent(url, longUrl, hash, request);

            // Query parameter pass-through
            if (request.getQueryString() != null && !request.getQueryString().isBlank()) {
                String separator = longUrl.contains("?") ? "&" : "?";
                longUrl = longUrl + separator + request.getQueryString();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.add("Location", longUrl);
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        } catch (RedirectService.SystemMaintenanceException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(dashboardUrl + "/maintenance/" + hash))
                    .build();
        } catch (RedirectService.LinkQuarantinedException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(dashboardUrl + "/blocked/" + hash))
                    .build();
        } catch (RedirectService.PasswordProtectedException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(dashboardUrl + "/secure/" + hash))
                    .build();
        } catch (RedirectService.UrlNotFoundException | RedirectService.LinkExpiredException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(dashboardUrl + "/not-found"))
                    .build();
        }
    }

    @PostMapping("/unlock/{hash:[a-zA-Z0-9-_]+}")
    @Operation(summary = "Unlock a password-protected short URL")
    public ResponseEntity<?> unlockUrl(
            @PathVariable String hash,
            @Valid @RequestBody UnlockRequest unlockRequest,
            HttpServletRequest request
    ) {
        log.info("UNLOCK ENDPOINT HIT - Attempting to unlock hash: {}", hash);
        try {
            RedirectUrl url = redirectService.getUrlForUnlock(hash, unlockRequest.getPassword());
            String longUrl = url.getLongUrl();

            publishClickEvent(url, longUrl, hash, request);

            return ResponseEntity.ok(new UnlockResponse(longUrl));
        } catch (RedirectService.SystemMaintenanceException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(dashboardUrl + "/maintenance/" + hash))
                    .build();
        } catch (RedirectService.LinkQuarantinedException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(dashboardUrl + "/blocked/" + hash))
                    .build();
        } catch (RedirectService.UrlNotFoundException | RedirectService.LinkExpiredException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private void publishClickEvent(RedirectUrl url, String longUrl, String hash, HttpServletRequest request) {
        try {
            String userAgent = request.getHeader("User-Agent");
            String clientIp = resolveClientIp(request);
            String referer = request.getHeader("Referer");
            Map<String, String> queryParams = extractQueryParams(request);

            UrlClickedEvent event = UrlClickedEvent.builder()
                    .urlId(url.getId())
                    .userId(url.getUserId())
                    .folderId(url.getFolderId())
                    .shortUrlHash(hash)
                    .longUrl(longUrl)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .referer(referer)
                    .queryParams(queryParams)
                    .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                    .build();

            eventPublisher.publish(EventTopics.TOPIC_URL_CLICKED, event);
        } catch (Exception e) {
            log.warn("Failed to publish UrlClickedEvent for hash {}: {}", hash, e.getMessage());
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private Map<String, String> extractQueryParams(HttpServletRequest request) {
        Map<String, String> queryParams = new HashMap<>();
        if (request.getParameterMap() != null) {
            for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
                if (entry.getValue() != null && entry.getValue().length > 0) {
                    queryParams.put(entry.getKey(), entry.getValue()[0]);
                }
            }
        }
        return queryParams;
    }
}
