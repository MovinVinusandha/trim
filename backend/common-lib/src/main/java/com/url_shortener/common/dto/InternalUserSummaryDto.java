package com.url_shortener.common.dto;

import com.url_shortener.common.Role;
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
public class InternalUserSummaryDto {
    private Long id;
    private String publicId;
    private String username;
    private String email;
    private Role role;
    private boolean emailVerified;
    private LocalDateTime emailVerifiedAt;
    private Integer customMaxLinks;
    private boolean isSuspended;
    private String suspendedReason;
    private List<String> connectedOAuthProviders;
    private LocalDateTime createdAt;
}
