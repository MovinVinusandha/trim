package com.url_shortener.url_shortener.common;

import com.url_shortener.url_shortener.urls.UrlExistInDataBaseException;
import com.url_shortener.url_shortener.urls.UrlNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UrlNotFoundException.class)
    public ResponseEntity<?> urlNotFound(jakarta.servlet.http.HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri != null && (uri.startsWith("/url/") || uri.startsWith("/api/"))) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                .location(java.net.URI.create(dashboardUrl + "/not-found"))
                .build();
    }

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost}")
    private String frontendUrl;
    
    @org.springframework.beans.factory.annotation.Value("${app.domain.app:http://app.localhost}")
    private String appDomainUrl;

    @org.springframework.beans.factory.annotation.Value("${app.dashboard.url:http://app.localhost}")
    private String dashboardUrl;

    @ExceptionHandler(com.url_shortener.url_shortener.urls.LinkExpiredException.class)
    public void linkExpired(com.url_shortener.url_shortener.urls.LinkExpiredException ex, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        response.sendRedirect(dashboardUrl + "/expired");
    }

    @ExceptionHandler(com.url_shortener.url_shortener.urls.PasswordProtectedException.class)
    public void passwordProtected(com.url_shortener.url_shortener.urls.PasswordProtectedException ex, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        response.sendRedirect(dashboardUrl + "/secure/" + ex.getHash());
    }

    @ExceptionHandler(UrlExistInDataBaseException.class)
    public ResponseEntity<Map<String, String >> urlInDb() {
        return ResponseEntity.badRequest().body(
                Map.of("longUrl", "This URL has already been shortened")
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException exception
    ) {
        var errors = new HashMap<String, String>();

        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleIllegalArgument(RuntimeException exception) {
        return ResponseEntity.badRequest().body(
                Map.of("message", exception.getMessage() != null ? exception.getMessage() : "Invalid request")
        );
    }

    @ExceptionHandler(com.url_shortener.url_shortener.urls.AliasAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleAliasAlreadyExists(com.url_shortener.url_shortener.urls.AliasAlreadyExistsException ex) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(
                Map.of("message", "This short link alias is already taken. Please choose another.", "error", "Conflict")
        );
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(org.springframework.web.server.ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(
                Map.of(
                        "status", ex.getStatusCode().value(),
                        "message", ex.getReason() != null ? ex.getReason() : ex.getMessage()
                )
        );
    }

    @ExceptionHandler(com.url_shortener.url_shortener.security.SpamVelocityExceededException.class)
    public ResponseEntity<Map<String, Object>> handleSpamVelocity(com.url_shortener.url_shortener.security.SpamVelocityExceededException ex) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body(
                Map.of("status", 429, "error", "Too Many Requests", "message", ex.getMessage())
        );
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleGenericRuntimeException(RuntimeException exception) {
        return ResponseEntity.badRequest().body(
                Map.of("message", exception.getMessage() != null ? exception.getMessage() : "An unexpected error occurred")
        );
    }
}
