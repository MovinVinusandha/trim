package com.url_shortener.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Global reactive filter for API Gateway to guarantee every request has an X-Request-Id header
 * downstream and attached to the client response.
 */
@Component
public class TraceIdGatewayFilter implements GlobalFilter, Ordered {

    public static final String TRACE_ID_HEADER = "X-Request-Id";
    public static final String ALT_TRACE_ID_HEADER = "X-Trace-Id";

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        String traceId = request.getHeaders().getFirst(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = request.getHeaders().getFirst(ALT_TRACE_ID_HEADER);
        }
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "");
        }

        final String finalTraceId = traceId;

        ServerHttpRequest mutatedRequest = request.mutate()
                .header(TRACE_ID_HEADER, finalTraceId)
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest)
                .build();

        mutatedExchange.getResponse().getHeaders().add(TRACE_ID_HEADER, finalTraceId);

        return chain.filter(mutatedExchange);
    }
}
