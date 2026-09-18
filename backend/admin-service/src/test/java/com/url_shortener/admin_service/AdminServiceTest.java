package com.url_shortener.admin_service;

import com.url_shortener.admin_service.audit.AdminAuditService;
import com.url_shortener.admin_service.client.AnalyticsServiceClient;
import com.url_shortener.admin_service.client.AuthServiceClient;
import com.url_shortener.admin_service.client.CoreServiceClient;
import com.url_shortener.admin_service.dto.AdminOverviewDto;
import com.url_shortener.admin_service.security.BlockedIpService;
import com.url_shortener.admin_service.security.SecurityIncidentRepository;
import com.url_shortener.common.dto.analytics.AnalyticsAdminOverviewDto;
import com.url_shortener.common.dto.core.CoreLinkCountsDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private CoreServiceClient coreServiceClient;
    @Mock
    private AuthServiceClient authServiceClient;
    @Mock
    private AnalyticsServiceClient analyticsServiceClient;
    @Mock
    private AdminAuditService adminAuditService;
    @Mock
    private BlockedIpService blockedIpService;
    @Mock
    private SecurityIncidentRepository incidentRepository;
    @Mock
    private SystemSettingRepository systemSettingRepository;
    @Mock
    private BlacklistedDomainRepository blacklistedDomainRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private EnvSyncService envSyncService;

    @InjectMocks
    private AdminService adminService;

    @Test
    void testGetOverviewStats() {
        CoreLinkCountsDto counts = CoreLinkCountsDto.builder()
                .totalLinks(100L)
                .activeLinks(80L)
                .expiredLinks(15L)
                .quarantinedLinks(5L)
                .build();
        when(coreServiceClient.getLinkCounts()).thenReturn(counts);

        AnalyticsAdminOverviewDto analytics = AnalyticsAdminOverviewDto.builder()
                .totalClicks(5000L)
                .clicksLast24Hours(120L)
                .clicksByDate(Map.of("2026-09-18", 120L))
                .deviceDistribution(Collections.emptyList())
                .countryDistribution(Collections.emptyList())
                .build();
        when(analyticsServiceClient.getAdminOverview(7)).thenReturn(analytics);

        when(authServiceClient.getUserCounts()).thenReturn(new com.url_shortener.common.dto.UserCountsDto(50, 45, 5));
        when(incidentRepository.countByIsResolvedFalse()).thenReturn(0L);
        when(blockedIpService.getAllBlockedIps()).thenReturn(Collections.emptyList());
        when(blacklistedDomainRepository.count()).thenReturn(2L);
        when(coreServiceClient.getTopDomains(8)).thenReturn(Map.of("google.com", 20L));

        AdminOverviewDto overview = adminService.getOverviewStats(7);

        assertThat(overview).isNotNull();
        assertThat(overview.getTotalLinks()).isEqualTo(100L);
        assertThat(overview.getActiveLinks()).isEqualTo(80L);
        assertThat(overview.getTotalClicks()).isEqualTo(5000L);
        assertThat(overview.getTotalUsers()).isEqualTo(50L);
        assertThat(overview.getTopDomains()).isNotEmpty();
    }
}
