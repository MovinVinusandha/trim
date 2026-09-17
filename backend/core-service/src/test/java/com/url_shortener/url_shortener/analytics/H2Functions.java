package com.url_shortener.url_shortener.analytics;

import java.time.LocalDateTime;

public class H2Functions {
    public static String dateFormat(LocalDateTime date, String pattern) {
        if (date == null) return null;
        return String.format("%04d-%02d-%02d %02d:00:00",
                date.getYear(), date.getMonthValue(), date.getDayOfMonth(), date.getHour());
    }
}

