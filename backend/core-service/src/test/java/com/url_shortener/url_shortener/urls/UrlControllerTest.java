package com.url_shortener.url_shortener.urls;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.url_shortener.url_shortener.event.EventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigInteger;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UrlController.class)
@AutoConfigureMockMvc(addFilters = false)
class UrlControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UrlService urlService;
    @MockBean
    private EventPublisher eventPublisher;
    @MockBean
    private QrCodeService qrCodeService;

    @Test
    void generateShortUrl_Success_Anonymous() throws Exception {
        UrlRequest request = new UrlRequest("https://example.com", null, null, null, null, null);
        UrlSend urlSend = new UrlSend("https://example.com", "hash123", null, null, true, false, null, null, null);
        when(urlService.generateShortUrl(any(UrlRequest.class), any(), isNull())).thenReturn(urlSend);

        mockMvc.perform(post("/shorten")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortUrl").value("hash123"))
                .andExpect(jsonPath("$.longUrl").value("https://example.com"));
    }

    @Test
    void generateShortUrl_WithCustomAlias_Unauthenticated_ThrowsBadRequest() throws Exception {
        UrlRequest request = new UrlRequest("https://example.com", "my-alias", null, null, null, null);

        mockMvc.perform(post("/shorten")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generateShortUrl_WithExpiresAt_Unauthenticated_ThrowsBadRequest() throws Exception {
        String json = "{\"longUrl\":\"https://example.com\",\"expiresAt\":\"2030-01-01T00:00:00.000Z\"}";

        mockMvc.perform(post("/shorten")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generateShortUrl_WithCustomAliasAndExpiresAt_Authenticated_Success() throws Exception {
        UrlRequest request = new UrlRequest("https://example.com", "my-alias", null, null, null, null);
        UrlSend urlSend = new UrlSend("https://example.com", "my-alias", null, null, true, false, null, null, null);
        when(urlService.generateShortUrl(any(UrlRequest.class), any(), eq(1L))).thenReturn(urlSend);

        mockMvc.perform(post("/shorten")
                .header("X-User-Id", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortUrl").value("my-alias"));
    }

    @Test
    void getUrl_Success() throws Exception {
        UrlDto urlDto = new UrlDto(BigInteger.ONE, "https://example.com", "hash123", BigInteger.valueOf(15L), null, null, null, true, false, null, null, null);
        when(urlService.getUrl("hash123")).thenReturn(urlDto);

        mockMvc.perform(get("/url/hash123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortUrl").value("hash123"))
                .andExpect(jsonPath("$.accessed_times").value(15));
    }

    @Test
    void getAllUsers_WithFilters() throws Exception {
        mockMvc.perform(get("/url/all")
                .header("X-User-Id", 1L)
                .param("folderSlug", "marketing-2026")
                .param("tagId", "2")
                .param("search", "example"))
                .andExpect(status().isOk());

        verify(urlService).getAllUrls(eq(1L), eq(""), eq(2L), isNull(), eq("marketing-2026"), eq("example"));
    }

    @Test
    void updateUrl_Success() throws Exception {
        UrlUpdateRequestDto updateDto = new UrlUpdateRequestDto();
        updateDto.setLongUrl("https://new.com");

        UrlDto resultDto = new UrlDto(BigInteger.ONE, "https://new.com", "hash123", BigInteger.ZERO, null, null, null, true, false, null, null, null);
        when(urlService.updateUrl(eq("hash123"), any(UrlUpdateRequestDto.class), eq(1L))).thenReturn(resultDto);

        mockMvc.perform(put("/url/hash123")
                .header("X-User-Id", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.longUrl").value("https://new.com"));
    }
}
