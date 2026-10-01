package com.url_shortener.common.config;

import com.url_shortener.common.filter.TraceContextFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;

/**
 * Spring Boot 3 auto-configuration for common observability and trace correlation filters.
 * Only activated in Servlet-based web environments to prevent conflicts with reactive gateways.
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class CommonAutoConfiguration {

    @Bean
    public TraceContextFilter traceContextFilter() {
        return new TraceContextFilter();
    }
}
