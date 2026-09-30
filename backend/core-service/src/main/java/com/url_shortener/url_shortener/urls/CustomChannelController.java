package com.url_shortener.url_shortener.urls;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@RestController
@RequestMapping("/custom-channels")
@RequiredArgsConstructor
public class CustomChannelController {

    private final CustomChannelService customChannelService;
    
    @GetMapping
    @Operation(summary = "Get all saved custom channels for the authenticated user")
    public List<CustomChannelDto> getUserCustomChannels(@RequestHeader("X-User-Id") Long userId) {
                return customChannelService.getUserCustomChannels(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Save a new custom channel preset")
    public CustomChannelDto createCustomChannel(
            @Valid @RequestBody CustomChannelRequest request,
            @RequestHeader("X-User-Id") Long userId
    ) {
                
        return customChannelService.createCustomChannel(request, userId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a saved custom channel preset")
    public void deleteCustomChannel(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId
    ) {
                
        customChannelService.deleteCustomChannel(id, userId);
    }
}
