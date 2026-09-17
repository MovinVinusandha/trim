package com.url_shortener.url_shortener.urls;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "utm_templates")
public class UtmTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String source;

    private String medium;

    private String campaign;

    private String term;

    private String content;

    @Column(name = "ref_param")
    private String ref;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(columnDefinition = "TEXT")
    private String customParams;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "user_id")
    private Long userId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
