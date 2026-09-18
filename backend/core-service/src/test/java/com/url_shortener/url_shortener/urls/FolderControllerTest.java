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

@WebMvcTest(FolderController.class)
@AutoConfigureMockMvc(addFilters = false)
class FolderControllerTest {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FolderService folderService;

    @Test
    void getUserFolders_Success() throws Exception {
        FolderDto folder = new FolderDto(1L, "Work", "work", null, 5);
        when(folderService.getUserFolders(1L)).thenReturn(List.of(folder));

        mockMvc.perform(get("/folders")
                .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Work"))
                .andExpect(jsonPath("$[0].slug").value("work"));
    }

    @Test
    void getFolderBySlug_Success() throws Exception {
        FolderDto folder = new FolderDto(1L, "Work", "work", null, 5);
        when(folderService.getFolderBySlug("work", 1L)).thenReturn(folder);

        mockMvc.perform(get("/folders/slug/work")
                .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Work"))
                .andExpect(jsonPath("$.slug").value("work"));
    }

    @Test
    void createFolder_Success() throws Exception {
        FolderRequestDto request = new FolderRequestDto();
        request.setName("Personal");
        
        FolderDto folder = new FolderDto(2L, "Personal", "personal", null, 0);
        when(folderService.createFolder(eq("Personal"), eq(1L))).thenReturn(folder);

        mockMvc.perform(post("/folders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("X-User-Id", 1L))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Personal"))
                .andExpect(jsonPath("$.slug").value("personal"));
    }

    @Test
    void updateFolder_Success() throws Exception {
        FolderRequestDto request = new FolderRequestDto();
        request.setName("Personal");

        FolderDto folder = new FolderDto(1L, "Personal", "personal", null, 0);
        when(folderService.updateFolder(eq(1L), any(FolderRequestDto.class), eq(1L))).thenReturn(folder);

        mockMvc.perform(put("/folders/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Personal"));
    }

    @Test
    void deleteFolder_Success() throws Exception {
        mockMvc.perform(delete("/folders/1")
                .header("X-User-Id", 1L))
                .andExpect(status().isNoContent());

        verify(folderService).deleteFolder(eq(1L), eq(1L));
    }
}
