package com.url_shortener.analytics_service.config;

import nl.basjes.parse.useragent.UserAgentAnalyzer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UserAgentConfig {

    @Bean
    public UserAgentAnalyzer userAgentAnalyzer() {
        return UserAgentAnalyzer.newBuilder()
                .withField("DeviceClass")
                .withField("AgentName")
                .withField("OperatingSystemName")
                .withCache(10_000)
                .hideMatcherLoadStats()
                .build();
    }
}
