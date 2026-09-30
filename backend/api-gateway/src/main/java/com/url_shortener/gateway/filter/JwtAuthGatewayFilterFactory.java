package com.url_shortener.gateway.filter;

import com.url_shortener.gateway.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class JwtAuthGatewayFilterFactory extends AbstractGatewayFilterFactory<JwtAuthGatewayFilterFactory.Config> {

    private final JwtConfig jwtConfig;

    public JwtAuthGatewayFilterFactory(JwtConfig jwtConfig) {
        super(Config.class);
        this.jwtConfig = jwtConfig;
    }

    @Data
    public static class Config {
        private boolean optional = false;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            // Strip any incoming client-spoofed user headers
            ServerHttpRequest.Builder requestBuilder = request.mutate()
                    .headers(httpHeaders -> {
                        httpHeaders.remove("X-User-Id");
                        httpHeaders.remove("X-User-Email");
                        httpHeaders.remove("X-User-Role");
                        httpHeaders.remove("X-User-Username");
                    });

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                if (config.isOptional()) {
                    return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
                }
                return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7).trim();
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(jwtConfig.getSecretKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String userId = claims.getSubject();
                String email = claims.get("email", String.class);
                String role = claims.get("role", String.class);
                String username = claims.get("username", String.class);

                if (userId != null) {
                    requestBuilder.header("X-User-Id", userId);
                }
                if (email != null) {
                    requestBuilder.header("X-User-Email", email);
                }
                if (role != null) {
                    requestBuilder.header("X-User-Role", role);
                }
                if (username != null) {
                    requestBuilder.header("X-User-Username", username);
                }

                return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
            } catch (Exception e) {
                log.debug("JWT validation failed: {}", e.getMessage());
                if (config.isOptional()) {
                    return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
                }
                return onError(exchange, "Invalid or expired JWT token", HttpStatus.UNAUTHORIZED);
            }
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
