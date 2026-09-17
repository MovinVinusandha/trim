package com.url_shortener.url_shortener.admin.dto;

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
public class UserQuotaUpdateRequestDto {
    @Min(value = 1, message = "Quota must be at least 1")
    @Max(value = 1000000, message = "Quota cannot exceed 1,000,000")
    private Integer customMaxLinks;
}
