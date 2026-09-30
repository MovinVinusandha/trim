package com.url_shortener.auth_service.common;

import com.url_shortener.auth_service.users.UserAlreadyExist;
import com.url_shortener.auth_service.users.UserNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> userNotFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(UserAlreadyExist.class)
    public ResponseEntity<Map<String, String>> userAlreadyRegistered() {
        return ResponseEntity.badRequest().body(
                Map.of("message", "This User has already been registered")
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException exception
    ) {
        var errors = new HashMap<String, String>();

        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleIllegalArgument(RuntimeException exception) {
        return ResponseEntity.badRequest().body(
                Map.of("message", exception.getMessage())
        );
    }
}
