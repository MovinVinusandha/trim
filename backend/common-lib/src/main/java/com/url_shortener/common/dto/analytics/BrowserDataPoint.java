package com.url_shortener.common.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrowserDataPoint implements Serializable {
    private String browser;
    private Long count;
}
