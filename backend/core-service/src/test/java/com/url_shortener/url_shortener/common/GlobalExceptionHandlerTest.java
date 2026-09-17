package com.url_shortener.url_shortener.common;

import com.url_shortener.url_shortener.urls.LinkExpiredException;
import com.url_shortener.url_shortener.urls.PasswordProtectedException;
import com.url_shortener.url_shortener.urls.UrlExistInDataBaseException;
import com.url_shortener.url_shortener.urls.UrlNotFoundException;
import com.url_shortener.url_shortener.users.UserAlreadyExist;
import com.url_shortener.url_shortener.users.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        ReflectionTestUtils.setField(exceptionHandler, "dashboardUrl", "http://app.localhost");
        ReflectionTestUtils.setField(exceptionHandler, "frontendUrl", "http://localhost");
        ReflectionTestUtils.setField(exceptionHandler, "appDomainUrl", "http://app.localhost");
    }

    @Test
    void urlNotFound_ApiUri_Returns404() {
        when(request.getRequestURI()).thenReturn("/api/health");
        ResponseEntity<?> res = exceptionHandler.urlNotFound(request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        when(request.getRequestURI()).thenReturn("/url/shorten");
        ResponseEntity<?> res2 = exceptionHandler.urlNotFound(request);
        assertThat(res2.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void urlNotFound_PublicHashUri_Returns302Redirect() {
        when(request.getRequestURI()).thenReturn("/abc12345");
        ResponseEntity<?> res = exceptionHandler.urlNotFound(request);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(res.getHeaders().getLocation().toString()).isEqualTo("http://app.localhost/not-found");
    }

    @Test
    void userNotFound_Returns404() {
        ResponseEntity<String> res = exceptionHandler.userNotFound();
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void linkExpired_Redirects() throws IOException {
        exceptionHandler.linkExpired(new LinkExpiredException("Expired"), response);
        verify(response).sendRedirect("http://app.localhost/expired");
    }

    @Test
    void passwordProtected_RedirectsToSecurePage() throws IOException {
        exceptionHandler.passwordProtected(new PasswordProtectedException("hash999"), response);
        verify(response).sendRedirect("http://app.localhost/secure/hash999");
    }

    @Test
    void handleBadCredentials_Returns401() {
        var res = exceptionHandler.handleBadCredentials(new BadCredentialsException("Invalid password"));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getBody()).containsEntry("message", "Invalid password");
    }

    @Test
    void urlInDb_Returns400() {
        var res = exceptionHandler.urlInDb();
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).containsKey("longUrl");
    }

    @Test
    void userAlreadyRegistered_Returns400() {
        var res = exceptionHandler.userAlreadyRegistered();
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).containsKey("longUrl");
    }

    @Test
    void handleValidationErrors_Returns400WithErrors() throws NoSuchMethodException {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "email", "Email is invalid");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        Method method = this.getClass().getDeclaredMethod("setUp");
        MethodParameter parameter = new MethodParameter(method, -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<Map<String, String>> res = exceptionHandler.handleValidationErrors(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).containsEntry("email", "Email is invalid");
    }
}
