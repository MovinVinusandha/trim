package com.url_shortener.admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafeBrowsingDiagnosticResultDto {
    private boolean valid;
    private long latencyMs;
    private String message;
    private String testThreatResult;
}
