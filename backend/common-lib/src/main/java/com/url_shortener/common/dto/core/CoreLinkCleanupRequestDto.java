package com.url_shortener.common.dto.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoreLinkCleanupRequestDto {
    private String cleanupType; // EXPIRED, INACTIVE, DORMANT
    private Integer daysThreshold;
    private boolean hardDelete;
}
