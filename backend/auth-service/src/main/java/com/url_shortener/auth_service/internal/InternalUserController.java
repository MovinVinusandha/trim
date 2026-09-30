package com.url_shortener.auth_service.internal;

import com.url_shortener.auth_service.auth.TokenRevocationService;
import com.url_shortener.auth_service.users.Role;
import com.url_shortener.auth_service.users.User;
import com.url_shortener.auth_service.users.UserRepository;
import com.url_shortener.common.dto.AdminUserActionRequestDto;
import com.url_shortener.common.dto.InternalUserSummaryDto;
import com.url_shortener.common.dto.UserCountsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;
    private final TokenRevocationService tokenRevocationService;
    private final com.url_shortener.auth_service.users.UserService userService;
    private final com.url_shortener.auth_service.auth.EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final com.url_shortener.auth_service.auth.PasswordResetTokenRepository passwordResetTokenRepository;
    private final com.url_shortener.auth_service.users.UserOAuthAccountRepository userOAuthAccountRepository;
    private final com.url_shortener.auth_service.event.EventPublisher eventPublisher;

    @GetMapping("/counts")
    public ResponseEntity<UserCountsDto> getUserCounts() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsSuspendedFalse();
        long suspendedUsers = userRepository.countByIsSuspendedTrue();

        return ResponseEntity.ok(UserCountsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .build());
    }

    @GetMapping
    public ResponseEntity<Page<InternalUserSummaryDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage;

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim();
            userPage = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        return ResponseEntity.ok(userPage.map(this::toSummaryDto));
    }

    @GetMapping("/{publicId}")
    public ResponseEntity<InternalUserSummaryDto> getUserByPublicId(@PathVariable String publicId) {
        return userRepository.findByPublicId(publicId)
                .map(u -> ResponseEntity.ok(toSummaryDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<InternalUserSummaryDto> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> ResponseEntity.ok(toSummaryDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{publicId}/suspend")
    @Transactional
    public ResponseEntity<InternalUserSummaryDto> toggleSuspension(
            @PathVariable String publicId,
            @RequestBody AdminUserActionRequestDto request
    ) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + publicId));

        if (request.getCurrentAdminId() != null && user.getId().equals(request.getCurrentAdminId())) {
            throw new IllegalArgumentException("You cannot suspend your own account.");
        }
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("The ROOT instance owner cannot be suspended.");
        }

        boolean willSuspend = !user.isSuspended();
        user.setSuspended(willSuspend);
        user.setSuspendedReason(willSuspend ? (request.getReason() != null ? request.getReason().trim() : "Suspended by administrator") : null);
        user = userRepository.save(user);

        if (willSuspend) {
            tokenRevocationService.revokeAllUserTokens(user.getId());
        }

        eventPublisher.publish(com.url_shortener.common.event.EventTopics.TOPIC_USER_SUSPENDED,
                com.url_shortener.common.event.UserSuspendedEvent.builder()
                        .userId(user.getId())
                        .publicId(user.getPublicId())
                        .email(user.getEmail())
                        .suspended(willSuspend)
                        .reason(user.getSuspendedReason())
                        .build());

        return ResponseEntity.ok(toSummaryDto(user));
    }

    @PostMapping("/{publicId}/role")
    @Transactional
    public ResponseEntity<InternalUserSummaryDto> updateRole(
            @PathVariable String publicId,
            @RequestBody AdminUserActionRequestDto request
    ) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + publicId));

        if (request.getCurrentAdminId() != null && user.getId().equals(request.getCurrentAdminId())) {
            throw new IllegalArgumentException("You cannot change your own role.");
        }
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("The ROOT instance owner role cannot be modified.");
        }
        if (request.getRole() == null || request.getRole() == com.url_shortener.common.Role.ROOT) {
            throw new IllegalArgumentException("Invalid role or cannot assign ROOT role.");
        }

        user.setRole(Role.valueOf(request.getRole().name()));
        user = userRepository.save(user);

        return ResponseEntity.ok(toSummaryDto(user));
    }

    @PostMapping("/{publicId}/quota")
    @Transactional
    public ResponseEntity<InternalUserSummaryDto> updateQuota(
            @PathVariable String publicId,
            @RequestBody AdminUserActionRequestDto request
    ) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + publicId));

        user.setCustomMaxLinks(request.getCustomMaxLinks());
        user = userRepository.save(user);

        return ResponseEntity.ok(toSummaryDto(user));
    }

    @PostMapping("/{publicId}/verify-email")
    @Transactional
    public ResponseEntity<InternalUserSummaryDto> manuallyVerifyEmail(@PathVariable String publicId) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + publicId));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("User email is already verified.");
        }

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user = userRepository.save(user);

        return ResponseEntity.ok(toSummaryDto(user));
    }

    @PostMapping("/{publicId}/resend-verification")
    @Transactional
    public ResponseEntity<Void> resendVerificationEmail(@PathVariable String publicId) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + publicId));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("User email is already verified.");
        }

        userService.sendNewVerificationEmail(user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{publicId}")
    @Transactional
    public ResponseEntity<InternalUserSummaryDto> deleteUser(
            @PathVariable String publicId,
            @RequestParam(required = false) Long currentAdminId
    ) {
        User user = userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + publicId));

        if (currentAdminId != null && user.getId().equals(currentAdminId)) {
            throw new IllegalArgumentException("You cannot delete your own account from the administrator console.");
        }
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("The ROOT instance owner cannot be deleted.");
        }

        InternalUserSummaryDto summary = toSummaryDto(user);
        tokenRevocationService.revokeAllUserTokens(user.getId());
        emailVerificationTokenRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByUser(user);
        var oauthAccounts = userOAuthAccountRepository.findByUser(user);
        userOAuthAccountRepository.deleteAll(oauthAccounts);
        userRepository.delete(user);

        eventPublisher.publish(com.url_shortener.common.event.EventTopics.TOPIC_USER_DELETED,
                com.url_shortener.common.event.UserDeletedEvent.builder()
                        .userId(summary.getId())
                        .publicId(summary.getPublicId())
                        .email(summary.getEmail())
                        .username(summary.getUsername())
                        .build());

        return ResponseEntity.ok(summary);
    }

    private InternalUserSummaryDto toSummaryDto(User u) {
        List<String> oauthProviders = Collections.emptyList();
        if (u.getOauthAccounts() != null && !u.getOauthAccounts().isEmpty()) {
            oauthProviders = u.getOauthAccounts().stream()
                    .map(com.url_shortener.auth_service.users.UserOAuthAccount::getProvider)
                    .distinct()
                    .collect(Collectors.toList());
        }

        return InternalUserSummaryDto.builder()
                .id(u.getId())
                .publicId(u.getPublicId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(com.url_shortener.common.Role.valueOf(u.getRole().name()))
                .emailVerified(u.isEmailVerified())
                .emailVerifiedAt(u.getEmailVerifiedAt())
                .customMaxLinks(u.getCustomMaxLinks())
                .isSuspended(u.isSuspended())
                .suspendedReason(u.getSuspendedReason())
                .connectedOAuthProviders(oauthProviders)
                .createdAt(u.getCreatedAt())
                .build();
    }
}
