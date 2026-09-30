package com.url_shortener.analytics_service.service;

import lombok.extern.slf4j.Slf4j;
import nl.basjes.parse.useragent.UserAgent;
import nl.basjes.parse.useragent.UserAgentAnalyzer;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserAgentParserService {

    public record DeviceInfo(String device, String browser, String os) {
        public static DeviceInfo unknown() {
            return new DeviceInfo("Unknown", "Unknown", "Unknown");
        }
    }

    private final UserAgentAnalyzer analyzer;

    public UserAgentParserService(UserAgentAnalyzer analyzer) {
        this.analyzer = analyzer;
    }

    public DeviceInfo parse(String userAgentString) {
        if (userAgentString == null || userAgentString.isBlank()) {
            return DeviceInfo.unknown();
        }

        try {
            UserAgent agent = analyzer.parse(userAgentString);
            String rawDevice = agent.getValue("DeviceClass");
            String browser   = agent.getValue("AgentName");
            String os        = agent.getValue("OperatingSystemName");

            return new DeviceInfo(
                    normalizeDevice(rawDevice),
                    normalizeField(browser),
                    normalizeField(os)
            );
        } catch (Exception e) {
            log.warn("UA parsing failed for string [{}]: {}", abbreviate(userAgentString), e.getMessage());
            return DeviceInfo.unknown();
        }
    }

    private String normalizeDevice(String rawDevice) {
        if (rawDevice == null) return "Unknown";
        return switch (rawDevice) {
            case "Desktop", "Laptop"           -> "Desktop";
            case "Phone", "Mobile"             -> "Mobile";
            case "Tablet"                      -> "Tablet";
            case "Robot", "Robot Mobile", "Robot Tablet",
                 "Spy", "Hacker", "Anonymized" -> "Bot";
            case "Unknown", "???"              -> "Unknown";
            default                            -> rawDevice;
        };
    }

    private String normalizeField(String value) {
        if (value == null || value.equals("???")) return "Unknown";
        return value;
    }

    private String abbreviate(String s) {
        if (s == null) return "null";
        return s.length() > 80 ? s.substring(0, 80) + "..." : s;
    }
}
