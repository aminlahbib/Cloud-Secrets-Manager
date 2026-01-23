package com.secrets.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow frontend origins - use setAllowedOriginPatterns for wildcard support
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:5173",  // Vite default port
            "http://localhost:5174",  // Alternative Vite port
            "http://localhost:3000",  // Common React port
            "http://localhost:5500",  // Live Server port
            "http://127.0.0.1:*",     // Any localhost port
            "http://secrets.local",   // GKE Ingress local
            "https://secrets.local",  // GKE Ingress local with TLS
            "https://*.run.app"       // Cloud Run domains
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type", 
            "Cache-Control", 
            "X-Requested-With",
            "Accept",
            "Origin"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
