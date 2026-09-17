package com.url_shortener.url_shortener.admin.dto;

import com.url_shortener.url_shortener.users.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private Long id;
    private String publicId;
    private String username;
    private String email;
    private Role role;
    private boolean emailVerified;
    private LocalDateTime emailVerifiedAt;
    private Integer customMaxLinks;
    private Integer effectiveMaxLinks;

    @com.fasterxml.jackson.annotation.JsonProperty("isSuspended")
    private boolean isSuspended;

    private String suspendedReason;
    private LocalDateTime createdAt;

    // Aggregated metrics
    private long totalLinks;
    private long activeLinks;
    private long quarantinedLinks;
    private long totalClicks;

    // Associated OAuth profiles
    private List<OAuthAccountSummaryDto> oauthAccounts;

    // Recent top short links
    private List<AdminLinkDto> recentLinks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OAuthAccountSummaryDto {
        private String provider;
        private String providerEmail;
        private LocalDateTime connectedAt;
    }
}
