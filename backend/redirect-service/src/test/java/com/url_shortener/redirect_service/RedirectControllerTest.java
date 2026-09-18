package com.url_shortener.redirect_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.url_shortener.common.event.EventTopics;
import com.url_shortener.common.event.UrlClickedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RedirectController.class)
@AutoConfigureMockMvc(addFilters = false)
class RedirectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RedirectService redirectService;

    @MockBean
    private EventPublisher eventPublisher;

    @Test
    void redirect_Success_PublishesEventAndRedirects() throws Exception {
        RedirectUrl url = RedirectUrl.builder()
                .id(1L)
                .shortUrl("abc1234")
                .longUrl("https://example.com")
                .userId(10L)
                .isActive(true)
                .build();

        when(redirectService.getRedirectTarget("abc1234")).thenReturn(url);
        when(redirectService.resolveLongUrlWithCache(url)).thenReturn("https://example.com");

        mockMvc.perform(get("/abc1234")
                .header("User-Agent", "TestAgent")
                .header("X-Forwarded-For", "203.0.113.195"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com"));

        verify(eventPublisher).publish(eq(EventTopics.TOPIC_URL_CLICKED), any(UrlClickedEvent.class));
    }

    @Test
    void redirect_PasswordProtected_RedirectsToSecurePage() throws Exception {
        when(redirectService.getRedirectTarget("sec123"))
                .thenThrow(new RedirectService.PasswordProtectedException("sec123"));

        mockMvc.perform(get("/sec123"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", org.hamcrest.Matchers.endsWith("/secure/sec123")));
    }

    @Test
    void redirect_Quarantined_RedirectsToBlockedPage() throws Exception {
        when(redirectService.getRedirectTarget("malware1"))
                .thenThrow(new RedirectService.LinkQuarantinedException("malware1", "Malicious link"));

        mockMvc.perform(get("/malware1"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", org.hamcrest.Matchers.endsWith("/blocked/malware1")));
    }

    @Test
    void redirect_Expired_RedirectsToNotFound() throws Exception {
        when(redirectService.getRedirectTarget("old123"))
                .thenThrow(new RedirectService.LinkExpiredException("Link expired"));

        mockMvc.perform(get("/old123"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", org.hamcrest.Matchers.endsWith("/not-found")));
    }

    @Test
    void unlockUrl_Success() throws Exception {
        RedirectUrl url = RedirectUrl.builder()
                .id(2L)
                .shortUrl("sec123")
                .longUrl("https://secret.com")
                .userId(10L)
                .isActive(true)
                .build();

        when(redirectService.getUrlForUnlock("sec123", "secretPassword")).thenReturn(url);

        RedirectController.UnlockRequest request = new RedirectController.UnlockRequest("secretPassword");

        mockMvc.perform(post("/unlock/sec123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.longUrl").value("https://secret.com"));

        verify(eventPublisher).publish(eq(EventTopics.TOPIC_URL_CLICKED), any(UrlClickedEvent.class));
    }
}
