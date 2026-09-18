package com.url_shortener.url_shortener.admin;

import com.url_shortener.common.Role;
import com.url_shortener.common.dto.AdminUserActionRequestDto;
import com.url_shortener.common.dto.InternalUserSummaryDto;
import com.url_shortener.common.dto.UserCountsDto;
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

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AuthServiceClient {

    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthServiceClient(
            RestTemplateBuilder builder,
            @Value("${app.services.auth-service-url:http://auth-service:8081}") String authServiceUrl
    ) {
        this.restTemplate = builder.build();
        this.authServiceUrl = authServiceUrl.replaceAll("/$", "");
    }

    public UserCountsDto getUserCounts() {
        try {
            return restTemplate.getForObject(authServiceUrl + "/internal/users/counts", UserCountsDto.class);
        } catch (Exception e) {
            log.warn("Failed to get user counts from auth-service: {}", e.getMessage());
            return new UserCountsDto(0, 0, 0);
        }
    }

    public Page<InternalUserSummaryDto> getUsers(int page, int size, String search) {
        try {
            String url = authServiceUrl + "/internal/users?page=" + page + "&size=" + size;
            if (search != null && !search.trim().isBlank()) {
                url += "&search=" + java.net.URLEncoder.encode(search.trim(), java.nio.charset.StandardCharsets.UTF_8);
            }

            ResponseEntity<RestResponsePage<InternalUserSummaryDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<RestResponsePage<InternalUserSummaryDto>>() {}
            );
            return response.getBody() != null ? response.getBody() : new PageImpl<>(Collections.emptyList());
        } catch (Exception e) {
            log.warn("Failed to get users from auth-service: {}", e.getMessage());
            return new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), 0);
        }
    }

    public InternalUserSummaryDto getUserByPublicId(String publicId) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/internal/users/" + publicId, InternalUserSummaryDto.class);
        } catch (Exception e) {
            log.warn("Failed to get user by publicId {} from auth-service: {}", publicId, e.getMessage());
            return null;
        }
    }

    public InternalUserSummaryDto getUserById(Long id) {
        try {
            return restTemplate.getForObject(authServiceUrl + "/internal/users/id/" + id, InternalUserSummaryDto.class);
        } catch (Exception e) {
            log.warn("Failed to get user by id {} from auth-service: {}", id, e.getMessage());
            return null;
        }
    }

    public InternalUserSummaryDto toggleUserSuspension(String publicId, String reason, Long currentAdminId) {
        var body = AdminUserActionRequestDto.builder()
                .reason(reason)
                .currentAdminId(currentAdminId)
                .build();
        return restTemplate.postForObject(authServiceUrl + "/internal/users/" + publicId + "/suspend", body, InternalUserSummaryDto.class);
    }

    public InternalUserSummaryDto updateUserRole(String publicId, Role role, Long currentAdminId) {
        var body = AdminUserActionRequestDto.builder()
                .role(role)
                .currentAdminId(currentAdminId)
                .build();
        return restTemplate.postForObject(authServiceUrl + "/internal/users/" + publicId + "/role", body, InternalUserSummaryDto.class);
    }

    public InternalUserSummaryDto updateUserQuota(String publicId, Integer customMaxLinks) {
        var body = AdminUserActionRequestDto.builder()
                .customMaxLinks(customMaxLinks)
                .build();
        return restTemplate.postForObject(authServiceUrl + "/internal/users/" + publicId + "/quota", body, InternalUserSummaryDto.class);
    }

    public InternalUserSummaryDto manuallyVerifyEmail(String publicId) {
        return restTemplate.postForObject(authServiceUrl + "/internal/users/" + publicId + "/verify-email", null, InternalUserSummaryDto.class);
    }

    public void resendVerificationEmail(String publicId) {
        restTemplate.postForObject(authServiceUrl + "/internal/users/" + publicId + "/resend-verification", null, Void.class);
    }

    public InternalUserSummaryDto deleteUser(String publicId, Long currentAdminId) {
        String url = authServiceUrl + "/internal/users/" + publicId + (currentAdminId != null ? "?currentAdminId=" + currentAdminId : "");
        ResponseEntity<InternalUserSummaryDto> res = restTemplate.exchange(url, HttpMethod.DELETE, null, InternalUserSummaryDto.class);
        return res.getBody();
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
