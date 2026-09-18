package com.url_shortener.admin_service.audit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminAuditServiceTest {

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @InjectMocks
    private AdminAuditService auditService;

    @Test
    void testRecord_FirstEntry_UsesGenesisHash() {
        when(auditLogRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AdminAuditLog.class))).thenAnswer(i -> {
            AdminAuditLog log = i.getArgument(0);
            log.setId(1L);
            return log;
        });

        AdminAuditLog log = auditService.record(
                1L, "admin@trim.com", "ADMIN", "127.0.0.1",
                "USER_SUSPENDED", "USER", "user@test.com", "Suspended for abuse", "{}"
        );

        assertThat(log).isNotNull();
        assertThat(log.getPrevHash()).isEqualTo(AdminAuditService.GENESIS_HASH);
        assertThat(log.getEntryHash()).isNotEmpty();
        assertThat(log.getAction()).isEqualTo("USER_SUSPENDED");
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void testVerifyChainIntegrity_EmptyLogs_ReturnsValid() {
        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(Collections.emptyList());

        AuditChainVerificationDto result = auditService.verifyChainIntegrity();

        assertThat(result.isValid()).isTrue();
        assertThat(result.getTotalVerified()).isEqualTo(0);
        assertThat(result.getGenesisHash()).isEqualTo(AdminAuditService.GENESIS_HASH);
    }
}
