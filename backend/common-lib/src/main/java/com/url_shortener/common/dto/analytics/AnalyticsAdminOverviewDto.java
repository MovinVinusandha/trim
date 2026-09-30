package com.url_shortener.common.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsAdminOverviewDto implements Serializable {
    private long totalClicks;
    private long clicksLast24Hours;
    private Map<String, Long> clicksByDate;
    private List<DeviceDataPoint> deviceDistribution;
    private List<CountryDataPoint> countryDistribution;
}
