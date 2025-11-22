package com.secrets.security;

import com.secrets.config.RateLimitingConfig;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitingFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    private final int rateLimit;
    private final long windowMs;
    private final ConcurrentHashMap<String, RateLimitingConfig.RateLimitInfo> cache = new ConcurrentHashMap<>();

    public RateLimitingFilter(int rateLimit, long windowMs) {
        this.rateLimit = rateLimit;
        this.windowMs = windowMs;
    }

    @Override
    public void doFilter(jakarta.servlet.ServletRequest request, 
                        jakarta.servlet.ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Skip rate limiting for health checks and actuator endpoints
        String path = httpRequest.getRequestURI();
        if (path.startsWith("/actuator") || path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")) {
            chain.doFilter(request, response);
            return;
        }

        // Get client IP address
        String clientIp = getClientIpAddress(httpRequest);
        
        // Get or create rate limit info for this IP
        RateLimitingConfig.RateLimitInfo rateLimitInfo = cache.computeIfAbsent(
            clientIp, 
            k -> new RateLimitingConfig.RateLimitInfo(windowMs)
        );

        // Check rate limit
        int currentCount = rateLimitInfo.incrementAndGet();
        
        if (currentCount > rateLimit) {
            log.warn("Rate limit exceeded for IP: {} ({} requests in window)", clientIp, currentCount);
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.setContentType("application/json");
            long retryAfter = Math.max(0, (rateLimitInfo.getWindowMs() - (System.currentTimeMillis() - rateLimitInfo.getWindowStartTime())) / 1000);
            httpResponse.getWriter().write(
                String.format(
                    "{\"error\":\"Rate limit exceeded\",\"message\":\"Maximum %d requests per minute allowed\",\"retryAfter\":%d}",
                    rateLimit,
                    retryAfter
                )
            );
            return;
        }

        // Add rate limit headers
        httpResponse.setHeader("X-RateLimit-Limit", String.valueOf(rateLimit));
        httpResponse.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, rateLimit - currentCount)));
        
        chain.doFilter(request, response);
    }

    /**
     * Extract client IP address from request
     * Handles X-Forwarded-For header for proxied requests
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

