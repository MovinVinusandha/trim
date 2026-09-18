package com.url_shortener.url_shortener.admin.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuditService {

    public static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    public static final DateTimeFormatter HASH_TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

    private final AdminAuditLogRepository auditLogRepository;

    /**
     * Records an immutable admin action with SHA-256 hash chaining.
     * Uses REQUIRES_NEW propagation to ensure audit records are written even if subsequent operations fail.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdminAuditLog record(
            Long actorId,
            String actorEmail,
            String actorRole,
            String actorIp,
            String action,
            String targetType,
            String targetIdentifier,
            String details,
            String metadataJson
    ) {
        String prevHash = auditLogRepository.findTopByOrderByIdDesc()
                .map(AdminAuditLog::getEntryHash)
                .orElse(GENESIS_HASH);

        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MILLIS);
        String formattedTimestamp = now.format(HASH_TIMESTAMP_FORMATTER);

        String rawContent = String.join("|",
                prevHash,
                String.valueOf(actorId),
                actorEmail != null ? actorEmail : "",
                actorRole != null ? actorRole : "",
                actorIp != null ? actorIp : "",
                action != null ? action : "",
                targetType != null ? targetType : "",
                targetIdentifier != null ? targetIdentifier : "",
                details != null ? details : "",
                metadataJson != null ? metadataJson : "",
                formattedTimestamp
        );

        String entryHash = computeSha256(rawContent);

        AdminAuditLog logEntry = AdminAuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail != null ? actorEmail : "SYSTEM")
                .actorRole(actorRole != null ? actorRole : "SYSTEM")
                .actorIp(actorIp)
                .action(action)
                .targetType(targetType)
                .targetIdentifier(targetIdentifier)
                .details(details)
                .metadataJson(metadataJson)
                .prevHash(prevHash)
                .entryHash(entryHash)
                .createdAt(now)
                .build();

        AdminAuditLog saved = auditLogRepository.save(logEntry);
        log.info("[AUDIT] Recorded {} by {} on {}:{} [hash={}]", action, actorEmail, targetType, targetIdentifier, entryHash.substring(0, 12));
        return saved;
    }


    private String computeSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
