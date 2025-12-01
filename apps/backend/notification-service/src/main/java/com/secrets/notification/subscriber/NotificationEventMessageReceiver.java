package com.secrets.notification.subscriber;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.pubsub.v1.AckReplyConsumer;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.pubsub.v1.PubsubMessage;
import com.secrets.dto.notification.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Low-level Pub/Sub message receiver that deserializes
 * NotificationEvent payloads and forwards them for handling.
 */
@Component
public class NotificationEventMessageReceiver implements MessageReceiver {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventMessageReceiver.class);

    private final ObjectMapper objectMapper;

    public NotificationEventMessageReceiver(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void receiveMessage(PubsubMessage message, AckReplyConsumer consumer) {
        try {
            String payload = message.getData().toStringUtf8();
            NotificationEvent event = objectMapper.readValue(payload, NotificationEvent.class);

            log.info("Received notification event: type={}, recipients={}, projectId={}, secretId={}",
                    event.getType(),
                    event.getRecipientUserIds(),
                    event.getProjectId(),
                    event.getSecretId());

            // TODO: Forward to NotificationHandler for persistence / email dispatch

            consumer.ack();
        } catch (Exception ex) {
            log.error("Failed to process notification event message: {}", ex.getMessage(), ex);
            consumer.nack();
        }
    }
}


