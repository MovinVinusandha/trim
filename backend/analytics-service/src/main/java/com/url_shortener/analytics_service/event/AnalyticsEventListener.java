package com.url_shortener.analytics_service.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.url_shortener.analytics_service.service.AnalyticsService;
import com.url_shortener.common.event.EventTopics;
import com.url_shortener.common.event.UrlClickedEvent;
import com.url_shortener.common.event.UserDeletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsEventListener implements MessageListener {

    private final AnalyticsService analyticsService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String topic = new String(message.getChannel(), StandardCharsets.UTF_8);
        String body = new String(message.getBody(), StandardCharsets.UTF_8);

        log.debug("[ANALYTICS-EVENT] Received event on topic {}", topic);

        try {
            if (EventTopics.TOPIC_URL_CLICKED.equals(topic)) {
                UrlClickedEvent event = objectMapper.readValue(body, UrlClickedEvent.class);
                analyticsService.processUrlClicked(event);
            } else if (EventTopics.TOPIC_USER_DELETED.equals(topic)) {
                UserDeletedEvent event = objectMapper.readValue(body, UserDeletedEvent.class);
                if (event.getUserId() != null) {
                    analyticsService.purgeUserData(event.getUserId());
                }
            }
        } catch (Exception e) {
            log.error("[ANALYTICS-EVENT] Error processing message from topic {}: {}", topic, e.getMessage(), e);
        }
    }
}
