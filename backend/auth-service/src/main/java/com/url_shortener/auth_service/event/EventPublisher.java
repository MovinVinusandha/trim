package com.url_shortener.auth_service.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(String topic, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            stringRedisTemplate.convertAndSend(topic, payload);
            log.info("[EVENT] Published to topic {}: {}", topic, payload);
        } catch (Exception e) {
            log.error("[EVENT] Failed to publish event to topic {}: {}", topic, e.getMessage(), e);
        }
    }
}
