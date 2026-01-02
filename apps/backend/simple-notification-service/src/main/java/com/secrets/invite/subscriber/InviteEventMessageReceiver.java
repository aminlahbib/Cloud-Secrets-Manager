package com.secrets.invite.subscriber;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.pubsub.v1.AckReplyConsumer;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.pubsub.v1.PubsubMessage;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.invite.service.InviteHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Receives Pub/Sub messages and forwards invitation events to InviteHandler.
 */
@Component
public class InviteEventMessageReceiver implements MessageReceiver {

    private static final Logger log = LoggerFactory.getLogger(InviteEventMessageReceiver.class);

    private final InviteHandler inviteHandler;
    private final ObjectMapper objectMapper;

    public InviteEventMessageReceiver(InviteHandler inviteHandler, ObjectMapper objectMapper) {
        this.inviteHandler = inviteHandler;
        this.objectMapper = objectMapper;
    }

    @Override
    public void receiveMessage(PubsubMessage message, AckReplyConsumer consumer) {
        String messageId = message.getMessageId();
        String eventId = message.getAttributesOrDefault("eventId", "N/A");
        
        try {
            String payload = message.getData().toStringUtf8();
            NotificationEvent event = objectMapper.readValue(payload, NotificationEvent.class);

            log.info("Received notification event. MessageId: {}, EventId: {}, Type: {}", 
                    messageId, eventId, event.getType());

            inviteHandler.handle(event);

            consumer.ack();
            log.debug("Successfully processed notification event. MessageId: {}, EventId: {}", 
                    messageId, eventId);
        } catch (Exception ex) {
            log.error("Failed to process notification event message {}. Error: {}", 
                    messageId, ex.getMessage(), ex);
            // Acknowledge to prevent infinite retries on permanent errors
            consumer.ack();
        }
    }
}

