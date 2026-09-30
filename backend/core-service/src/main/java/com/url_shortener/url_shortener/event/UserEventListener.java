package com.url_shortener.url_shortener.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.url_shortener.common.event.EventTopics;
import com.url_shortener.common.event.UserDeletedEvent;
import com.url_shortener.common.event.UserSuspendedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventListener implements MessageListener {

    private final ObjectMapper objectMapper;
    private final UserEventService userEventService;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String topic = new String(message.getChannel(), StandardCharsets.UTF_8);
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        log.info("[EVENT] Received message on topic {}: {}", topic, body);

        try {
            if (EventTopics.TOPIC_USER_DELETED.equals(topic)) {
                UserDeletedEvent event = objectMapper.readValue(body, UserDeletedEvent.class);
                userEventService.handleUserDeleted(event);
            } else if (EventTopics.TOPIC_USER_SUSPENDED.equals(topic)) {
                UserSuspendedEvent event = objectMapper.readValue(body, UserSuspendedEvent.class);
                userEventService.handleUserSuspended(event);
            }
        } catch (Exception e) {
            log.error("[EVENT] Error processing message from topic {}: {}", topic, e.getMessage(), e);
        }
    }
}
