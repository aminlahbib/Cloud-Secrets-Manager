package com.secrets.service;

import com.secrets.dto.notification.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * HTTP fallback mechanism for sending notification events directly to notification-service
 * when Pub/Sub is not available (e.g., local development without GCP_PROJECT_ID).
 */
@Component
public class NotificationEventHttpFallback {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventHttpFallback.class);

    private final String notificationServiceUrl;
    private final RestTemplate restTemplate;

    public NotificationEventHttpFallback(
            @Value("${notifications.service.url:http://localhost:8082}") String notificationServiceUrl,
            RestTemplate restTemplate) {
        this.notificationServiceUrl = notificationServiceUrl;
        this.restTemplate = restTemplate;
    }

    /**
     * Send notification event directly to notification-service via HTTP.
     * This is used as a fallback when Pub/Sub is not configured.
     */
    public boolean sendEvent(NotificationEvent event) {
        try {
            String url = notificationServiceUrl + "/api/internal/notifications/events";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<NotificationEvent> request = new HttpEntity<>(event, headers);
            
            ResponseEntity<Void> response = restTemplate.postForEntity(url, request, Void.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("Successfully sent notification event via HTTP fallback: type={}", event.getType());
                return true;
            } else {
                log.warn("Failed to send notification event via HTTP fallback: status={}, type={}", 
                        response.getStatusCode(), event.getType());
                return false;
            }
        } catch (Exception ex) {
            log.error("Error sending notification event via HTTP fallback: type={}, error={}", 
                    event.getType(), ex.getMessage(), ex);
            return false;
        }
    }
}

