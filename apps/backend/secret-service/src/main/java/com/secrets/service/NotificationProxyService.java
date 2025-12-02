package com.secrets.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Service
public class NotificationProxyService {

    private static final Logger log = LoggerFactory.getLogger(NotificationProxyService.class);

    private final WebClient.Builder webClientBuilder;

    @Value("${notifications.service.url}")
    private String notificationServiceUrl;

    public NotificationProxyService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    /**
     * Fetch notifications for the current user by proxying to notification-service.
     */
    public String fetchNotifications(boolean unreadOnly, String authHeader) {
        WebClient client = webClientBuilder
                .baseUrl(notificationServiceUrl)
                .build();

        try {
            return client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/notifications")
                            .queryParam("unreadOnly", unreadOnly)
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (WebClientResponseException ex) {
            log.error("Notification service responded with error: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch notifications: {}", ex.getMessage());
            throw ex;
        }
    }

    /**
     * Mark a single notification as read.
     */
    public void markAsRead(String notificationId, String authHeader) {
        WebClient client = webClientBuilder
                .baseUrl(notificationServiceUrl)
                .build();

        try {
            client.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/notifications/{id}/read")
                            .build(notificationId))
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (WebClientResponseException ex) {
            log.error("Notification service responded with error when marking as read: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to mark notification as read: {}", ex.getMessage());
            throw ex;
        }
    }

    /**
     * Mark all notifications as read.
     */
    public void markAllAsRead(String authHeader) {
        WebClient client = webClientBuilder
                .baseUrl(notificationServiceUrl)
                .build();

        try {
            client.post()
                    .uri("/api/notifications/read-all")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (WebClientResponseException ex) {
            log.error("Notification service responded with error when marking all as read: status={}, body={}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to mark all notifications as read: {}", ex.getMessage());
            throw ex;
        }
    }
}


