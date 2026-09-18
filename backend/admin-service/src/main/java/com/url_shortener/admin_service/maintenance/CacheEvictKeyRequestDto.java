package com.url_shortener.admin_service.maintenance;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CacheEvictKeyRequestDto {
    @NotBlank(message = "Cache key or URL hash cannot be empty")
    private String key;
}
