package com.url_shortener.common.dto;

import com.url_shortener.common.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserActionRequestDto {
    private String reason;
    private Role role;
    private Integer customMaxLinks;
    private Long currentAdminId;
}
