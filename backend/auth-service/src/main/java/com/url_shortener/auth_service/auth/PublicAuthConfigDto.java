package com.url_shortener.auth_service.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicAuthConfigDto {
    private boolean isSelfHosted;
    private boolean allowRegistration;
    private boolean requireEmailVerification;
    private boolean googleOAuthEnabled;
    private boolean githubOAuthEnabled;
    private boolean smtpConfigured;
    @Builder.Default
    private String systemMode = "NORMAL";
}
