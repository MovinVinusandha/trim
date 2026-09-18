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
public class UserSuspendedEvent {
    private Long userId;
    private String publicId;
    private String email;
    private boolean suspended;
    private String reason;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
