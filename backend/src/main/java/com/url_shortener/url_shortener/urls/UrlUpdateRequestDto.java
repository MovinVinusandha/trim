package com.url_shortener.url_shortener.urls;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UrlUpdateRequestDto {
    private String longUrl;
    private String password;
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    private LocalDateTime expiresAt;
    private List<Long> tagIds;
}
