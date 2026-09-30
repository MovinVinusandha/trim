package com.url_shortener.gateway.filter;

import lombok.Data;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Component
public class RoleAuthGatewayFilterFactory extends AbstractGatewayFilterFactory<RoleAuthGatewayFilterFactory.Config> {

    public RoleAuthGatewayFilterFactory() {
        super(Config.class);
    }

    @Data
    public static class Config {
        private List<String> requiredRoles;
    }

    @Override
    public List<String> shortcutFieldOrder() {
        return List.of("requiredRoles");
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String roleHeader = exchange.getRequest().getHeaders().getFirst("X-User-Role");

            if (roleHeader == null || roleHeader.isBlank()) {
                return onError(exchange, "Authentication required", HttpStatus.UNAUTHORIZED);
            }

            String rawRole = roleHeader.trim().toUpperCase();
            final String normalizedRole = rawRole.startsWith("ROLE_") ? rawRole.substring(5) : rawRole;

            List<String> allowed = config.getRequiredRoles();
            if (allowed != null && !allowed.isEmpty()) {
                boolean match = allowed.stream()
                        .map(r -> r.trim().toUpperCase().replace("ROLE_", ""))
                        .anyMatch(r -> r.equals(normalizedRole));

                if (!match) {
                    return onError(exchange, "Forbidden: insufficient permissions", HttpStatus.FORBIDDEN);
                }
            }

            return chain.filter(exchange);
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().add("Content-Type", "application/json");
        String body = "{\"status\":" + httpStatus.value() + ",\"error\":\"" + httpStatus.getReasonPhrase() + "\",\"message\":\"" + message + "\"}";
        byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }
}
