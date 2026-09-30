package com.url_shortener.analytics_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig {

    @Value("${analytics.async.core-pool-size:4}")
    private int corePoolSize;

    @Value("${analytics.async.max-pool-size:16}")
    private int maxPoolSize;

    @Value("${analytics.async.queue-capacity:500}")
    private int queueCapacity;

    @Bean("analyticsExecutor")
    public Executor analyticsExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("analytics-worker-");
        executor.initialize();
        return executor;
    }
}
