package com.url_shortener.url_shortener.urls;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@RestController
@RequestMapping("/utm-templates")
@RequiredArgsConstructor
public class UtmTemplateController {

    private final UtmTemplateService utmTemplateService;
    
    @GetMapping
    @Operation(summary = "Get all UTM templates for the authenticated user")
    public List<UtmTemplateDto> getUserTemplates(@RequestHeader("X-User-Id") Long userId) {
                return utmTemplateService.getUserTemplates(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new UTM template")
    public UtmTemplateDto createTemplate(@Valid @RequestBody UtmTemplateRequest request, @RequestHeader("X-User-Id") Long userId) {
                
        return utmTemplateService.createTemplate(request, userId);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing UTM template")
    public UtmTemplateDto updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody UtmTemplateRequest request,
            @RequestHeader("X-User-Id") Long userId
    ) {
                
        return utmTemplateService.updateTemplate(id, request, userId);
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Toggle default status for a UTM template")
    public UtmTemplateDto toggleDefaultTemplate(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
                
        return utmTemplateService.toggleDefaultTemplate(id, userId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a UTM template by ID")
    public void deleteTemplate(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
                
        utmTemplateService.deleteTemplate(id, userId);
    }
}
