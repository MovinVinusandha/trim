package com.url_shortener.url_shortener.urls;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomChannelController.class)
@AutoConfigureMockMvc(addFilters = false)
class CustomChannelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomChannelService customChannelService;

    @Test
    void getUserCustomChannels_Success() throws Exception {
        CustomChannelDto dto = CustomChannelDto.builder()
                .id(1L)
                .name("Reddit")
                .utmSource("reddit")
                .utmMedium("social")
                .createdAt(LocalDateTime.now())
                .build();

        when(customChannelService.getUserCustomChannels(1L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/custom-channels")
                        .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Reddit"))
                .andExpect(jsonPath("$[0].utmSource").value("reddit"))
                .andExpect(jsonPath("$[0].utmMedium").value("social"));
    }

    @Test
    void createCustomChannel_Success() throws Exception {
        CustomChannelRequest request = CustomChannelRequest.builder()
                .name("Discord")
                .utmSource("discord")
                .utmMedium("community")
                .build();

        CustomChannelDto dto = CustomChannelDto.builder()
                .id(2L)
                .name("Discord")
                .utmSource("discord")
                .utmMedium("community")
                .createdAt(LocalDateTime.now())
                .build();

        when(customChannelService.createCustomChannel(any(CustomChannelRequest.class), eq(1L))).thenReturn(dto);

        mockMvc.perform(post("/custom-channels")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2L))
                .andExpect(jsonPath("$.name").value("Discord"));
    }

    @Test
    void deleteCustomChannel_Success() throws Exception {
        mockMvc.perform(delete("/custom-channels/2")
                        .header("X-User-Id", 1L))
                .andExpect(status().isNoContent());

        verify(customChannelService).deleteCustomChannel(2L, 1L);
    }
}
