package com.secrets.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.secrets.dto.notification.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Helper service for publishing NotificationEvent messages.
 * Uses Google Cloud Pub/Sub when available, falls back to direct HTTP calls for local development.
 */
@Service
public class NotificationEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventPublisher.class);

    private final Optional<Publisher> publisher;
    private final ObjectMapper objectMapper;
    private final Optional<NotificationEventHttpFallback> httpFallback;

    public NotificationEventPublisher(
            Optional<Publisher> publisher, 
            ObjectMapper objectMapper,
            Optional<NotificationEventHttpFallback> httpFallback) {
        this.publisher = publisher;
        this.objectMapper = objectMapper;
        this.httpFallback = httpFallback;
    }

    /**
     * Publish a notification event. Failures are logged but do not
     * interrupt the main application flow.
     * 
     * Uses Pub/Sub when available, falls back to direct HTTP call when GCP_PROJECT_ID is not set.
     */
    public void publish(NotificationEvent event) {
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(Instant.now());
        }

        // Try Pub/Sub first if available
        if (publisher.isPresent()) {
            Publisher pub = publisher.get();
            try {
                String json = objectMapper.writeValueAsString(event);
                PubsubMessage message = PubsubMessage.newBuilder()
                        .setData(ByteString.copyFromUtf8(json))
                        .putAttributes("eventId", UUID.randomUUID().toString())
                        .putAttributes("type", event.getType().name())
                        .build();

                pub.publish(message);
                log.debug("Published notification event via Pub/Sub: type={}", event.getType());
                return;
            } catch (JsonProcessingException ex) {
                log.error("Failed to serialize notification event {}: {}", event.getType(), ex.getMessage(), ex);
                return;
            } catch (Exception ex) {
                log.error("Failed to publish notification event {} via Pub/Sub: {}", event.getType(), ex.getMessage(), ex);
                // Fall through to HTTP fallback
            }
        }

        // Fallback to HTTP when Pub/Sub is not available
        if (httpFallback.isPresent()) {
            boolean sent = httpFallback.get().sendEvent(event);
            if (sent) {
                log.debug("Published notification event via HTTP fallback: type={}", event.getType());
                return;
            }
        }

        // If both methods failed or are unavailable
        log.warn("Notification event could not be published: type={}, recipients={}, projectId={}. " +
                "Pub/Sub is not configured and HTTP fallback is unavailable. " +
                "Set GCP_PROJECT_ID for Pub/Sub or ensure notification-service is running for HTTP fallback. " +
                "Check /actuator/health/notifications for configuration status.",
                event.getType(),
                event.getRecipientUserIds() != null ? event.getRecipientUserIds().size() : 0,
                event.getProjectId());
    }
}


