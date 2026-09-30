package com.url_shortener.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UrlClickedEvent implements Serializable {
    private Long urlId;
    private Long userId;
    private Long folderId;
    private String shortUrlHash;
    private String longUrl;
    private String clientIp;
    private String userAgent;
    private String referer;
    private Map<String, String> queryParams;
    private LocalDateTime timestamp;
}
