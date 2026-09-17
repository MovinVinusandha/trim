package com.url_shortener.url_shortener.urls;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "folders")
public class Folder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "folder", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @Builder.Default
    private List<Url> urls = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.slug == null || this.slug.isBlank()) {
            if (this.name != null) {
                this.slug = this.name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-)|(-$)", "");
            }
        }
    }
}
