package com.url_shortener.url_shortener.analytics;

import nl.basjes.parse.useragent.UserAgentAnalyzer;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class UserAgentParserServiceTest {

    private static UserAgentParserService parserService;

    @BeforeAll
    static void setUpAll() {
        UserAgentAnalyzer analyzer = UserAgentAnalyzer.newBuilder()
                .withField("DeviceClass")
                .withField("AgentName")
                .withField("OperatingSystemName")
                .withCache(100)
                .hideMatcherLoadStats()
                .build();
        parserService = new UserAgentParserService(analyzer);
    }

    @Test
    void parse_NullOrBlank_ReturnsUnknown() {
        var result1 = parserService.parse(null);
        assertThat(result1.device()).isEqualTo("Unknown");
        assertThat(result1.browser()).isEqualTo("Unknown");
        assertThat(result1.os()).isEqualTo("Unknown");

        var result2 = parserService.parse("   ");
        assertThat(result2.device()).isEqualTo("Unknown");
    }

    @Test
    void parse_DesktopDeviceClass() {
        var result = parserService.parse("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
        assertThat(result.device()).isEqualTo("Desktop");
        assertThat(result.browser()).isEqualTo("Chrome");
        assertThat(result.os()).isEqualTo("Windows NT");
    }

    @Test
    void parse_MobileDeviceClass() {
        var result = parserService.parse("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1");
        assertThat(result.device()).isEqualTo("Mobile");
        assertThat(result.browser()).isEqualTo("Safari");
        assertThat(result.os()).isEqualTo("iOS");
    }

    @Test
    void parse_TabletAndBot() {
        var tabletResult = parserService.parse("Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/86.0.4240.93 Mobile/15E148 Safari/604.1");
        assertThat(tabletResult.device()).isEqualTo("Tablet");

        var botResult = parserService.parse("Googlebot/2.1 (+http://www.google.com/bot.html)");
        assertThat(botResult.device()).isEqualTo("Bot");
    }

    @Test
    void normalizeDevice_AllBranches() {
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", (Object) null)).isEqualTo("Unknown");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Laptop")).isEqualTo("Desktop");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Desktop")).isEqualTo("Desktop");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Phone")).isEqualTo("Mobile");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Mobile")).isEqualTo("Mobile");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Tablet")).isEqualTo("Tablet");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Robot")).isEqualTo("Bot");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Robot Mobile")).isEqualTo("Bot");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Robot Tablet")).isEqualTo("Bot");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Spy")).isEqualTo("Bot");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Hacker")).isEqualTo("Bot");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Anonymized")).isEqualTo("Bot");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Unknown")).isEqualTo("Unknown");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "???")).isEqualTo("Unknown");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeDevice", "Watch")).isEqualTo("Watch");
    }

    @Test
    void normalizeField_AllBranches() {
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeField", (Object) null)).isEqualTo("Unknown");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeField", "???")).isEqualTo("Unknown");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "normalizeField", "Chrome")).isEqualTo("Chrome");
    }

    @Test
    void abbreviate_AllBranches() {
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "abbreviate", (Object) null)).isEqualTo("null");
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "abbreviate", "short")).isEqualTo("short");
        String longStr = "a".repeat(100);
        assertThat((String) ReflectionTestUtils.invokeMethod(parserService, "abbreviate", longStr)).isEqualTo("a".repeat(80) + "...");
    }
}
