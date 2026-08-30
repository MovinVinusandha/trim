package com.url_shortener.url_shortener.analytics;

import com.url_shortener.url_shortener.analytics.dto.AnalyticsResponseDto;
import com.url_shortener.url_shortener.statistics.Statistic;
import com.url_shortener.url_shortener.urls.Folder;
import com.url_shortener.url_shortener.urls.FolderRepository;
import com.url_shortener.url_shortener.urls.Url;
import com.url_shortener.url_shortener.urls.UrlNotFoundException;
import com.url_shortener.url_shortener.urls.UrlRepository;
import com.url_shortener.url_shortener.users.Role;
import com.url_shortener.url_shortener.users.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private UrlRepository urlRepository;
    @Mock
    private FolderRepository folderRepository;
    @Mock
    private ClickEventRepository clickEventRepository;
    @Mock
    private UserAgentParserService userAgentParserService;
    @Mock
    private GeoLocationService geoLocationService;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Captor
    private ArgumentCaptor<LocalDateTime> dateCaptor;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder().id(1L).role(Role.USER).build();
    }

    @Test
    void getUserUsageStats_Success() {
        when(urlRepository.countByUserId(1L)).thenReturn(12L);
        when(clickEventRepository.countTotalClicksByUserId(1L)).thenReturn(340L);

        var stats = analyticsService.getUserUsageStats(currentUser);

        assertThat(stats.getTotalLinks()).isEqualTo(12L);
        assertThat(stats.getTotalClicks()).isEqualTo(340L);
    }

    @Test
    void getOverallAnalytics_With24hPeriod() {
        when(clickEventRepository.countTotalOverallClicks(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(null), eq(null))).thenReturn(150L);
        when(clickEventRepository.countOverallClicksByHour(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByCountry(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByDevice(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByBrowser(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getOverallAnalytics(currentUser, "24h", null, null, null, null, null);

        assertThat(response).isNotNull();
        assertThat(response.getTotalClicks()).isEqualTo(150L);
    }

    @Test
    void getLinkAnalytics_Success() {
        Url url = Url.builder().id(100L).user(currentUser).build();
        when(urlRepository.findByShortUrl("hash123")).thenReturn(url);
        when(clickEventRepository.countByUrl_Id(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(50L);
        when(clickEventRepository.countByDateForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByCountryForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByDeviceForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByBrowserForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getAnalytics("hash123", currentUser, "7d", null, null);

        assertThat(response).isNotNull();
        assertThat(response.getTotalClicks()).isEqualTo(50L);
    }

    @Test
    void getLinkAnalytics_UrlNotFound_ThrowsException() {
        when(urlRepository.findByShortUrl("missing")).thenReturn(null);

        assertThatThrownBy(() -> analyticsService.getAnalytics("missing", currentUser, "7d", null, null))
                .isInstanceOf(UrlNotFoundException.class);
    }

    @Test
    void getLinkAnalytics_UnauthorizedUser_ThrowsException() {
        User other = User.builder().id(2L).role(Role.USER).build();
        Url url = Url.builder().id(100L).user(other).build();
        when(urlRepository.findByShortUrl("hash123")).thenReturn(url);

        assertThatThrownBy(() -> analyticsService.getAnalytics("hash123", currentUser, "7d", null, null))
                .isInstanceOf(UrlNotFoundException.class);
    }

    @Test
    void getFolderAnalytics_Success() {
        Folder folder = Folder.builder().id(50L).user(currentUser).build();
        when(folderRepository.findById(50L)).thenReturn(Optional.of(folder));
        when(clickEventRepository.countTotalFolderClicks(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(75L);
        when(clickEventRepository.countFolderClicksByDate(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByCountry(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByDevice(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByBrowser(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getFolderAnalytics(50L, currentUser, "all", null, null);

        assertThat(response).isNotNull();
        assertThat(response.getTotalClicks()).isEqualTo(75L);
    }

    @Test
    void getFolderAnalytics_UnauthorizedUser_ThrowsAccessDenied() {
        User other = User.builder().id(2L).role(Role.USER).build();
        Folder folder = Folder.builder().id(50L).user(other).build();
        when(folderRepository.findById(50L)).thenReturn(Optional.of(folder));

        assertThatThrownBy(() -> analyticsService.getFolderAnalytics(50L, currentUser, "all", null, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getFolderAnalyticsBySlug_Success() {
        Folder folder = Folder.builder().id(50L).user(currentUser).build();
        when(folderRepository.findByUserIdAndSlug(1L, "marketing-2026")).thenReturn(Optional.of(folder));
        when(folderRepository.findById(50L)).thenReturn(Optional.of(folder));
        when(clickEventRepository.countTotalFolderClicks(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(75L);
        when(clickEventRepository.countFolderClicksByDate(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByCountry(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByDevice(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByBrowser(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getFolderAnalyticsBySlug("marketing-2026", currentUser, "all", null, null);

        assertThat(response).isNotNull();
        assertThat(response.getTotalClicks()).isEqualTo(75L);
    }

    @Test
    void dateRangeFiltering_CustomDates() {
        when(clickEventRepository.countTotalOverallClicks(eq(1L), any(), any(), eq(null), eq(null), eq(null))).thenReturn(100L);
        when(clickEventRepository.countOverallClicksByDate(eq(1L), any(), any(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByCountry(eq(1L), any(), any(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByDevice(eq(1L), any(), any(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByBrowser(eq(1L), any(), any(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());

        analyticsService.getOverallAnalytics(currentUser, "custom", "2026-08-01T00:00:00", "2026-08-10T23:59:59", null, null, null);

        verify(clickEventRepository).countTotalOverallClicks(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class), eq(null), eq(null), eq(null));
    }

    @Test
    void trackClick_Success() {
        Statistic statistic = new Statistic();
        Url url = Url.builder().id(10L).shortUrl("clickHash").statistic(statistic).build();
        when(urlRepository.findByShortUrl("clickHash")).thenReturn(url);

        when(userAgentParserService.parse("Chrome-UA"))
                .thenReturn(new UserAgentParserService.DeviceInfo("Desktop", "Chrome", "Windows"));
        when(geoLocationService.lookup("8.8.8.8"))
                .thenReturn(new GeoLocationService.GeoInfo("United States", "Mountain View", "California", "North America"));
        when(clickEventRepository.countByUrl_Id(eq(10L), any(), any())).thenReturn(1L);

        analyticsService.trackClick("clickHash", "Chrome-UA", "8.8.8.8");

        verify(clickEventRepository).save(any(ClickEvent.class));
        verify(urlRepository).save(url);
        assertThat(statistic.getAccessedTimes()).isEqualTo(1L);
    }

    @Test
    void trackClick_UrlNotFound_DoesNothing() {
        when(urlRepository.findByShortUrl("missing")).thenReturn(null);

        analyticsService.trackClick("missing", "UA", "1.1.1.1");

        verify(clickEventRepository, never()).save(any());
    }

    @Test
    void getAnalytics_HourlyGranularity() {
        Url url = Url.builder().id(100L).user(currentUser).build();
        when(urlRepository.findByShortUrl("hash123")).thenReturn(url);
        when(clickEventRepository.countByUrl_Id(eq(100L), any(LocalDateTime.class), any())).thenReturn(10L);
        when(clickEventRepository.countByHourForUrl(eq(100L), any(LocalDateTime.class), any())).thenReturn(List.of(
                new Object[]{"2026-08-14 05:00:00", 4L},
                new Object[]{"2026-08-14 08:00:00", 6L}
        ));
        when(clickEventRepository.countByCountryForUrl(eq(100L), any(LocalDateTime.class), any())).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByDeviceForUrl(eq(100L), any(LocalDateTime.class), any())).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByBrowserForUrl(eq(100L), any(LocalDateTime.class), any())).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getAnalytics("hash123", currentUser, "24h", null, null);

        assertThat(response).isNotNull();
        assertThat(response.getTotalClicks()).isEqualTo(10L);
        assertThat(response.getClicksByDate()).isNotEmpty();
        assertThat(response.getClicksByDate().get(0).getDate()).contains("T");
    }
}
