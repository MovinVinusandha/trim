package com.url_shortener.auth_service.common;

import com.url_shortener.auth_service.users.Role;
import com.url_shortener.auth_service.users.User;
import com.url_shortener.auth_service.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class CommandLineAppStartupRunner implements CommandLineRunner {
    private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

    @Value("${root.user.email}")
    private String rootUserEmail;

    @Value("${root.user.password}")
    private String rootUserPassword;

    @Override
    public void run(String... args) {
        User rootAdmin;
        if (rootUserAlreadyExists()) {
            rootAdmin = userRepository.findByEmail(rootUserEmail).orElse(null);
            if (rootAdmin != null && !rootAdmin.isEmailVerified()) {
                rootAdmin.setEmailVerified(true);
                rootAdmin.setEmailVerifiedAt(java.time.LocalDateTime.now());
                userRepository.save(rootAdmin);
            }
        } else {
            rootAdmin = new User();
            rootAdmin.setUsername("root");
            rootAdmin.setEmail(rootUserEmail);
            rootAdmin.setPublicId("root_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            rootAdmin.setPassword(passwordEncoder.encode(rootUserPassword));
            rootAdmin.setRole(Role.ROOT);
            rootAdmin.setEmailVerified(true);
            rootAdmin.setEmailVerifiedAt(java.time.LocalDateTime.now());
            rootAdmin = userRepository.save(rootAdmin);
        }


    }

    private boolean rootUserAlreadyExists() {
        return userRepository.findByEmail(rootUserEmail).isPresent()
                || userRepository.existsByRole(Role.ROOT);
    }
}
