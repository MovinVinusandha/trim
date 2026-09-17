package com.url_shortener.url_shortener.urls;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tags")
public class TagController {

    private final TagService tagService;

    @GetMapping
    @Operation(summary = "Get all tags for the authenticated user")
    public ResponseEntity<List<TagDto>> getAllTags(@org.springframework.web.bind.annotation.RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(tagService.getAllTagsForUser(userId));
    }

    @PostMapping
    @Operation(summary = "Create a new tag")
    public ResponseEntity<TagDto> createTag(@RequestBody @Valid TagRequest request, @org.springframework.web.bind.annotation.RequestHeader("X-User-Id") Long userId) {
        return new ResponseEntity<>(tagService.createTag(request, userId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing tag")
    public ResponseEntity<TagDto> updateTag(@PathVariable Long id, @Valid @RequestBody TagRequest request, @org.springframework.web.bind.annotation.RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(tagService.updateTag(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a tag by ID")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id, @org.springframework.web.bind.annotation.RequestHeader("X-User-Id") Long userId) {
        tagService.deleteTag(id, userId);
        return ResponseEntity.noContent().build();
    }
}
