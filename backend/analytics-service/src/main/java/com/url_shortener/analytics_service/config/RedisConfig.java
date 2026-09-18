package com.url_shortener.analytics_service.config;

import com.url_shortener.analytics_service.event.AnalyticsEventListener;
import com.url_shortener.common.event.EventTopics;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            AnalyticsEventListener analyticsEventListener
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(analyticsEventListener, new ChannelTopic(EventTopics.TOPIC_URL_CLICKED));
        container.addMessageListener(analyticsEventListener, new ChannelTopic(EventTopics.TOPIC_USER_DELETED));
        return container;
    }
}
