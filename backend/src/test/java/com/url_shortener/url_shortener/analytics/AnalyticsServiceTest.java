package com.url_shortener.url_shortener.analytics;

import com.url_shortener.url_shortener.analytics.dto.AnalyticsResponseDto;
import com.url_shortener.url_shortener.analytics.dto.ClickDataPoint;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    void getOverallAnalytics_WithTagFiltersAndDailyPeriod() {
        when(clickEventRepository.countTotalOverallClicks(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(List.of(10L)), eq(5L))).thenReturn(50L);
        when(clickEventRepository.countOverallClicksByDate(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(List.of(10L)), eq(5L))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByCountry(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(List.of(10L)), eq(5L))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByDevice(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(List.of(10L)), eq(5L))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByBrowser(eq(1L), any(LocalDateTime.class), eq(null), eq(null), eq(List.of(10L)), eq(5L))).thenReturn(Collections.emptyList());

        List<Long> tagIds = new ArrayList<>();
        tagIds.add(null);
        tagIds.add(0L);
        tagIds.add(-1L);
        tagIds.add(10L);

        AnalyticsResponseDto response = analyticsService.getOverallAnalytics(currentUser, "7d", null, null, null, tagIds, 5L);

        assertThat(response).isNotNull();
        assertThat(response.getTotalClicks()).isEqualTo(50L);
    }

    @Test
    void getOverallAnalytics_EmptyTagIds_TreatedAsNull() {
        when(clickEventRepository.countTotalOverallClicks(eq(1L), any(LocalDateTime.class), eq(null), eq(null), isNull(), eq(null))).thenReturn(0L);
        when(clickEventRepository.countOverallClicksByDate(eq(1L), any(LocalDateTime.class), eq(null), eq(null), isNull(), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByCountry(eq(1L), any(LocalDateTime.class), eq(null), eq(null), isNull(), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByDevice(eq(1L), any(LocalDateTime.class), eq(null), eq(null), isNull(), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByBrowser(eq(1L), any(LocalDateTime.class), eq(null), eq(null), isNull(), eq(null))).thenReturn(Collections.emptyList());

        List<Long> tagIds = List.of(0L, -5L);
        AnalyticsResponseDto response = analyticsService.getOverallAnalytics(currentUser, "30d", null, null, null, tagIds, null);

        assertThat(response).isNotNull();
    }

    @Test
    void getLinkAnalytics_Success_RegularUser() {
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
    void getLinkAnalytics_Success_RootUserAccessingOtherUserLink() {
        User rootUser = User.builder().id(99L).role(Role.ROOT).build();
        Url url = Url.builder().id(100L).user(currentUser).build();
        when(urlRepository.findByShortUrl("hash123")).thenReturn(url);
        when(clickEventRepository.countByUrl_Id(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(50L);
        when(clickEventRepository.countByDateForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByCountryForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByDeviceForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countByBrowserForUrl(eq(100L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getAnalytics("hash123", rootUser, "7d", null, null);

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
    void getFolderAnalytics_Success_RegularUser() {
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
    void getFolderAnalytics_Success_RootUser() {
        User rootUser = User.builder().id(99L).role(Role.ROOT).build();
        Folder folder = Folder.builder().id(50L).user(currentUser).build();
        when(folderRepository.findById(50L)).thenReturn(Optional.of(folder));
        when(clickEventRepository.countTotalFolderClicks(eq(50L), eq(99L), any(LocalDateTime.class), eq(null))).thenReturn(75L);
        when(clickEventRepository.countFolderClicksByDate(eq(50L), eq(99L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByCountry(eq(50L), eq(99L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByDevice(eq(50L), eq(99L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByBrowser(eq(50L), eq(99L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getFolderAnalytics(50L, rootUser, "all", null, null);

        assertThat(response).isNotNull();
    }

    @Test
    void getFolderAnalytics_FolderNotFound_ThrowsException() {
        when(folderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.getFolderAnalytics(999L, currentUser, "all", null, null))
                .isInstanceOf(RuntimeException.class);
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
    void getFolderAnalytics_HourlyGranularity() {
        Folder folder = Folder.builder().id(50L).user(currentUser).build();
        when(folderRepository.findById(50L)).thenReturn(Optional.of(folder));
        when(clickEventRepository.countTotalFolderClicks(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(75L);
        when(clickEventRepository.countFolderClicksByHour(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByCountry(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByDevice(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countFolderClicksByBrowser(eq(50L), eq(1L), any(LocalDateTime.class), eq(null))).thenReturn(Collections.emptyList());

        AnalyticsResponseDto response = analyticsService.getFolderAnalytics(50L, currentUser, "24h", null, null);

        assertThat(response).isNotNull();
    }

    @Test
    void dateRangeFiltering_CustomDates_InvalidFallback() {
        when(clickEventRepository.countTotalOverallClicks(eq(1L), any(), isNull(), eq(null), eq(null), eq(null))).thenReturn(100L);
        when(clickEventRepository.countOverallClicksByDate(eq(1L), any(), isNull(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByCountry(eq(1L), any(), isNull(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByDevice(eq(1L), any(), isNull(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());
        when(clickEventRepository.countOverallClicksByBrowser(eq(1L), any(), isNull(), eq(null), eq(null), eq(null))).thenReturn(Collections.emptyList());

        analyticsService.getOverallAnalytics(currentUser, null, "invalid-date", "invalid-date", null, null, null);

        verify(clickEventRepository).countTotalOverallClicks(eq(1L), any(LocalDateTime.class), isNull(), eq(null), eq(null), eq(null));
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
    void trackClick_WithParserAndGeoExceptions_HandlesGracefully() {
        Url url = Url.builder().id(10L).shortUrl("clickHash").build();
        when(urlRepository.findByShortUrl("clickHash")).thenReturn(url);
        when(userAgentParserService.parse(any())).thenThrow(new RuntimeException("UA crash"));
        when(geoLocationService.lookup(any())).thenThrow(new RuntimeException("Geo crash"));

        analyticsService.trackClick("clickHash", "bad-ua", "invalid-ip");

        verify(clickEventRepository).save(any(ClickEvent.class));
    }

    @Test
    void trackClick_UrlNotFound_DoesNothing() {
        when(urlRepository.findByShortUrl("missing")).thenReturn(null);

        analyticsService.trackClick("missing", "UA", "1.1.1.1");

        verify(clickEventRepository, never()).save(any());
    }

    @Test
    void isHourlyGranularity_Branches() {
        LocalDateTime now = LocalDateTime.now();
        assertThat((Boolean) ReflectionTestUtils.invokeMethod(analyticsService, "isHourlyGranularity", "24h", null, null)).isTrue();
        assertThat((Boolean) ReflectionTestUtils.invokeMethod(analyticsService, "isHourlyGranularity", "7d", null, null)).isFalse();
        assertThat((Boolean) ReflectionTestUtils.invokeMethod(analyticsService, "isHourlyGranularity", "custom", now.minusHours(5), now)).isTrue();
        assertThat((Boolean) ReflectionTestUtils.invokeMethod(analyticsService, "isHourlyGranularity", "custom", now.minusHours(30), now)).isFalse();
        assertThat((Boolean) ReflectionTestUtils.invokeMethod(analyticsService, "isHourlyGranularity", "custom", now.plusHours(5), now)).isFalse();
        assertThat((Boolean) ReflectionTestUtils.invokeMethod(analyticsService, "isHourlyGranularity", "custom", LocalDateTime.of(1970, 1, 1, 0, 0), now)).isFalse();
    }

    @Test
    void fillMissingHours_Branches() {
        LocalDateTime start = LocalDateTime.now().minusHours(3);
        LocalDateTime end = LocalDateTime.now();

        // start after end -> returns rawData
        List<ClickDataPoint> raw = List.of(new ClickDataPoint("2026-08-30T10:00:00", 2L));
        List<ClickDataPoint> resultSwapped = ReflectionTestUtils.invokeMethod(analyticsService, "fillMissingHours", raw, end, start);
        assertThat(resultSwapped).isEqualTo(raw);

        // start is 1970 and rawData has date
        List<ClickDataPoint> rawWithDate = List.of(
                new ClickDataPoint("2026-08-30 10:00:00", 3L),
                new ClickDataPoint("2026-08-30", 1L),
                new ClickDataPoint("corrupt-date", 5L)
        );
        List<ClickDataPoint> result1970 = ReflectionTestUtils.invokeMethod(analyticsService, "fillMissingHours", rawWithDate, LocalDateTime.of(1970, 1, 1, 0, 0), null);
        assertThat(result1970).isNotEmpty();

        // start is 1970 and rawData empty
        List<ClickDataPoint> resultEmpty = ReflectionTestUtils.invokeMethod(analyticsService, "fillMissingHours", Collections.emptyList(), null, null);
        assertThat(resultEmpty).isNotEmpty();
    }

    @Test
    void fillMissingDates_Branches() {
        LocalDateTime start = LocalDateTime.now().minusDays(3);
        LocalDateTime end = LocalDateTime.now();

        // start after end -> returns rawData
        List<ClickDataPoint> raw = List.of(new ClickDataPoint("2026-08-30", 2L));
        List<ClickDataPoint> resultSwapped = ReflectionTestUtils.invokeMethod(analyticsService, "fillMissingDates", raw, end, start);
        assertThat(resultSwapped).isEqualTo(raw);

        // start is 1970 and rawData has date
        List<ClickDataPoint> rawWithDate = List.of(
                new ClickDataPoint("2026-08-28", 3L),
                new ClickDataPoint("bad-date", 1L)
        );
        List<ClickDataPoint> result1970 = ReflectionTestUtils.invokeMethod(analyticsService, "fillMissingDates", rawWithDate, LocalDateTime.of(1970, 1, 1, 0, 0), null);
        assertThat(result1970).isNotEmpty();

        // start is 1970 and rawData empty
        List<ClickDataPoint> resultEmpty = ReflectionTestUtils.invokeMethod(analyticsService, "fillMissingDates", Collections.emptyList(), null, null);
        assertThat(resultEmpty).isNotEmpty();
    }

    @Test
    void getStartDateFromPeriod_Branches() {
        assertThat((LocalDateTime) ReflectionTestUtils.invokeMethod(analyticsService, "getStartDateFromPeriod", (Object) null))
                .isEqualTo(LocalDateTime.of(1970, 1, 1, 0, 0));
        assertThat((LocalDateTime) ReflectionTestUtils.invokeMethod(analyticsService, "getStartDateFromPeriod", "24h")).isNotNull();
        assertThat((LocalDateTime) ReflectionTestUtils.invokeMethod(analyticsService, "getStartDateFromPeriod", "7d")).isNotNull();
        assertThat((LocalDateTime) ReflectionTestUtils.invokeMethod(analyticsService, "getStartDateFromPeriod", "30d")).isNotNull();
        assertThat((LocalDateTime) ReflectionTestUtils.invokeMethod(analyticsService, "getStartDateFromPeriod", "ytd"))
                .isEqualTo(LocalDateTime.of(1970, 1, 1, 0, 0));
    }

    @Test
    void hashIp_Branches() {
        assertThat((String) ReflectionTestUtils.invokeMethod(analyticsService, "hashIp", (Object) null)).isEqualTo("unknown");
        assertThat((String) ReflectionTestUtils.invokeMethod(analyticsService, "hashIp", "   ")).isEqualTo("unknown");
        String hash = ReflectionTestUtils.invokeMethod(analyticsService, "hashIp", "192.168.1.1");
        assertThat(hash).hasSize(16);
    }
}
