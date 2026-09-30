package com.url_shortener.admin_service.dto;

import com.url_shortener.common.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleUpdateRequestDto {
    @NotNull(message = "Role is required")
    private Role role;
}
