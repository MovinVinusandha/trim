package com.url_shortener.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/core")
    public ResponseEntity<Map<String, Object>> coreFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", 503,
                "error", "Service Unavailable",
                "message", "Core Service is temporarily experiencing high latency or unavailable. Please try again shortly."
        ));
    }

    @RequestMapping("/auth")
    public ResponseEntity<Map<String, Object>> authFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", 503,
                "error", "Service Unavailable",
                "message", "Authentication Service is currently unavailable. Please try again shortly."
        ));
    }

    @RequestMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analyticsFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", 503,
                "error", "Service Unavailable",
                "message", "Analytics Service is currently unavailable. Historical metrics will resume once connection recovers."
        ));
    }

    @RequestMapping("/redirect")
    public ResponseEntity<Map<String, Object>> redirectFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", 503,
                "error", "Service Unavailable",
                "message", "Redirect Service is temporarily experiencing high load. Please try again shortly."
        ));
    }

    @RequestMapping("/admin")
    public ResponseEntity<Map<String, Object>> adminFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", 503,
                "error", "Service Unavailable",
                "message", "Admin Service is currently unavailable. Please try again shortly."
        ));
    }
}
