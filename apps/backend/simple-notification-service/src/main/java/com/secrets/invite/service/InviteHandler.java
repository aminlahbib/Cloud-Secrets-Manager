package com.secrets.invite.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.dto.notification.NotificationType;
import com.secrets.invite.entity.InviteNotification;
import com.secrets.invite.repository.InviteNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Handles invitation notification events from Pub/Sub.
 * Only processes PROJECT_INVITATION and TEAM_INVITATION events.
 */
@Service
public class InviteHandler {

    private static final Logger log = LoggerFactory.getLogger(InviteHandler.class);

    private final InviteNotificationRepository repository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public InviteHandler(InviteNotificationRepository repository, 
                        EmailService emailService,
                        ObjectMapper objectMapper) {
        this.repository = repository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    /**
     * Handle a notification event. Only processes invitation events.
     */
    public void handle(NotificationEvent event) {
        if (event == null) {
            log.warn("Received null notification event, skipping");
            return;
        }

        // Only handle invitation events
        if (event.getType() != NotificationType.PROJECT_INVITATION && 
            event.getType() != NotificationType.TEAM_INVITATION) {
            log.debug("Skipping non-invitation event: {}", event.getType());
            return;
        }

        try {
            // Extract metadata
            Map<String, Object> metadata = event.getMetadata();
            if (metadata == null) {
                log.warn("Event {} has no metadata, skipping", event.getType());
                return;
            }

            String email = (String) metadata.get("email");
            String token = (String) metadata.get("token");
            String projectName = (String) metadata.get("projectName");
            String inviterName = (String) metadata.get("inviterName");
            String role = event.getType() == NotificationType.PROJECT_INVITATION 
                    ? (String) metadata.get("role") 
                    : "MEMBER"; // Default for team invitations

            if (email == null || token == null) {
                log.warn("Event {} missing required fields (email or token), skipping", event.getType());
                return;
            }

            // For invitations, recipientUserIds contains the email address
            String recipientEmail = event.getRecipientUserIds() != null && !event.getRecipientUserIds().isEmpty()
                    ? event.getRecipientUserIds().get(0)
                    : email;

            // Create notification record
            InviteNotification notification = new InviteNotification();
            notification.setType(event.getType().name());
            notification.setMessage(event.getMessage());
            notification.setInviterEmail(inviterName != null ? inviterName : "Unknown");
            notification.setInviterName(inviterName != null ? inviterName : "Unknown");
            
            if (event.getProjectId() != null) {
                try {
                    notification.setProjectId(UUID.fromString(event.getProjectId()));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid project ID in event: {}", event.getProjectId());
                }
            }

            // For invitations to non-existing users, user_id will be null
            // The notification can be linked to the user when they sign up and accept the invitation
            // For now, we store the invitation notification with null user_id

            // Send email
            if (projectName != null && inviterName != null) {
                boolean emailSent = emailService.sendInvitationEmail(
                        recipientEmail, inviterName, projectName, token, role);
                
                notification.setEmailSent(emailSent);
                if (emailSent) {
                    notification.setEmailSentAt(Instant.now());
                }
            }

            notification.setCreatedAt(Instant.now());
            repository.save(notification);

            log.info("Processed {} event for {}", event.getType(), recipientEmail);
        } catch (Exception e) {
            log.error("Failed to process invitation event {}: {}", event.getType(), e.getMessage(), e);
            throw new RuntimeException("Failed to process invitation event", e);
        }
    }
}

