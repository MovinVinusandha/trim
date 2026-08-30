package com.url_shortener.url_shortener.urls;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlExpirationTaskTest {

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @InjectMocks
    private UrlExpirationTask urlExpirationTask;

    @Test
    void sweepExpiredUrls_DeactivatesAndCleansCache() {
        Url url1 = Url.builder().id(1L).shortUrl("exp1").isActive(true).expiresAt(LocalDateTime.now().minusMinutes(5)).build();
        Url url2 = Url.builder().id(2L).shortUrl("exp2").isActive(true).expiresAt(LocalDateTime.now().minusMinutes(10)).build();

        when(urlRepository.findByIsActiveTrueAndExpiresAtBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(url1, url2));

        urlExpirationTask.sweepExpiredUrls();

        assertThat(url1.isActive()).isFalse();
        assertThat(url2.isActive()).isFalse();
        verify(urlRepository).save(url1);
        verify(urlRepository).save(url2);
        verify(redisTemplate).delete("urls::exp1");
        verify(redisTemplate).delete("urls::exp2");
    }

    @Test
    void sweepExpiredUrls_EmptyList_DoesNothing() {
        when(urlRepository.findByIsActiveTrueAndExpiresAtBefore(any(LocalDateTime.class)))
                .thenReturn(List.of());

        urlExpirationTask.sweepExpiredUrls();

        verify(urlRepository, never()).save(any(Url.class));
        verify(redisTemplate, never()).delete(anyString());
    }
}
