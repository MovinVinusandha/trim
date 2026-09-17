package com.url_shortener.auth_service.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreatScanRequestDto {
    @NotBlank(message = "URL cannot be blank")
    private String url;
}
