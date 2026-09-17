package com.url_shortener.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private final SecretKey secretKey;

    public JwtAuthFilter(@Value("${JWT_SECRET:${spring.jwt.secret:oXjH3rKR3nK35ar9U6g0T3kJSdSpiciT4vcPV/fdxZ0=}}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        String token = extractToken(request);
        Claims claims = null;

        if (token != null && !token.isBlank()) {
            try {
                claims = Jwts.parser()
                        .verifyWith(secretKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception e) {
                log.warn("Invalid JWT token for path {}: {}", path, e.getMessage());
            }
        }

        // 1. Check Admin Routes
        if (path.startsWith("/admin")) {
            if (claims == null) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Authentication required for admin portal");
            }
            String role = claims.get("role", String.class);
            if (role == null || (!role.equalsIgnoreCase("ADMIN") && !role.equalsIgnoreCase("ROOT") && !role.equalsIgnoreCase("ROLE_ADMIN") && !role.equalsIgnoreCase("ROLE_ROOT"))) {
                return onError(exchange, HttpStatus.FORBIDDEN, "Admin privileges required");
            }
        }

        // 2. Check strict user authenticated routes
        if (isStrictAuthRoute(path) && claims == null) {
            return onError(exchange, HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        // 3. Mutate request with user headers if claims exist
        if (claims != null) {
            String userId = claims.getSubject();
            String role = claims.get("role", String.class);
            String email = claims.get("email", String.class);
            String username = claims.get("username", String.class);

            ServerHttpRequest.Builder builder = request.mutate();
            if (userId != null) {
                builder.header("X-User-Id", userId);
            }
            if (role != null) {
                builder.header("X-User-Role", role);
            }
            if (email != null) {
                builder.header("X-User-Email", email);
            }
            if (username != null) {
                builder.header("X-User-Username", username);
            }

            return chain.filter(exchange.mutate().request(builder.build()).build());
        }

        return chain.filter(exchange);
    }

    private boolean isStrictAuthRoute(String path) {
        return path.startsWith("/analytics")
                || path.startsWith("/folders")
                || path.startsWith("/tags")
                || path.startsWith("/utm-templates")
                || path.startsWith("/url/all")
                || path.startsWith("/url/batch-campaign")
                || path.startsWith("/url/bulk-action");
    }

    private String extractToken(ServerHttpRequest request) {
        // 1. Authorization header
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        // 2. Query param (for SSE streams)
        String queryToken = request.getQueryParams().getFirst("access_token");
        if (queryToken != null && !queryToken.isBlank()) {
            return queryToken.trim();
        }

        // 3. Cookie
        HttpCookie cookie = request.getCookies().getFirst("accessToken");
        if (cookie != null && !cookie.getValue().isBlank()) {
            return cookie.getValue().trim();
        }

        return null;
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String err) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        byte[] bytes = ("{\"error\":\"" + err + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
