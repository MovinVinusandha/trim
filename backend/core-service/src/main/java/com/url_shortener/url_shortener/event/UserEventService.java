package com.url_shortener.url_shortener.event;

import com.url_shortener.common.event.UserDeletedEvent;
import com.url_shortener.common.event.UserSuspendedEvent;
import com.url_shortener.url_shortener.admin.audit.AdminAuditService;
import com.url_shortener.url_shortener.analytics.ClickEventRepository;
import com.url_shortener.url_shortener.urls.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserEventService {

    private final UrlRepository urlRepository;
    private final FolderRepository folderRepository;
    private final TagRepository tagRepository;
    private final CustomChannelRepository customChannelRepository;
    private final UtmTemplateRepository utmTemplateRepository;
    private final ClickEventRepository clickEventRepository;
    private final CacheManager cacheManager;
    private final AdminAuditService adminAuditService;

    @Transactional
    public void handleUserDeleted(UserDeletedEvent event) {
        Long userId = event.getUserId();
        if (userId == null) {
            log.warn("[EVENT] UserDeletedEvent has null userId, skipping.");
            return;
        }

        log.info("[EVENT] Cleaning up all resources for deleted user id={}, email={}", userId, event.getEmail());

        List<Url> userUrls = urlRepository.findByUserId(userId);
        long linkCount = userUrls.size();

        // 1. Evict cache for all user URLs
        for (Url url : userUrls) {
            evictCache(url.getShortUrl());
        }

        // 2. Delete click events
        try {
            clickEventRepository.deleteByUserId(userId);
        } catch (Exception e) {
            log.warn("[EVENT] Failed to delete click events for user id {}: {}", userId, e.getMessage());
        }

        // 3. Delete folders
        try {
            var folders = folderRepository.findByUserId(userId);
            folderRepository.deleteAll(folders);
        } catch (Exception e) {
            log.warn("[EVENT] Failed to delete folders for user id {}: {}", userId, e.getMessage());
        }

        // 4. Delete tags & associations
        try {
            var tags = tagRepository.findByUserId(userId);
            for (var t : tags) {
                tagRepository.deleteTagAssociations(t.getId());
            }
            tagRepository.deleteAll(tags);
        } catch (Exception e) {
            log.warn("[EVENT] Failed to delete tags for user id {}: {}", userId, e.getMessage());
        }

        // 5. Delete custom channels
        try {
            var channels = customChannelRepository.findAllByUserIdOrderByIdAsc(userId);
            customChannelRepository.deleteAll(channels);
        } catch (Exception e) {
            log.warn("[EVENT] Failed to delete custom channels for user id {}: {}", userId, e.getMessage());
        }

        // 6. Delete UTM templates
        try {
            var utmTemplates = utmTemplateRepository.findByUserIdOrderByCreatedAtDesc(userId);
            utmTemplateRepository.deleteAll(utmTemplates);
        } catch (Exception e) {
            log.warn("[EVENT] Failed to delete UTM templates for user id {}: {}", userId, e.getMessage());
        }

        // 7. Delete URLs
        urlRepository.deleteAll(userUrls);

        // 8. Record audit log
        try {
            adminAuditService.record(
                    null,
                    "system",
                    "SYSTEM",
                    "127.0.0.1",
                    "USER_DELETED_ASYNC_PURGE",
                    "USER",
                    event.getEmail() != null ? event.getEmail() : String.valueOf(userId),
                    "Asynchronously purged " + linkCount + " links and associated data for deleted user " + event.getEmail(),
                    "{\"userId\":" + userId + ",\"linkCount\":" + linkCount + "}"
            );
        } catch (Exception e) {
            log.warn("[EVENT] Failed to record audit log for user purge: {}", e.getMessage());
        }

        log.info("[EVENT] Successfully purged resources for user id={}", userId);
    }

    @Transactional
    public void handleUserSuspended(UserSuspendedEvent event) {
        Long userId = event.getUserId();
        if (userId == null) {
            log.warn("[EVENT] UserSuspendedEvent has null userId, skipping.");
            return;
        }

        log.info("[EVENT] Handling user suspension for user id={}, suspended={}", userId, event.isSuspended());

        List<Url> userUrls = urlRepository.findByUserId(userId);

        if (event.isSuspended()) {
            for (Url url : userUrls) {
                url.setActive(false);
                evictCache(url.getShortUrl());
            }
            urlRepository.saveAll(userUrls);
            log.info("[EVENT] Deactivated {} links and evicted caches for suspended user id={}", userUrls.size(), userId);
        } else {
            for (Url url : userUrls) {
                if (url.getExpiresAt() == null || url.getExpiresAt().isAfter(java.time.LocalDateTime.now())) {
                    url.setActive(true);
                }
                evictCache(url.getShortUrl());
            }
            urlRepository.saveAll(userUrls);
            log.info("[EVENT] Reactivated links and evicted caches for unsuspended user id={}", userId);
        }
    }

    private void evictCache(String shortUrl) {
        if (shortUrl == null) return;
        try {
            Cache cache = cacheManager.getCache("urls");
            if (cache != null) {
                cache.evict(shortUrl);
            }
        } catch (Exception e) {
            log.debug("Cache eviction error for {}: {}", shortUrl, e.getMessage());
        }
    }
}
