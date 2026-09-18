package com.url_shortener.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeletedEvent {
    private Long userId;
    private String publicId;
    private String email;
    private String username;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
