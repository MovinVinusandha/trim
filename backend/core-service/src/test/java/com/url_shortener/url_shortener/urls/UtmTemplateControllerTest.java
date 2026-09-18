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

@WebMvcTest(UtmTemplateController.class)
@AutoConfigureMockMvc(addFilters = false)
class UtmTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UtmTemplateService utmTemplateService;

    @Test
    void getUserTemplates_Success() throws Exception {
        UtmTemplateDto dto = UtmTemplateDto.builder()
                .id(1L)
                .name("Summer Sale")
                .source("google")
                .medium("cpc")
                .campaign("summer")
                .createdAt(LocalDateTime.now())
                .build();

        when(utmTemplateService.getUserTemplates(1L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/utm-templates")
                        .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Summer Sale"))
                .andExpect(jsonPath("$[0].source").value("google"));
    }

    @Test
    void createTemplate_Success() throws Exception {
        UtmTemplateRequest request = UtmTemplateRequest.builder()
                .name("Summer Sale")
                .source("google")
                .build();

        UtmTemplateDto dto = UtmTemplateDto.builder()
                .id(1L)
                .name("Summer Sale")
                .source("google")
                .build();

        when(utmTemplateService.createTemplate(any(UtmTemplateRequest.class), eq(1L))).thenReturn(dto);

        mockMvc.perform(post("/utm-templates")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Summer Sale"));
    }

    @Test
    void updateTemplate_Success() throws Exception {
        UtmTemplateRequest request = UtmTemplateRequest.builder()
                .name("Updated Sale")
                .source("facebook")
                .build();

        UtmTemplateDto dto = UtmTemplateDto.builder()
                .id(1L)
                .name("Updated Sale")
                .source("facebook")
                .build();

        when(utmTemplateService.updateTemplate(eq(1L), any(UtmTemplateRequest.class), eq(1L))).thenReturn(dto);

        mockMvc.perform(put("/utm-templates/1")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Sale"));
    }

    @Test
    void deleteTemplate_Success() throws Exception {
        mockMvc.perform(delete("/utm-templates/1")
                        .header("X-User-Id", 1L))
                .andExpect(status().isNoContent());

        verify(utmTemplateService).deleteTemplate(1L, 1L);
    }

    @Test
    void toggleDefaultTemplate_Success() throws Exception {
        UtmTemplateDto dto = UtmTemplateDto.builder()
                .id(1L)
                .name("Default Template")
                .isDefault(true)
                .build();

        when(utmTemplateService.toggleDefaultTemplate(eq(1L), eq(1L))).thenReturn(dto);

        mockMvc.perform(patch("/utm-templates/1/default")
                        .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDefault").value(true));
    }
}
