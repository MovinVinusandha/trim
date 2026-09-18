package com.url_shortener.analytics_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "click_events", indexes = {
        @Index(name = "idx_click_events_url_id", columnList = "url_id"),
        @Index(name = "idx_click_events_user_id", columnList = "user_id"),
        @Index(name = "idx_click_events_folder_id", columnList = "folder_id"),
        @Index(name = "idx_click_events_short_url", columnList = "short_url"),
        @Index(name = "idx_click_events_timestamp", columnList = "timestamp"),
        @Index(name = "idx_click_events_utm_source", columnList = "utm_source"),
        @Index(name = "idx_click_events_utm_medium", columnList = "utm_medium"),
        @Index(name = "idx_click_events_utm_campaign", columnList = "utm_campaign")
})
public class ClickEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "url_id", nullable = false)
    private Long urlId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "short_url", length = 255)
    private String shortUrl;

    @Column(name = "long_url", columnDefinition = "TEXT")
    private String longUrl;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    // Device & Browser
    @Column(name = "device", length = 30)
    private String device;

    @Column(name = "browser", length = 50)
    private String browser;

    @Column(name = "os", length = 50)
    private String os;

    // Geography
    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "continent", length = 50)
    private String continent;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // UTM Campaign Tracking
    @Column(name = "utm_source", length = 150)
    private String utmSource;

    @Column(name = "utm_medium", length = 150)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 150)
    private String utmCampaign;

    @Column(name = "utm_term", length = 150)
    private String utmTerm;

    @Column(name = "utm_content", length = 150)
    private String utmContent;

    @Column(name = "referer", length = 255)
    private String referer;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now(java.time.ZoneOffset.UTC);
        }
    }
}
