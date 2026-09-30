package com.url_shortener.common.dto.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoreTriageSummaryDto {
    private long needsAttentionCount;
    private long spikeCount;
    private long quarantinedCount;
    private long createdLast24hCount;
    private long totalLinks;
}
