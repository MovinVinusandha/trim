package com.url_shortener.admin_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuarantineRequestDto {
    @NotBlank(message = "Quarantine reason is required")
    private String reason;
}
