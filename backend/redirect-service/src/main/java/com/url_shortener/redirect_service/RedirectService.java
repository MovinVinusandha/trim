package com.url_shortener.redirect_service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedirectService {

    private final RedirectUrlRepository redirectUrlRepository;
    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder passwordEncoder;

    public static class SystemMaintenanceException extends RuntimeException {
        private final String shortUrl;
        public SystemMaintenanceException(String shortUrl) {
            super("System is currently under maintenance for URL: " + shortUrl);
            this.shortUrl = shortUrl;
        }
        public String getShortUrl() { return shortUrl; }
    }

    public static class LinkQuarantinedException extends RuntimeException {
        private final String shortUrl;
        private final String reason;
        public LinkQuarantinedException(String shortUrl, String reason) {
            super("Link is quarantined: " + shortUrl + " Reason: " + reason);
            this.shortUrl = shortUrl;
            this.reason = reason;
        }
        public String getShortUrl() { return shortUrl; }
        public String getReason() { return reason; }
    }

    public static class LinkExpiredException extends RuntimeException {
        public LinkExpiredException(String message) { super(message); }
    }

    public static class PasswordProtectedException extends RuntimeException {
        private final String shortUrl;
        public PasswordProtectedException(String shortUrl) {
            super("Short URL is password protected: " + shortUrl);
            this.shortUrl = shortUrl;
        }
        public String getShortUrl() { return shortUrl; }
    }

    public static class UrlNotFoundException extends RuntimeException {
        public UrlNotFoundException(String message) { super(message); }
    }

    public RedirectUrl getRedirectTarget(String shortUrl) {
        String panicMode = "NORMAL";
        if ("MAINTENANCE".equals(panicMode)) {
            throw new SystemMaintenanceException(shortUrl);
        }

        RedirectUrl url = redirectUrlRepository.findByShortUrl(shortUrl)
                .orElseThrow(() -> new UrlNotFoundException("Short URL not found: " + shortUrl));

        if (url.isQuarantined()) {
            throw new LinkQuarantinedException(shortUrl, url.getQuarantineReason());
        }

        if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            url.setActive(false);
            redirectUrlRepository.save(url);
            redisTemplate.delete("urls::" + url.getShortUrl());
            throw new LinkExpiredException("Link expired");
        }

        if (!url.isActive()) {
            throw new LinkExpiredException("Link inactive");
        }

        if (url.getPasswordHash() != null && !url.getPasswordHash().isEmpty()) {
            throw new PasswordProtectedException(shortUrl);
        }

        return url;
    }

    public String resolveLongUrlWithCache(RedirectUrl url) {
        String cacheKey = "urls::" + url.getShortUrl();
        String cachedUrl = redisTemplate.opsForValue().get(cacheKey);
        if (cachedUrl != null) {
            return cachedUrl;
        }

        String longUrl = url.getLongUrl();
        if (url.getExpiresAt() != null) {
            Duration ttl = Duration.between(LocalDateTime.now(ZoneOffset.UTC), url.getExpiresAt());
            if (!ttl.isNegative()) {
                redisTemplate.opsForValue().set(cacheKey, longUrl, ttl);
            }
        } else {
            redisTemplate.opsForValue().set(cacheKey, longUrl, Duration.ofHours(24));
        }

        return longUrl;
    }

    public RedirectUrl getUrlForUnlock(String shortUrl, String password) {
        RedirectUrl url = redirectUrlRepository.findByShortUrl(shortUrl)
                .orElseThrow(() -> new UrlNotFoundException("Short URL not found: " + shortUrl));

        if (url.isQuarantined()) {
            throw new LinkQuarantinedException(shortUrl, url.getQuarantineReason());
        }

        if (!url.isActive()) {
            throw new LinkExpiredException("Link inactive or expired");
        }

        if (url.getPasswordHash() == null || url.getPasswordHash().isEmpty()) {
            throw new IllegalArgumentException("URL is not password protected.");
        }

        if (!passwordEncoder.matches(password, url.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password");
        }

        return url;
    }
}
