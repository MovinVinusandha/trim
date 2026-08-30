package com.url_shortener.url_shortener.analytics;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeoLocationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private GeoLocationService geoLocationService;

    @BeforeEach
    void setUp() {
        geoLocationService = new GeoLocationService(restTemplate);
    }

    @Test
    void lookup_NullOrBlankIp_ReturnsUnknown() {
        var res1 = geoLocationService.lookup(null);
        assertThat(res1.country()).isEqualTo("Unknown");

        var res2 = geoLocationService.lookup("   ");
        assertThat(res2.country()).isEqualTo("Unknown");
    }

    @Test
    void lookup_PrivateOrLoopbackIp_ReturnsLocal() {
        var res1 = geoLocationService.lookup("127.0.0.1");
        assertThat(res1.country()).isEqualTo("Local");
        assertThat(res1.city()).isEqualTo("Local");

        var res2 = geoLocationService.lookup("192.168.1.50");
        assertThat(res2.country()).isEqualTo("Local");

        var res3 = geoLocationService.lookup("10.0.0.1");
        assertThat(res3.country()).isEqualTo("Local");

        var res4 = geoLocationService.lookup("::1");
        assertThat(res4.country()).isEqualTo("Local");
    }

    @Test
    void lookup_ValidPublicIp_Success() {
        GeoLocationResponse apiResponse = new GeoLocationResponse(
                "success",
                "United States",
                "Mountain View",
                "California",
                "North America"
        );
        when(restTemplate.getForObject(anyString(), eq(GeoLocationResponse.class), eq("8.8.8.8")))
                .thenReturn(apiResponse);

        var result = geoLocationService.lookup("8.8.8.8");
        assertThat(result.country()).isEqualTo("United States");
        assertThat(result.city()).isEqualTo("Mountain View");
        assertThat(result.region()).isEqualTo("California");
        assertThat(result.continent()).isEqualTo("North America");
    }

    @Test
    void lookup_ValidPublicIp_WithNullOrBlankFields() {
        GeoLocationResponse apiResponse = new GeoLocationResponse(
                "success",
                null,
                "",
                "California",
                null
        );
        when(restTemplate.getForObject(anyString(), eq(GeoLocationResponse.class), eq("8.8.8.8")))
                .thenReturn(apiResponse);

        var result = geoLocationService.lookup("8.8.8.8");
        assertThat(result.country()).isEqualTo("Unknown");
        assertThat(result.city()).isEqualTo("Unknown");
        assertThat(result.region()).isEqualTo("California");
        assertThat(result.continent()).isEqualTo("Unknown");
    }

    @Test
    void lookup_ApiStatusFail_ReturnsUnknown() {
        GeoLocationResponse failResponse = new GeoLocationResponse("fail", null, null, null, null);
        when(restTemplate.getForObject(anyString(), eq(GeoLocationResponse.class), eq("1.2.3.4")))
                .thenReturn(failResponse);

        var result = geoLocationService.lookup("1.2.3.4");
        assertThat(result.country()).isEqualTo("Unknown");
    }

    @Test
    void lookup_RestTemplateException_ReturnsUnknown() {
        when(restTemplate.getForObject(anyString(), eq(GeoLocationResponse.class), eq("1.2.3.4")))
                .thenThrow(new RestClientException("Connection timed out"));

        var result = geoLocationService.lookup("1.2.3.4");
        assertThat(result.country()).isEqualTo("Unknown");
        assertThat(result.city()).isEqualTo("Unknown");
    }
}
