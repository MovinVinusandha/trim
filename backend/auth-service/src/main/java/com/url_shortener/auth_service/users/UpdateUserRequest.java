package com.url_shortener.auth_service.users;

import jakarta.annotation.Nullable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UpdateUserRequest {
    @Nullable
    private String username;

    @Nullable
    private String email;

    public UpdateUserRequest(String email) {
        this.email = email;
    }
}
