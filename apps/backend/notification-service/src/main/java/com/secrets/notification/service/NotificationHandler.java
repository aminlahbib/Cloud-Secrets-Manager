package com.secrets.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.dto.notification.NotificationType;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.entity.User;
import com.secrets.notification.repository.NotificationRepository;
import com.secrets.notification.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class NotificationHandler {

    private static final Logger log = LoggerFactory.getLogger(NotificationHandler.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public NotificationHandler(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EmailService emailService,
                               ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    public void handle(NotificationEvent event) {
        if (event.getRecipientUserIds() == null || event.getRecipientUserIds().isEmpty()) {
            log.debug("Notification event {} has no recipients, skipping", event.getType());
            return;
        }

        // Invitations are handled specially by email only (recipient ids are emails, not UUIDs)
        if (event.getType() == NotificationType.PROJECT_INVITATION ||
                event.getType() == NotificationType.TEAM_INVITATION) {
            handleInvitationEmail(event);
            return;
        }

        for (String userIdStr : event.getRecipientUserIds()) {
            try {
                UUID userId = UUID.fromString(userIdStr);

                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    log.debug("User {} not found when handling notification {}, skipping", userId, event.getType());
                    continue;
                }

                if (!isEnabledForEvent(user, event)) {
                    log.debug("Notification {} disabled by preferences for user {}, skipping",
                            event.getType(), userId);
                    continue;
                }

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

                // Send email where appropriate
                sendEmailForEvent(user, event);
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid recipient user id '{}' in notification event {}, skipping recipient",
                        userIdStr, event.getType());
            } catch (Exception ex) {
                log.error("Failed to persist notification for user {}: {}", userIdStr, ex.getMessage(), ex);
            }
        }
    }

    private void handleInvitationEmail(NotificationEvent event) {
        var metadata = event.getMetadata();
        if (metadata == null) {
            return;
        }

        String email = metadata.getOrDefault("email", null);
        String projectName = metadata.getOrDefault("projectName", "");
        String token = metadata.getOrDefault("token", "");
        String inviterName = metadata.getOrDefault("inviterName", "A teammate");

        if (email != null) {
            emailService.sendInvitationEmail(email, token, projectName, inviterName);
        }
    }

    private void sendEmailForEvent(User user, NotificationEvent event) {
        var metadata = event.getMetadata();
        if (metadata == null) {
            return;
        }

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            return;
        }

        try {
            if (event.getType() == NotificationType.SECRET_EXPIRING_SOON) {
                String secretKey = metadata.getOrDefault("secretKey", "");
                String projectName = metadata.getOrDefault("projectName", "");
                String expiresAtStr = metadata.getOrDefault("expiresAt", "");

                if (!secretKey.isEmpty() && !projectName.isEmpty() && !expiresAtStr.isEmpty()) {
                    LocalDateTime expiresAt = LocalDateTime.parse(expiresAtStr);
                    emailService.sendExpirationWarning(email, secretKey, projectName, expiresAt);
                }
            } else if (event.getType() == NotificationType.ROLE_CHANGED) {
                String projectName = metadata.getOrDefault("projectName", "");
                String oldRole = metadata.getOrDefault("oldRole", "");
                String newRole = metadata.getOrDefault("newRole", "");

                if (!projectName.isEmpty() && !newRole.isEmpty()) {
                    emailService.sendMembershipChangeEmail(email, projectName, oldRole, newRole);
                }
            }
        } catch (Exception ex) {
            log.error("Failed to send email for event {} to {}: {}", event.getType(), email, ex.getMessage(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private boolean isEnabledForEvent(User user, NotificationEvent event) {
        var prefs = user.getNotificationPreferences();
        if (prefs == null || prefs.isEmpty()) {
            return true;
        }

        String key;
        switch (event.getType()) {
            case SECRET_EXPIRING_SOON -> key = "secretExpiration";
            case PROJECT_INVITATION, TEAM_INVITATION -> key = "projectInvitations";
            case SECURITY_ALERT -> key = "securityAlerts";
            case ROLE_CHANGED -> key = "email"; // treat as general email/notification toggle
            default -> key = "email";
        }

        Object value = prefs.get(key);
        if (value instanceof Boolean b) {
            return b;
        }

        // default to enabled when preference missing or not boolean
        return true;
    }
}

