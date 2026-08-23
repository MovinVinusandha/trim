package com.url_shortener.url_shortener.config;

import com.url_shortener.url_shortener.auth.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testSecurityWhitelist() throws Exception {
        // Unlock endpoint should be accessible, missing body returns 400 (proving it bypasses 401)
        mockMvc.perform(post("/unlock/hash123"))
                .andExpect(status().isBadRequest());

        // User registration should be accessible, missing body returns 400
        mockMvc.perform(post("/user"))
                .andExpect(status().isBadRequest());

        // OPTIONS requests should be permitted
        mockMvc.perform(options("/any-endpoint"))
                .andExpect(status().isOk());

        // Health check endpoint should be permitted without auth
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());

        // Protected endpoint should return 401 (or 403 based on implementation)
        mockMvc.perform(post("/api/protected-endpoint"))
                .andExpect(status().isUnauthorized());
    }
}
