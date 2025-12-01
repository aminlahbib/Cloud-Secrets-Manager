package com.secrets.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class NotificationHandler {

    private static final Logger log = LoggerFactory.getLogger(NotificationHandler.class);

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    public NotificationHandler(NotificationRepository notificationRepository,
                               ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    public void handle(NotificationEvent event) {
        if (event.getRecipientUserIds() == null || event.getRecipientUserIds().isEmpty()) {
            log.debug("Notification event {} has no recipients, skipping", event.getType());
            return;
        }

        for (String userIdStr : event.getRecipientUserIds()) {
            try {
                UUID userId = UUID.fromString(userIdStr);

                Notification notification = new Notification();
                notification.setId(UUID.randomUUID());
                notification.setUserId(userId);
                notification.setType(event.getType().name());
                notification.setTitle(event.getTitle() != null ? event.getTitle() : "Notification");
                notification.setBody(event.getMessage());
                notification.setCreatedAt(event.getCreatedAt() != null ? event.getCreatedAt() : Instant.now());

                if (event.getMetadata() != null && !event.getMetadata().isEmpty()) {
                    try {
                        notification.setMetadata(objectMapper.writeValueAsString(event.getMetadata()));
                    } catch (JsonProcessingException e) {
                        log.warn("Failed to serialize notification metadata for user {}: {}", userId, e.getMessage());
                    }
                }

                notificationRepository.save(notification);
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid recipient user id '{}' in notification event {}, skipping recipient",
                        userIdStr, event.getType());
            } catch (Exception ex) {
                log.error("Failed to persist notification for user {}: {}", userIdStr, ex.getMessage(), ex);
            }
        }
    }
}


