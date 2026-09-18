package com.url_shortener.url_shortener.urls;

import com.url_shortener.url_shortener.client.AnalyticsServiceClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigInteger;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock
    private UrlMapper urlMapper;
    @Mock
    private UrlRepository urlRepository;
    @Mock
    private AnalyticsServiceClient analyticsServiceClient;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private FolderRepository folderRepository;
    @Mock
    private CacheManager cacheManager;
    @Mock
    private Cache cache;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(urlService, "rootDomainUrl", "http://localhost");
        ReflectionTestUtils.setField(urlService, "cacheManager", cacheManager);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void shortenUrl_CustomAliasAlreadyExists() {
        UrlRequest request = new UrlRequest("https://example.com", "my-brand", null, null, null, null);
        when(urlRepository.existsUrlByShortUrl("my-brand")).thenReturn(true);

        assertThatThrownBy(() -> urlService.generateShortUrl(request, null, 1L))
                .isInstanceOf(AliasAlreadyExistsException.class);
    }

    @Test
    void shortenUrl_InvalidCustomAlias() {
        UrlRequest request = new UrlRequest("https://example.com", "my/link", null, null, null, null);
        assertThatThrownBy(() -> urlService.generateShortUrl(request, null, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shortenUrl_GeneratedHashAlreadyExists() {
        UrlRequest request = new UrlRequest("https://example.com", null, null, null, null, null);
        when(urlRepository.existsUrlByShortUrl(anyString())).thenReturn(true);

        assertThatThrownBy(() -> urlService.generateShortUrl(request, null, null))
                .isInstanceOf(UrlExistInDataBaseException.class);
    }

    @Test
    void shortenUrl_WithPassword_Authenticated_EncodesPassword() {
        when(passwordEncoder.encode("secret123")).thenReturn("hashedSecret");

        UrlRequest request = new UrlRequest("https://example.com", null, null, "secret123", null, null);
        Url url = new Url();
        url.setLongUrl("https://example.com");

        when(urlMapper.toEntity(any())).thenReturn(url);
        when(urlRepository.save(any(Url.class))).thenAnswer(inv -> inv.getArgument(0));

        UrlSend expectedSend = new UrlSend("https://example.com", "HASH1", null, null, true, true, null, null, null);
        when(urlMapper.toSendDto(any(Url.class))).thenReturn(expectedSend);

        UrlSend result = urlService.generateShortUrl(request, null, 1L);

        assertThat(result).isNotNull();
        assertThat(url.getPasswordHash()).isEqualTo("hashedSecret");
    }

    @Test
    void shortenUrl_WithTagIds_UnauthorizedOwner_ThrowsIllegalArgumentException() {
        Tag foreignTag = Tag.builder().id(50L).userId(2L).build();
        when(tagRepository.findAllById(List.of(50L))).thenReturn(List.of(foreignTag));

        UrlRequest request = new UrlRequest("https://example.com", null, null, null, List.of(50L), null);
        Url url = new Url();
        when(urlMapper.toEntity(any())).thenReturn(url);

        assertThatThrownBy(() -> urlService.generateShortUrl(request, null, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shortenUrl_WithFolderId_UnauthorizedOwner_ThrowsIllegalArgumentException() {
        Folder foreignFolder = Folder.builder().id(30L).userId(2L).build();
        when(folderRepository.findById(30L)).thenReturn(Optional.of(foreignFolder));

        UrlRequest request = new UrlRequest("https://example.com", null, null, null, null, 30L);
        Url url = new Url();
        when(urlMapper.toEntity(any())).thenReturn(url);

        assertThatThrownBy(() -> urlService.generateShortUrl(request, null, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shortenUrl_WithDefaultFolder_Success() {
        Folder linksFolder = Folder.builder().id(10L).name("Links").slug("links").userId(1L).build();
        when(folderRepository.findByUserIdAndSlug(1L, "links")).thenReturn(Optional.of(linksFolder));

        UrlRequest request = new UrlRequest("https://example.com", null, LocalDateTime.now().plusDays(2), null, null, null);
        Url url = new Url();
        url.setLongUrl("https://example.com");

        when(urlMapper.toEntity(any())).thenReturn(url);
        when(urlRepository.save(any(Url.class))).thenAnswer(inv -> inv.getArgument(0));

        UrlSend expectedSend = new UrlSend("https://example.com", "HASH1", null, null, true, false, null, null, null);
        when(urlMapper.toSendDto(any(Url.class))).thenReturn(expectedSend);

        UrlSend result = urlService.generateShortUrl(request, null, 1L);

        assertThat(result).isNotNull();
        assertThat(url.getFolder()).isEqualTo(linksFolder);
        verify(valueOperations).set(startsWith("urls::"), eq("https://example.com"), any(Duration.class));
    }

    @Test
    void shortenUrl_DefaultFolder_FallbackByNameAndCreation() {
        when(folderRepository.findByUserIdAndSlug(1L, "links")).thenReturn(Optional.empty());
        when(folderRepository.findByNameIgnoreCaseAndUserId("Links", 1L)).thenReturn(Optional.empty());

        Folder createdDefault = Folder.builder().id(20L).name("Links").slug("links").userId(1L).build();
        when(folderRepository.save(any(Folder.class))).thenReturn(createdDefault);

        UrlRequest request = new UrlRequest("https://example.com", null, null, null, null, null);
        Url url = new Url();
        url.setLongUrl("https://example.com");

        when(urlMapper.toEntity(any())).thenReturn(url);
        when(urlRepository.save(any(Url.class))).thenAnswer(inv -> inv.getArgument(0));

        UrlSend expectedSend = new UrlSend("https://example.com", "HASH1", null, null, true, false, null, null, null);
        when(urlMapper.toSendDto(any(Url.class))).thenReturn(expectedSend);

        UrlSend result = urlService.generateShortUrl(request, null, 1L);

        assertThat(result).isNotNull();
        assertThat(url.getFolder()).isEqualTo(createdDefault);
    }

    @Test
    void shortenUrl_ExpiredDateInPast_SetsInactive() {
        UrlRequest request = new UrlRequest("https://example.com", null, LocalDateTime.now().minusDays(1), null, null, null);
        Url url = new Url();
        url.setExpiresAt(request.getExpiresAt());
        when(urlMapper.toEntity(any())).thenReturn(url);
        when(urlRepository.save(any(Url.class))).thenAnswer(inv -> inv.getArgument(0));
        UrlSend expectedSend = new UrlSend("https://example.com", "HASH1", null, null, false, false, null, null, null);
        when(urlMapper.toSendDto(any(Url.class))).thenReturn(expectedSend);

        UrlSend result = urlService.generateShortUrl(request, null, null);

        assertThat(result).isNotNull();
        assertThat(url.isActive()).isFalse();
    }

    @Test
    void getLongUrlForRedirect_Expired_ThrowsLinkExpiredException() {
        Url url = Url.builder().id(1L).shortUrl("expHash").isActive(true).expiresAt(LocalDateTime.now().minusMinutes(5)).build();
        when(urlRepository.findByShortUrl("expHash")).thenReturn(url);

        assertThatThrownBy(() -> urlService.getLongUrlForRedirect("expHash"))
                .isInstanceOf(LinkExpiredException.class);

        assertThat(url.isActive()).isFalse();
        verify(urlRepository, times(2)).save(url);
        verify(redisTemplate, times(2)).delete("urls::expHash");
    }

    @Test
    void getLongUrlForRedirect_Inactive_ThrowsLinkExpiredException() {
        Url url = Url.builder().id(1L).shortUrl("inact").isActive(false).build();
        when(urlRepository.findByShortUrl("inact")).thenReturn(url);

        assertThatThrownBy(() -> urlService.getLongUrlForRedirect("inact"))
                .isInstanceOf(LinkExpiredException.class);
    }

    @Test
    void getLongUrlForRedirect_PasswordProtected_ThrowsPasswordProtectedException() {
        Url url = Url.builder().id(1L).shortUrl("secHash").isActive(true).passwordHash("someHash").build();
        when(urlRepository.findByShortUrl("secHash")).thenReturn(url);

        assertThatThrownBy(() -> urlService.getLongUrlForRedirect("secHash"))
                .isInstanceOf(PasswordProtectedException.class);
    }

    @Test
    void getLongUrlForRedirect_RedisCacheHit() {
        Url url = Url.builder().id(1L).shortUrl("cachedHash").isActive(true).longUrl("https://destination.com").build();
        when(urlRepository.findByShortUrl("cachedHash")).thenReturn(url);
        when(valueOperations.get("urls::cachedHash")).thenReturn("https://destination.com");

        String result = urlService.getLongUrlForRedirect("cachedHash");

        assertThat(result).isEqualTo("https://destination.com");
    }

    @Test
    void getLongUrlForRedirect_RedisCacheMiss_CachesAndReturns() {
        Url url = Url.builder().id(1L).shortUrl("missHash").isActive(true).longUrl("https://destination.com").build();
        when(urlRepository.findByShortUrl("missHash")).thenReturn(url);
        when(valueOperations.get("urls::missHash")).thenReturn(null);

        String result = urlService.getLongUrlForRedirect("missHash");

        assertThat(result).isEqualTo("https://destination.com");
        verify(valueOperations).set("urls::missHash", "https://destination.com", Duration.ofHours(24));
    }

    @Test
    void getUrlForUnlock_Success() {
        Url url = Url.builder().id(1L).shortUrl("unlockHash").isActive(true).passwordHash("encodedPass").longUrl("https://secret.com").build();
        when(urlRepository.findByShortUrl("unlockHash")).thenReturn(url);
        when(passwordEncoder.matches("myPass", "encodedPass")).thenReturn(true);

        String result = urlService.getUrlForUnlock("unlockHash", "myPass");

        assertThat(result).isEqualTo("https://secret.com");
    }

    @Test
    void getUrlForUnlock_BadCredentials_ThrowsException() {
        Url url = Url.builder().id(1L).shortUrl("unlockHash").isActive(true).passwordHash("encodedPass").longUrl("https://secret.com").build();
        when(urlRepository.findByShortUrl("unlockHash")).thenReturn(url);
        when(passwordEncoder.matches("wrongPass", "encodedPass")).thenReturn(false);

        assertThatThrownBy(() -> urlService.getUrlForUnlock("unlockHash", "wrongPass"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getUrlForUnlock_NotPasswordProtected_ThrowsException() {
        Url url = Url.builder().id(1L).shortUrl("openHash").isActive(true).passwordHash(null).build();
        when(urlRepository.findByShortUrl("openHash")).thenReturn(url);

        assertThatThrownBy(() -> urlService.getUrlForUnlock("openHash", "any"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getUrl_Success() {
        Url url = Url.builder().id(1L).shortUrl("hash1").userId(1L).build();
        when(urlRepository.findByShortUrl("hash1")).thenReturn(url);
        UrlDto dto = new UrlDto(BigInteger.ONE, "https://long.com", "hash1", BigInteger.ZERO, null, null, null, true, false, null, null, null);
        when(urlMapper.toDto(url)).thenReturn(dto);
        when(analyticsServiceClient.getUrlClickCount(1L)).thenReturn(10L);

        UrlDto result = urlService.getUrl("hash1");

        assertThat(result).isNotNull();
        assertThat(result.getAccessed_times()).isEqualTo(BigInteger.valueOf(10L));
    }

    @Test
    void getAllUrls_SortByClickCount() {
        Url url1 = Url.builder().id(1L).shortUrl("h1").userId(1L).build();
        Url url2 = Url.builder().id(2L).shortUrl("h2").userId(1L).build();

        when(urlRepository.findByUserIdAndFolderIsNull(1L)).thenReturn(List.of());
        when(urlRepository.findAllByUserIdWithFilters(1L, null, null, null, null)).thenReturn(new ArrayList<>(List.of(url1, url2)));

        UrlDto dto1 = new UrlDto(BigInteger.ONE, "https://long1.com", "h1", BigInteger.valueOf(5L), null, null, null, true, false, null, null, null);
        UrlDto dto2 = new UrlDto(BigInteger.TWO, "https://long2.com", "h2", BigInteger.valueOf(20L), null, null, null, true, false, null, null, null);

        when(urlMapper.toDto(url1)).thenReturn(dto1);
        when(urlMapper.toDto(url2)).thenReturn(dto2);
        when(analyticsServiceClient.getUrlClickCount(1L)).thenReturn(5L);
        when(analyticsServiceClient.getUrlClickCount(2L)).thenReturn(20L);

        List<UrlDto> result = urlService.getAllUrls(1L, "accessed_times", null, null, null, null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(BigInteger.TWO);
        assertThat(result.get(1).getId()).isEqualTo(BigInteger.ONE);
    }

    @Test
    void getAllUrls_User_WithUnassignedUrlsAndFilters() {
        Folder linksFolder = Folder.builder().id(10L).name("Links").build();
        Url unassigned = Url.builder().id(100L).userId(1L).build();

        when(urlRepository.findByUserIdAndFolderIsNull(1L)).thenReturn(List.of(unassigned));
        when(folderRepository.findByNameIgnoreCaseAndUserId("Links", 1L)).thenReturn(Optional.of(linksFolder));

        Url url = Url.builder().id(1L).shortUrl("h1").userId(1L).folder(linksFolder).build();
        when(urlRepository.findAllByUserIdWithFilters(eq(1L), eq(null), eq(10L), eq(null), eq("search"))).thenReturn(new ArrayList<>(List.of(url)));

        UrlDto dto = new UrlDto(BigInteger.ONE, "https://long.com", "h1", BigInteger.ZERO, null, null, null, true, false, null, 10L, "Links");
        when(urlMapper.toDto(url)).thenReturn(dto);
        when(analyticsServiceClient.getUrlClickCount(1L)).thenReturn(3L);

        List<UrlDto> result = urlService.getAllUrls(1L, "id", null, 10L, null, "search");

        assertThat(result).hasSize(1);
        assertThat(unassigned.getFolder()).isEqualTo(linksFolder);
        verify(urlRepository).saveAll(List.of(unassigned));
    }

    @Test
    void updateUrl_ByUpdateRequestDto_Success() {
        Url url = Url.builder().id(1L).shortUrl("hash123").userId(1L).isActive(true).build();

        when(urlRepository.findByShortUrl("hash123")).thenReturn(url);
        when(urlRepository.save(any(Url.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cacheManager.getCache("urls")).thenReturn(cache);
        when(passwordEncoder.encode("newSecret")).thenReturn("newHashedSecret");

        Tag tag = Tag.builder().id(5L).userId(1L).build();
        when(tagRepository.findAllById(List.of(5L))).thenReturn(List.of(tag));

        UrlUpdateRequestDto req = new UrlUpdateRequestDto();
        req.setLongUrl("https://updated.com");
        req.setPassword("newSecret");
        req.setTagIds(List.of(5L));
        req.setExpiresAt(LocalDateTime.now().plusDays(5));

        UrlDto mockDto = new UrlDto(BigInteger.ONE, "https://updated.com", "hash123", BigInteger.ZERO, null, null, null, true, true, null, null, null);
        when(urlMapper.toDto(url)).thenReturn(mockDto);
        when(analyticsServiceClient.getUrlClickCount(1L)).thenReturn(0L);

        UrlDto result = urlService.updateUrl("hash123", req, 1L);

        assertThat(result).isNotNull();
        assertThat(url.getLongUrl()).isEqualTo("https://updated.com");
        assertThat(url.getPasswordHash()).isEqualTo("newHashedSecret");
        verify(redisTemplate).delete("urls::hash123");
        verify(cache).evict("hash123");
    }

    @Test
    void updateUrl_ByUpdateRequestDto_Unauthorized_ThrowsIllegalArgumentException() {
        Url url = Url.builder().id(1L).shortUrl("hash123").userId(2L).build();

        when(urlRepository.findByShortUrl("hash123")).thenReturn(url);

        UrlUpdateRequestDto req = new UrlUpdateRequestDto();

        assertThatThrownBy(() -> urlService.updateUrl("hash123", req, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteUrl_Success() {
        Url url = Url.builder().id(1L).shortUrl("delHash").userId(1L).build();
        when(urlRepository.findByShortUrl("delHash")).thenReturn(url);

        urlService.deleteUrl("delHash", 1L);

        verify(urlRepository).delete(url);
    }

    @Test
    void isExistsShortUrl_ActiveAndExpired_Deactivates() {
        Url url = Url.builder()
                .id(10L)
                .shortUrl("expiredHash")
                .isActive(true)
                .expiresAt(LocalDateTime.now().minusHours(2))
                .build();
        when(urlRepository.findByShortUrl("expiredHash")).thenReturn(url);

        Url result = urlService.isExistsShortUrl("expiredHash");

        assertThat(result).isNotNull();
        assertThat(result.isActive()).isFalse();
        verify(urlRepository).save(url);
    }

    @Test
    void createBatchCampaignUrls_Success() {
        Folder folder = Folder.builder().id(10L).userId(1L).name("Campaigns").build();
        when(folderRepository.findById(10L)).thenReturn(Optional.of(folder));

        Tag tag = Tag.builder().id(5L).userId(1L).name("Promo").build();
        when(tagRepository.findAllById(List.of(5L))).thenReturn(List.of(tag));

        when(urlRepository.existsUrlByShortUrl(any())).thenReturn(false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url u = invocation.getArgument(0);
            u.setId(100L);
            return u;
        });

        BatchChannelItemDto ch1 = BatchChannelItemDto.builder()
                .name("Facebook")
                .utmSource("facebook")
                .utmMedium("social")
                .build();
        BatchChannelItemDto ch2 = BatchChannelItemDto.builder()
                .name("Twitter")
                .utmSource("twitter")
                .utmMedium("social")
                .build();

        BatchCampaignRequestDto request = BatchCampaignRequestDto.builder()
                .longUrl("https://example.com/product")
                .campaignName("summer_sale")
                .folderId(10L)
                .tagIds(List.of(5L))
                .channels(List.of(ch1, ch2))
                .build();

        BatchCampaignResponseDto response = urlService.createBatchCampaignUrls(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getCampaignName()).isEqualTo("summer_sale");
        assertThat(response.getTotalCreated()).isEqualTo(2);
        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getItems().get(0).getChannelName()).isEqualTo("Facebook");
        assertThat(response.getItems().get(0).getLongUrlWithUtm()).contains("utm_source=facebook");
        assertThat(response.getItems().get(0).getLongUrlWithUtm()).contains("utm_campaign=summer_sale");
        assertThat(response.getItems().get(1).getChannelName()).isEqualTo("Twitter");
        assertThat(response.getItems().get(1).getLongUrlWithUtm()).contains("utm_source=twitter");
    }
}
