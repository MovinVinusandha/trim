package com.url_shortener.url_shortener.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import java.util.HashMap;

@RestController
public class HealthController {

    @Value("${app.version:local-dev}") 
    private String appVersion;

    @GetMapping({"/api/health", "/health"})
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("version", appVersion);
        return ResponseEntity.ok(response);
    }
}
