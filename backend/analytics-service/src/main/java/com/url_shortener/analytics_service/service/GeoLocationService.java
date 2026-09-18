package com.url_shortener.analytics_service.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Set;

@Service
@Slf4j
public class GeoLocationService {

    public record GeoInfo(String country, String city, String region, String continent, Double latitude, Double longitude) {
        public GeoInfo(String country, String city, String region, String continent) {
            this(country, city, region, continent, null, null);
        }
        public static GeoInfo local() {
            return new GeoInfo("Local", "Local", "Local", "Local", null, null);
        }
        public static GeoInfo unknown() {
            return new GeoInfo("Unknown", "Unknown", "Unknown", "Unknown", null, null);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeoLocationResponse(
            String status,
            String country,
            String city,
            @JsonProperty("regionName") String regionName,
            String continent,
            Double lat,
            Double lon
    ) {
        public boolean isSuccess() {
            return "success".equalsIgnoreCase(status);
        }
    }

    private static final String GEO_API_URL =
            "http://ip-api.com/json/{ip}?fields=status,country,city,regionName,continent,lat,lon";

    private static final Set<String> PRIVATE_PREFIXES =
            Set.of("127.", "192.168.", "10.", "172.16.", "172.17.", "172.18.",
                    "172.19.", "172.2", "0:0:0:0:0:0:0:1", "::1");

    private final RestTemplate restTemplate;

    public GeoLocationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public GeoInfo lookup(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return GeoInfo.unknown();
        }

        if (isPrivateIp(ipAddress)) {
            return GeoInfo.local();
        }

        try {
            GeoLocationResponse response = restTemplate.getForObject(
                    GEO_API_URL,
                    GeoLocationResponse.class,
                    ipAddress
            );

            if (response == null || !response.isSuccess()) {
                return GeoInfo.unknown();
            }

            return new GeoInfo(
                    valueOrUnknown(response.country()),
                    valueOrUnknown(response.city()),
                    valueOrUnknown(response.regionName()),
                    valueOrUnknown(response.continent()),
                    response.lat(),
                    response.lon()
            );
        } catch (Exception e) {
            log.warn("GeoIP lookup failed for IP [{}]: {}", ipAddress, e.getMessage());
            return GeoInfo.unknown();
        }
    }

    private String valueOrUnknown(String value) {
        return (value == null || value.isBlank()) ? "Unknown" : value;
    }

    private boolean isPrivateIp(String ip) {
        for (String prefix : PRIVATE_PREFIXES) {
            if (ip.startsWith(prefix)) return true;
        }
        return false;
    }
}
