package com.url_shortener.admin_service.client;

import com.url_shortener.common.dto.core.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class CoreServiceClient {

    private final RestTemplate restTemplate;
    private final String coreServiceUrl;

    public CoreServiceClient(
            RestTemplateBuilder builder,
            @Value("${app.services.core-service-url:${CORE_SERVICE_INTERNAL_URL:http://core-service:8082}}") String coreServiceUrl
    ) {
        this.restTemplate = builder.build();
        this.coreServiceUrl = coreServiceUrl.replaceAll("/$", "");
    }

    public CoreLinkCountsDto getLinkCounts() {
        try {
            return restTemplate.getForObject(coreServiceUrl + "/internal/core/links/counts", CoreLinkCountsDto.class);
        } catch (Exception e) {
            log.warn("Failed to get link counts from core-service: {}", e.getMessage());
            return new CoreLinkCountsDto(0, 0, 0, 0, 0);
        }
    }

    public CoreTriageSummaryDto getTriageSummary() {
        try {
            return restTemplate.getForObject(coreServiceUrl + "/internal/core/links/triage-summary", CoreTriageSummaryDto.class);
        } catch (Exception e) {
            log.warn("Failed to get triage summary from core-service: {}", e.getMessage());
            return new CoreTriageSummaryDto(0, 0, 0, 0, 0);
        }
    }

    public Page<CoreLinkDetailDto> getLinks(
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
        try {
            StringBuilder sb = new StringBuilder(coreServiceUrl)
                    .append("/internal/core/links?page=").append(page)
                    .append("&size=").append(size)
                    .append("&sortBy=").append(sortBy != null ? sortBy : "createdAt")
                    .append("&sortDir=").append(sortDir != null ? sortDir : "DESC");

            if (search != null && !search.isBlank()) {
                sb.append("&search=").append(URLEncoder.encode(search.trim(), StandardCharsets.UTF_8));
            }
            if (status != null && !status.isBlank()) {
                sb.append("&status=").append(URLEncoder.encode(status.trim(), StandardCharsets.UTF_8));
            }
            if (startDate != null) {
                sb.append("&startDate=").append(startDate);
            }
            if (endDate != null) {
                sb.append("&endDate=").append(endDate);
            }
            if (minClicks != null && minClicks > 0) {
                sb.append("&minClicks=").append(minClicks);
            }
            if (domain != null && !domain.isBlank()) {
                sb.append("&domain=").append(URLEncoder.encode(domain.trim(), StandardCharsets.UTF_8));
            }

            ResponseEntity<RestResponsePage<CoreLinkDetailDto>> response = restTemplate.exchange(
                    sb.toString(),
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<RestResponsePage<CoreLinkDetailDto>>() {}
            );
            return response.getBody() != null ? response.getBody() : new PageImpl<>(Collections.emptyList());
        } catch (Exception e) {
            log.warn("Failed to query links from core-service: {}", e.getMessage());
            return new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), 0);
        }
    }

    public List<CoreLinkDetailDto> getUserLinks(Long userId) {
        try {
            CoreLinkDetailDto[] arr = restTemplate.getForObject(coreServiceUrl + "/internal/core/links/user/" + userId, CoreLinkDetailDto[].class);
            return arr != null ? Arrays.asList(arr) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to get user links for userId {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public Map<String, Long> getTopDomains(int limit) {
        try {
            ResponseEntity<Map<String, Long>> resp = restTemplate.exchange(
                    coreServiceUrl + "/internal/core/links/top-domains?limit=" + limit,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Long>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Failed to get top domains from core-service: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    public Map<String, Long> getLinksCreatedByDate(LocalDateTime startDate) {
        try {
            ResponseEntity<Map<String, Long>> resp = restTemplate.exchange(
                    coreServiceUrl + "/internal/core/links/created-by-date?startDate=" + startDate,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Long>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Failed to get links created by date from core-service: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    public CoreLinkDetailDto quarantineLink(String hash, String reason) {
        String url = coreServiceUrl + "/internal/core/links/" + hash + "/quarantine" +
                (reason != null && !reason.isBlank() ? "?reason=" + URLEncoder.encode(reason.trim(), StandardCharsets.UTF_8) : "");
        return restTemplate.postForObject(url, null, CoreLinkDetailDto.class);
    }

    public CoreLinkDetailDto unquarantineLink(String hash) {
        return restTemplate.postForObject(coreServiceUrl + "/internal/core/links/" + hash + "/unquarantine", null, CoreLinkDetailDto.class);
    }

    public void deleteLink(String hash) {
        restTemplate.delete(coreServiceUrl + "/internal/core/links/" + hash);
    }

    public List<CoreLinkDetailDto> bulkQuarantine(List<String> hashes, String reason) {
        try {
            String url = coreServiceUrl + "/internal/core/links/bulk-quarantine" +
                    (reason != null && !reason.isBlank() ? "?reason=" + URLEncoder.encode(reason.trim(), StandardCharsets.UTF_8) : "");
            ResponseEntity<List<CoreLinkDetailDto>> resp = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new org.springframework.http.HttpEntity<>(hashes),
                    new ParameterizedTypeReference<List<CoreLinkDetailDto>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed bulk quarantine on core-service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public void bulkDelete(List<String> hashes) {
        try {
            restTemplate.postForObject(coreServiceUrl + "/internal/core/links/bulk-delete", hashes, Map.class);
        } catch (Exception e) {
            log.warn("Failed bulk delete on core-service: {}", e.getMessage());
        }
    }

    public CoreLinkCleanupResultDto previewCleanup(CoreLinkCleanupRequestDto criteria) {
        return restTemplate.postForObject(coreServiceUrl + "/internal/core/links/maintenance/preview-cleanup", criteria, CoreLinkCleanupResultDto.class);
    }

    public CoreLinkCleanupResultDto executeCleanup(CoreLinkCleanupRequestDto criteria) {
        return restTemplate.postForObject(coreServiceUrl + "/internal/core/links/maintenance/execute-cleanup", criteria, CoreLinkCleanupResultDto.class);
    }

    public int warmUpCache(int topCount) {
        try {
            Map resp = restTemplate.postForObject(coreServiceUrl + "/internal/core/links/maintenance/warm-up?topCount=" + topCount, null, Map.class);
            if (resp != null && resp.containsKey("warmedCount")) {
                return ((Number) resp.get("warmedCount")).intValue();
            }
        } catch (Exception e) {
            log.warn("Failed cache warm up on core-service: {}", e.getMessage());
        }
        return 0;
    }

    public static class RestResponsePage<T> extends PageImpl<T> {
        @com.fasterxml.jackson.annotation.JsonCreator(mode = com.fasterxml.jackson.annotation.JsonCreator.Mode.PROPERTIES)
        public RestResponsePage(
                @com.fasterxml.jackson.annotation.JsonProperty("content") List<T> content,
                @com.fasterxml.jackson.annotation.JsonProperty("number") int number,
                @com.fasterxml.jackson.annotation.JsonProperty("size") int size,
                @com.fasterxml.jackson.annotation.JsonProperty("totalElements") Long totalElements,
                @com.fasterxml.jackson.annotation.JsonProperty("pageable") com.fasterxml.jackson.databind.JsonNode pageable,
                @com.fasterxml.jackson.annotation.JsonProperty("last") boolean last,
                @com.fasterxml.jackson.annotation.JsonProperty("totalPages") int totalPages,
                @com.fasterxml.jackson.annotation.JsonProperty("sort") com.fasterxml.jackson.databind.JsonNode sort,
                @com.fasterxml.jackson.annotation.JsonProperty("first") boolean first,
                @com.fasterxml.jackson.annotation.JsonProperty("numberOfElements") int numberOfElements) {
            super(content != null ? content : Collections.emptyList(), PageRequest.of(number, size > 0 ? size : 10), totalElements != null ? totalElements : 0);
        }

        public RestResponsePage(List<T> content) {
            super(content);
        }

        public RestResponsePage() {
            super(Collections.emptyList());
        }
    }
}
