package com.url_shortener.url_shortener.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.url_shortener.url_shortener.users.User;
import com.url_shortener.url_shortener.users.UserDto;
import com.url_shortener.url_shortener.users.UserMapper;
import com.url_shortener.url_shortener.users.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationManager authenticationManager;
    @MockBean
    private JwtService jwtService;
    @MockBean
    private JwtConfig jwtConfig;
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private UserMapper userMapper;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void login_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest("test@test.com", "password123");

        User user = User.builder().id(1L).email("test@test.com").build();

        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("test@test.com", "password123"));
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));

        Jwt mockAccessJwt = mock(Jwt.class);
        when(mockAccessJwt.toString()).thenReturn("access_token_123");
        when(jwtService.generateAccessToken(user)).thenReturn(mockAccessJwt);

        Jwt mockRefreshJwt = mock(Jwt.class);
        when(mockRefreshJwt.toString()).thenReturn("refresh_token_123");
        when(jwtService.generateRefreshToken(user)).thenReturn(mockRefreshJwt);

        when(jwtConfig.getRefreshTokenExpiration()).thenReturn(86400);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access_token_123"))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().secure("refreshToken", true))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("SameSite=None")));
    }

    @Test
    void login_BadCredentials_Returns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest("test@test.com", "wrongpass");

        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshToken_Success() throws Exception {
        Jwt mockJwt = mock(Jwt.class);
        when(jwtService.parseToken("refresh_token_123")).thenReturn(mockJwt);
        when(mockJwt.isExpired()).thenReturn(false);
        when(mockJwt.getUserId()).thenReturn(1L);

        User user = User.builder().id(1L).email("test@test.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Jwt mockAccessJwt = mock(Jwt.class);
        when(mockAccessJwt.toString()).thenReturn("new_access_token");
        when(jwtService.generateAccessToken(user)).thenReturn(mockAccessJwt);

        mockMvc.perform(post("/auth/refresh")
                .cookie(new Cookie("refreshToken", "refresh_token_123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new_access_token"));
    }

    @Test
    void refreshToken_Unauthorized_WhenNull() throws Exception {
        when(jwtService.parseToken("invalid_token")).thenReturn(null);

        mockMvc.perform(post("/auth/refresh")
                .cookie(new Cookie("refreshToken", "invalid_token")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshToken_Unauthorized_WhenExpired() throws Exception {
        Jwt mockJwt = mock(Jwt.class);
        when(jwtService.parseToken("refresh_token_123")).thenReturn(mockJwt);
        when(mockJwt.isExpired()).thenReturn(true);

        mockMvc.perform(post("/auth/refresh")
                .cookie(new Cookie("refreshToken", "refresh_token_123")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_Success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(1L, null, Collections.emptyList())
        );

        User user = User.builder().id(1L).name("Test User").email("test@test.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserDto userDto = new UserDto("uuid-123", "Test User", "test@test.com", "USER", LocalDateTime.now());
        when(userMapper.toDto(user)).thenReturn(userDto);

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@test.com"));
    }

    @Test
    void me_UserNotFound_Returns404() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(999L, null, Collections.emptyList())
        );

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isNotFound());
    }
}
