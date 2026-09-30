package com.url_shortener.gateway.config;

import io.jsonwebtoken.security.Keys;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;

@Data
@Configuration
@ConfigurationProperties(prefix = "spring.jwt")
public class JwtConfig {
    private String secret;

    public SecretKey getSecretKey() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("spring.jwt.secret is not configured");
        }
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
