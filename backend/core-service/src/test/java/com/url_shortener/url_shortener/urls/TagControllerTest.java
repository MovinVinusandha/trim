package com.url_shortener.url_shortener.urls;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TagController.class)
@AutoConfigureMockMvc(addFilters = false)
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TagService tagService;

    @Test
    void getAllTags_Success() throws Exception {
        TagDto tag = new TagDto(1L, "Important", "#FF0000", 3);
        when(tagService.getAllTagsForUser(1L)).thenReturn(List.of(tag));

        mockMvc.perform(get("/tags")
                .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Important"));
    }

    @Test
    void createTag_Success() throws Exception {
        TagRequest request = new TagRequest();
        request.setName("NewTag");
        request.setColor("#00FF00");

        TagDto tag = new TagDto(2L, "NewTag", "#00FF00", 0);
        when(tagService.createTag(any(TagRequest.class), eq(1L))).thenReturn(tag);

        mockMvc.perform(post("/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("X-User-Id", 1L))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("NewTag"));
    }

    @Test
    void updateTag_Success() throws Exception {
        TagRequest request = new TagRequest();
        request.setName("NewTag");
        request.setColor("#00FF00");

        TagDto tag = new TagDto(1L, "NewTag", "#00FF00", 2);
        when(tagService.updateTag(eq(1L), any(TagRequest.class), eq(1L))).thenReturn(tag);

        mockMvc.perform(put("/tags/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("NewTag"));
    }

    @Test
    void deleteTag_Success() throws Exception {
        mockMvc.perform(delete("/tags/1")
                .header("X-User-Id", 1L))
                .andExpect(status().isNoContent());

        verify(tagService).deleteTag(1L, 1L);
    }
}
