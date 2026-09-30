package com.url_shortener.admin_service.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(100)
public class AdminAuditFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.startsWith("/admin")) {
            Long actorId = null;
            String actorIdHeader = request.getHeader("X-User-Id");
            if (actorIdHeader != null && !actorIdHeader.isBlank()) {
                try {
                    actorId = Long.valueOf(actorIdHeader.trim());
                } catch (NumberFormatException ignored) {}
            }
            String actorEmail = request.getHeader("X-User-Email");
            String actorRole = request.getHeader("X-User-Role");

            String clientIp = resolveClientIp(request);

            AdminActorContext context = AdminActorContext.builder()
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .actorRole(actorRole)
                    .actorIp(clientIp)
                    .build();

            AdminAuditContextHolder.setContext(context);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            AdminAuditContextHolder.clear();
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
