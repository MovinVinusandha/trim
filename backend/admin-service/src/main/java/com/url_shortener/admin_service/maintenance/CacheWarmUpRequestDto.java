package com.url_shortener.admin_service.maintenance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CacheWarmUpRequestDto {

    @Min(1)
    @Max(1000)
    @Builder.Default
    private int topCount = 50;
}
