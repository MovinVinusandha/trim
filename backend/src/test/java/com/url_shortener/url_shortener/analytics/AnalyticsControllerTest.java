package com.url_shortener.url_shortener.analytics;

import com.url_shortener.url_shortener.analytics.dto.AnalyticsResponseDto;
import com.url_shortener.url_shortener.users.User;
import com.url_shortener.url_shortener.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private UserRepository userRepository;
    @MockBean
    private com.url_shortener.url_shortener.auth.JwtService jwtService;

    @Test
    void getAnalytics_Success() throws Exception {
        User currentUser = User.builder().id(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));

        AnalyticsResponseDto responseDto = new AnalyticsResponseDto(100L, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        when(analyticsService.getAnalytics(eq("hash123"), eq(currentUser), eq("all"))).thenReturn(responseDto);

        mockMvc.perform(get("/analytics/hash123")
                .principal(new UsernamePasswordAuthenticationToken(1L, null, Collections.emptyList())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClicks").value(100));
    }

    @Test
    void getOverallAnalytics_Success() throws Exception {
        User currentUser = User.builder().id(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));

        AnalyticsResponseDto responseDto = new AnalyticsResponseDto(500L, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        when(analyticsService.getOverallAnalytics(eq(currentUser), eq("7d"), eq(null), eq(null), eq(null))).thenReturn(responseDto);

        mockMvc.perform(get("/analytics")
                .param("period", "7d")
                .principal(new UsernamePasswordAuthenticationToken(1L, null, Collections.emptyList())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClicks").value(500));
    }

    @Test
    void getOverallAnalytics_WithMultipleTagsAndSlug() throws Exception {
        User currentUser = User.builder().id(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));

        AnalyticsResponseDto responseDto = new AnalyticsResponseDto(250L, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        when(analyticsService.getOverallAnalytics(eq(currentUser), eq("30d"), eq("hash123"), eq(java.util.List.of(1L, 3L)), eq(10L))).thenReturn(responseDto);

        mockMvc.perform(get("/analytics")
                .param("period", "30d")
                .param("hash", "hash123")
                .param("tagId", "1,3")
                .param("folderId", "10")
                .principal(new UsernamePasswordAuthenticationToken(1L, null, Collections.emptyList())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClicks").value(250));
    }

    @Test
    void getFolderAnalyticsBySlug_Success() throws Exception {
        User currentUser = User.builder().id(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));

        AnalyticsResponseDto responseDto = new AnalyticsResponseDto(120L, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        when(analyticsService.getFolderAnalyticsBySlug(eq("marketing-2026"), eq(currentUser), eq("all"))).thenReturn(responseDto);

        mockMvc.perform(get("/analytics/folder/slug/marketing-2026")
                .principal(new UsernamePasswordAuthenticationToken(1L, null, Collections.emptyList())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClicks").value(120));
    }
}
