package com.url_shortener.url_shortener.admin;

import com.url_shortener.url_shortener.users.Role;
import com.url_shortener.url_shortener.users.User;
import com.url_shortener.url_shortener.users.UserAlreadyExist;
import com.url_shortener.url_shortener.users.UserDto;
import com.url_shortener.url_shortener.users.UserMapper;
import com.url_shortener.url_shortener.users.UserRegister;
import com.url_shortener.url_shortener.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private UserMapper userMapper;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminController adminController;

    @BeforeEach
    void setUp() {
        adminController = new AdminController(userMapper, userRepository, passwordEncoder);
    }

    @Test
    void addNewAdmin_Success() {
        UserRegister register = new UserRegister("Admin", "admin@test.com", "Secret123!");
        User user = new User();
        user.setEmail("admin@test.com");
        UserDto dto = new UserDto("uuid-123", "Admin", "admin@test.com", "ADMIN", LocalDateTime.now());

        when(userRepository.existsUserByEmail("admin@test.com")).thenReturn(false);
        when(userMapper.toEntity(register)).thenReturn(user);
        when(passwordEncoder.encode("Secret123!")).thenReturn("encodedPassword");
        when(userMapper.toDto(user)).thenReturn(dto);

        ResponseEntity<UserDto> response = adminController.addNewAdmin(register);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(dto);
        assertThat(user.getRole()).isEqualTo(Role.ADMIN);
        assertThat(user.getPassword()).isEqualTo("encodedPassword");
        verify(userRepository).save(user);
    }

    @Test
    void addNewAdmin_AlreadyExists_ThrowsException() {
        UserRegister register = new UserRegister("Admin", "admin@test.com", "Secret123!");
        when(userRepository.existsUserByEmail("admin@test.com")).thenReturn(true);

        assertThatThrownBy(() -> adminController.addNewAdmin(register))
                .isInstanceOf(UserAlreadyExist.class);
    }
}
