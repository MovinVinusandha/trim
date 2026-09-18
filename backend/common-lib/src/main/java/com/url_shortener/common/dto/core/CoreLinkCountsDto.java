package com.url_shortener.common.dto.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoreLinkCountsDto {
    private long totalLinks;
    private long activeLinks;
    private long expiredLinks;
    private long quarantinedLinks;
    private long createdLast24hCount;
}
