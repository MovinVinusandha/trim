package com.url_shortener.common.dto.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoreLinkCleanupResultDto {
    private boolean dryRun;
    private long affectedCount;
    private String operation;
    private String message;
    private List<String> sampleAffectedUrls;
    private LocalDateTime timestamp;
}
