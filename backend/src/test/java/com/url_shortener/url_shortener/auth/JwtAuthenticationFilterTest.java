package com.url_shortener.url_shortener.auth;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilter_NoAuthHeader_ContinuesChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilter_NonBearerHeader_ContinuesChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Basic 12345");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilter_NullParsedJwt_ContinuesChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid_token");
        when(jwtService.parseToken("invalid_token")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilter_ExpiredJwt_ContinuesChain() throws ServletException, IOException {
        Jwt jwt = mock(Jwt.class);
        when(jwt.isExpired()).thenReturn(true);
        when(request.getHeader("Authorization")).thenReturn("Bearer expired_token");
        when(jwtService.parseToken("expired_token")).thenReturn(jwt);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilter_ValidJwt_SetsAuthentication() throws ServletException, IOException {
        Jwt jwt = mock(Jwt.class);
        when(jwt.isExpired()).thenReturn(false);
        when(jwt.getUserId()).thenReturn(42L);
        when(jwt.getRole()).thenReturn(com.url_shortener.url_shortener.users.Role.USER);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid_token");
        when(jwtService.parseToken("valid_token")).thenReturn(jwt);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(42L);
        assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
    }

    @Test
    void doFilter_ExpiredJwtException_ContinuesChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer expired_token");
        when(jwtService.parseToken("expired_token")).thenThrow(new ExpiredJwtException(null, null, "Expired token"));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilter_GenericException_ContinuesChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer corrupt_token");
        when(jwtService.parseToken("corrupt_token")).thenThrow(new RuntimeException("Token parse failure"));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
