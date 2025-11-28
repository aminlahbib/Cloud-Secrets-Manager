package com.audit.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to validate service-to-service API key for all GET endpoints.
 * POST /api/audit/log is excluded as it's called internally by secret-service.
 */
@Component
@Order(1)
public class ServiceApiKeyFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ServiceApiKeyFilter.class);
    
    private static final String API_KEY_HEADER = "X-Service-API-Key";
    private static final String LOG_ENDPOINT = "/api/audit/log";
    
    @Value("${audit.service.api-key:}")
    private String expectedApiKey;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Skip validation for POST /api/audit/log (internal logging endpoint)
        // and health check endpoints
        if (request.getMethod().equals("POST") && requestPath.equals(LOG_ENDPOINT)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        if (requestPath.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // For all GET endpoints, require API key
        if (request.getMethod().equals("GET") && requestPath.startsWith("/api/audit")) {
            String apiKey = request.getHeader(API_KEY_HEADER);
            
            if (apiKey == null || apiKey.isBlank()) {
                log.warn("Missing API key for request: {} {}", request.getMethod(), requestPath);
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Missing service API key\"}");
                return;
            }
            
            if (expectedApiKey.isBlank()) {
                log.error("Service API key not configured. Set audit.service.api-key property.");
                response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Service not properly configured\"}");
                return;
            }
            
            if (!apiKey.equals(expectedApiKey)) {
                log.warn("Invalid API key for request: {} {}", request.getMethod(), requestPath);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Invalid service API key\"}");
                return;
            }
            
            log.debug("Valid API key for request: {} {}", request.getMethod(), requestPath);
        }
        
        filterChain.doFilter(request, response);
    }
}

