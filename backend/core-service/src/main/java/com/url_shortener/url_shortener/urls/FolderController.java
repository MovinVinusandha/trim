package com.url_shortener.url_shortener.urls;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@RestController
@RequestMapping("/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;
    
    @GetMapping
    public List<FolderDto> getUserFolders(@RequestHeader("X-User-Id") Long userId) {
                return folderService.getUserFolders(userId);
    }

    @GetMapping("/slug/{slug}")
    public FolderDto getFolderBySlug(@PathVariable String slug, @RequestHeader("X-User-Id") Long userId) {
                return folderService.getFolderBySlug(slug, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FolderDto createFolder(@Valid @RequestBody FolderRequestDto request, @RequestHeader("X-User-Id") Long userId) {
                
        return folderService.createFolder(request.getName(), userId);
    }

    @PutMapping("/{id}")
    public FolderDto updateFolder(@PathVariable Long id, @Valid @RequestBody FolderRequestDto request, @RequestHeader("X-User-Id") Long userId) {
                
        return folderService.updateFolder(id, request, userId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFolder(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
                
        folderService.deleteFolder(id, userId);
    }
}
