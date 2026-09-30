package com.url_shortener.redirect_service;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "urls")
public class RedirectUrl {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "short_url")
    private String shortUrl;

    @Column(name = "long_url")
    private String longUrl;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_active")
    private boolean isActive;

    @Column(name = "is_quarantined")
    private boolean isQuarantined;

    @Column(name = "quarantine_reason")
    private String quarantineReason;

    @Column(name = "password_hash")
    private String passwordHash;
}
