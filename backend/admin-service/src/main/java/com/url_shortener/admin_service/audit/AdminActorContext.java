package com.url_shortener.admin_service.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActorContext {
    private Long actorId;
    private String actorEmail;
    private String actorRole;
    private String actorIp;
}
