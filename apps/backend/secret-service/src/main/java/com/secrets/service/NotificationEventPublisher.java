package com.secrets.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.secrets.dto.notification.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Helper service for publishing NotificationEvent messages
 * to Google Cloud Pub/Sub.
 */
@Service
public class NotificationEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventPublisher.class);

    private final Optional<Publisher> publisher;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    public NotificationEventPublisher(Optional<Publisher> publisher, ObjectMapper objectMapper) {
        this.publisher = publisher;
        this.objectMapper = objectMapper;
    }

    /**
     * Publish a notification event. Only PROJECT_INVITATION and TEAM_INVITATION events are allowed.
     * Failures are logged but do not interrupt the main application flow.
     */
    public void publish(NotificationEvent event) {
        if (publisher.isEmpty()) {
            log.debug("Notification publisher is not configured. Skipping event: {}", event.getType());
            return;
        }

        // Only allow invitation events
        if (event.getType() != com.secrets.dto.notification.NotificationType.PROJECT_INVITATION &&
            event.getType() != com.secrets.dto.notification.NotificationType.TEAM_INVITATION) {
            log.warn("Skipping non-invitation notification event: {}. Only PROJECT_INVITATION and TEAM_INVITATION are supported.", 
                    event.getType());
            return;
        }

        Publisher pub = publisher.get();

        if (event.getCreatedAt() == null) {
            event.setCreatedAt(Instant.now());
        }

        try {
            String json = objectMapper.writeValueAsString(event);
            PubsubMessage message = PubsubMessage.newBuilder()
                    .setData(ByteString.copyFromUtf8(json))
                    .putAttributes("eventId", UUID.randomUUID().toString())
                    .putAttributes("type", event.getType().name())
                    .build();

            pub.publish(message);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize notification event {}: {}", event.getType(), ex.getMessage(), ex);
        } catch (Exception ex) {
            log.error("Failed to publish notification event {}: {}", event.getType(), ex.getMessage(), ex);
        }
    }
}


