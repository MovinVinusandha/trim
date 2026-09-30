package com.url_shortener.common.dto.core;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoreLinkDetailDto {
    private Long id;
    private String shortUrl;
    private String longUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    @JsonProperty("isActive")
    private boolean isActive;

    @JsonProperty("isQuarantined")
    private boolean isQuarantined;

    private String quarantineReason;

    @JsonProperty("isPasswordProtected")
    private boolean isPasswordProtected;

    private Long totalClicks;
    private Long userId;
}
