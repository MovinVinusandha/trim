package com.url_shortener.admin_service.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedIpRequestDto {
    @NotBlank(message = "IP address or CIDR cannot be blank")
    private String ipAddress;

    private String reason;
}
