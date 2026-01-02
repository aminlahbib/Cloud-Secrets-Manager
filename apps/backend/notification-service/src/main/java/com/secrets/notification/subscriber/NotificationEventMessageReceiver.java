package com.secrets.notification.subscriber;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.pubsub.v1.AckReplyConsumer;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.pubsub.v1.PubsubMessage;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.notification.service.NotificationHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

/**
 * Low-level Pub/Sub message receiver that deserializes
 * NotificationEvent payloads and forwards them for handling.
 * 
 * Improved error handling:
 * - Distinguishes between transient and permanent failures
 * - Permanent failures (invalid JSON, malformed data) are ACKed to prevent infinite retries
 * - Transient failures (DB errors, network issues) are NACKed for retry
 */
@Component
public class NotificationEventMessageReceiver implements MessageReceiver {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventMessageReceiver.class);

    private final ObjectMapper objectMapper;
    private final NotificationHandler notificationHandler;

    public NotificationEventMessageReceiver(ObjectMapper objectMapper,
                                            NotificationHandler notificationHandler) {
        this.objectMapper = objectMapper;
        this.notificationHandler = notificationHandler;
    }

    @Override
    public void receiveMessage(PubsubMessage message, AckReplyConsumer consumer) {
        String messageId = message.getMessageId();
        String eventId = message.getAttributesMap().getOrDefault("eventId", "unknown");
        
        try {
            String payload = message.getData().toStringUtf8();
            
            if (payload == null || payload.isBlank()) {
                log.error("Received empty message payload. MessageId: {}, EventId: {}", messageId, eventId);
                consumer.ack(); // ACK empty messages to prevent infinite retries
                return;
            }

            NotificationEvent event;
            try {
                event = objectMapper.readValue(payload, NotificationEvent.class);
            } catch (JsonParseException | JsonMappingException e) {
                log.error("Failed to deserialize notification event. MessageId: {}, EventId: {}, Error: {}", 
                        messageId, eventId, e.getMessage());
                consumer.ack(); // ACK malformed messages - they won't succeed on retry
                return;
            }

            // Validate event structure
            if (event.getType() == null) {
                log.error("Notification event missing type. MessageId: {}, EventId: {}", messageId, eventId);
                consumer.ack(); // ACK invalid events
                return;
            }

            log.info("Received notification event: type={}, recipients={}, projectId={}, secretId={}, eventId={}",
                    event.getType(),
                    event.getRecipientUserIds() != null ? event.getRecipientUserIds().size() : 0,
                    event.getProjectId(),
                    event.getSecretId(),
                    eventId);

            // Process notification - handler now handles individual failures gracefully
            notificationHandler.handle(event);

            consumer.ack();
            log.debug("Successfully processed notification event. MessageId: {}, EventId: {}", messageId, eventId);
            
        } catch (DataAccessException e) {
            // Database errors are likely transient - NACK for retry
            log.error("Database error processing notification event. MessageId: {}, EventId: {}, Error: {}", 
                    messageId, eventId, e.getMessage(), e);
            consumer.nack();
        } catch (IllegalArgumentException e) {
            // Invalid data that won't succeed on retry - ACK to prevent infinite retries
            log.error("Invalid data in notification event. MessageId: {}, EventId: {}, Error: {}", 
                    messageId, eventId, e.getMessage());
            consumer.ack();
        } catch (Exception ex) {
            // Other exceptions - log and NACK for retry (could be transient)
            log.error("Unexpected error processing notification event. MessageId: {}, EventId: {}, Error: {}", 
                    messageId, eventId, ex.getMessage(), ex);
            consumer.nack();
        }
    }
}


