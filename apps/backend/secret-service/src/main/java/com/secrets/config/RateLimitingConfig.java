package com.secrets.config;

import com.secrets.security.RateLimitingFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Configuration
public class RateLimitingConfig {

    /**
     * Rate limiting configuration
     * Default: 100 requests per minute per IP address
     */
    private static final int DEFAULT_RATE_LIMIT = 100;
    private static final long RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

    @Bean
    public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilter() {
        FilterRegistrationBean<RateLimitingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new RateLimitingFilter(DEFAULT_RATE_LIMIT, RATE_LIMIT_WINDOW_MS));
        registrationBean.addUrlPatterns("/api/*");
        // Don't apply rate limiting to health checks
        registrationBean.setOrder(1);
        return registrationBean;
    }

    @Bean
    public ConcurrentHashMap<String, RateLimitInfo> rateLimitCache() {
        return new ConcurrentHashMap<>();
    }

    /**
     * Rate limit information holder
     */
    public static class RateLimitInfo {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private volatile long windowStartTime = System.currentTimeMillis();
        private final long windowMs;

        public RateLimitInfo(long windowMs) {
            this.windowMs = windowMs;
        }

        public int incrementAndGet() {
            long now = System.currentTimeMillis();
            synchronized (this) {
                // Reset window if expired
                if (now - windowStartTime > windowMs) {
                    requestCount.set(0);
                    windowStartTime = now;
                }
                return requestCount.incrementAndGet();
            }
        }

        public long getWindowStartTime() {
            return windowStartTime;
        }

        public long getWindowMs() {
            return windowMs;
        }
    }
}

