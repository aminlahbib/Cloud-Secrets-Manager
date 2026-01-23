package com.secrets.notification.controller;

import com.secrets.dto.notification.NotificationEvent;
import com.secrets.notification.service.NotificationHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST endpoint for receiving notification events directly (fallback when Pub/Sub is not available).
 * Used for local development when GCP_PROJECT_ID is not configured.
 */
@RestController
@RequestMapping("/api/internal/notifications")
public class NotificationEventController {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventController.class);

    private final NotificationHandler notificationHandler;

    public NotificationEventController(NotificationHandler notificationHandler) {
        this.notificationHandler = notificationHandler;
    }

    @PostMapping("/events")
    public ResponseEntity<Void> receiveEvent(@RequestBody NotificationEvent event) {
        try {
            log.info("Received notification event via direct HTTP: type={}, recipients={}, projectId={}",
                    event.getType(),
                    event.getRecipientUserIds() != null ? event.getRecipientUserIds().size() : 0,
                    event.getProjectId());

            notificationHandler.handle(event);
            return ResponseEntity.accepted().build();
        } catch (Exception ex) {
            log.error("Failed to process notification event received via HTTP: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

