package com.secrets.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.dto.notification.NotificationType;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.entity.User;
import com.secrets.notification.dto.NotificationDto;
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
    private final NotificationSseService sseService;
    private final NotificationBatchingService batchingService;

    public NotificationHandler(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EmailService emailService,
                               ObjectMapper objectMapper,
                               NotificationSseService sseService,
                               NotificationBatchingService batchingService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
        this.sseService = sseService;
        this.batchingService = batchingService;
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

                // Check if notification type is enabled at all
                if (!isEnabledForEvent(user, event)) {
                    log.debug("Notification {} disabled by preferences for user {}, skipping",
                            event.getType(), userId);
                    continue;
                }

                // Check if in-app notifications are enabled
                boolean inAppEnabled = isInAppEnabledForEvent(user, event);
                // Check if email notifications are enabled
                boolean emailEnabled = isEmailEnabledForEvent(user, event);

                Notification notification = null;
                if (inAppEnabled) {
                    Instant createdAt = event.getCreatedAt() != null ? event.getCreatedAt() : Instant.now();
                    
                    // Check if we should batch this notification
                    Notification existingBatch = batchingService.findBatchableNotification(
                            userId, event.getType().name(), createdAt);
                    
                    if (existingBatch != null) {
                        // Update existing notification with batch info
                        String batchInfo = String.format("Additional: %s", event.getTitle() != null ? event.getTitle() : "Notification");
                        batchingService.updateNotificationBatch(existingBatch, batchInfo);
                        notification = existingBatch;
                        // Update the notification to reflect it's been updated
                        notificationRepository.save(notification);
                    } else {
                        // Create new notification
                        notification = new Notification();
                        notification.setId(UUID.randomUUID());
                        notification.setUserId(userId);
                        notification.setType(event.getType().name());
                        notification.setTitle(event.getTitle() != null ? event.getTitle() : "Notification");
                        notification.setBody(event.getMessage());
                        notification.setCreatedAt(createdAt);

                        if (event.getMetadata() != null && !event.getMetadata().isEmpty()) {
                            try {
                                notification.setMetadata(objectMapper.writeValueAsString(event.getMetadata()));
                            } catch (JsonProcessingException e) {
                                log.warn("Failed to serialize notification metadata for user {}: {}", userId, e.getMessage());
                            }
                        }

                        notificationRepository.save(notification);
                    }

                    // Send via SSE to connected clients (only if it's a new notification, not a batch update)
                    if (existingBatch == null) {
                        try {
                            NotificationDto dto = toDto(notification);
                            sseService.sendNotification(userId, dto);
                        } catch (Exception ex) {
                            log.warn("Failed to send notification via SSE to user {}: {}", userId, ex.getMessage());
                            // Don't fail the whole operation if SSE fails
                        }
                    } else {
                        // For batched notifications, send update via SSE
                        try {
                            NotificationDto dto = toDto(notification);
                            sseService.sendNotification(userId, dto);
                        } catch (Exception ex) {
                            log.warn("Failed to send batched notification update via SSE to user {}: {}", userId, ex.getMessage());
                        }
                    }
                }

                // Send email where appropriate
                if (emailEnabled) {
                    sendEmailForEvent(user, event);
                }
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

    @SuppressWarnings("unchecked")
    private boolean isInAppEnabledForEvent(User user, NotificationEvent event) {
        var prefs = user.getNotificationPreferences();
        if (prefs == null || prefs.isEmpty()) {
            return true;
        }

        String key;
        switch (event.getType()) {
            case SECRET_EXPIRING_SOON -> key = "secretExpirationInApp";
            case PROJECT_INVITATION, TEAM_INVITATION -> key = "projectInvitationsInApp";
            case SECURITY_ALERT -> key = "securityAlertsInApp";
            case ROLE_CHANGED -> key = "roleChangedInApp";
            default -> {
                // Check general preference first
                Object generalEnabled = prefs.get("secretExpiration");
                if (generalEnabled instanceof Boolean b && !b) {
                    return false;
                }
                return true;
            }
        }

        Object value = prefs.get(key);
        if (value instanceof Boolean b) {
            return b;
        }

        // Fallback to general preference
        return isEnabledForEvent(user, event);
    }

    @SuppressWarnings("unchecked")
    private boolean isEmailEnabledForEvent(User user, NotificationEvent event) {
        var prefs = user.getNotificationPreferences();
        if (prefs == null || prefs.isEmpty()) {
            return true;
        }

        // Check general email toggle first
        Object emailEnabled = prefs.get("email");
        if (emailEnabled instanceof Boolean b && !b) {
            return false;
        }

        String key;
        switch (event.getType()) {
            case SECRET_EXPIRING_SOON -> key = "secretExpirationEmail";
            case PROJECT_INVITATION, TEAM_INVITATION -> key = "projectInvitationsEmail";
            case SECURITY_ALERT -> key = "securityAlertsEmail";
            case ROLE_CHANGED -> key = "roleChangedEmail";
            default -> {
                return emailEnabled instanceof Boolean ? (Boolean) emailEnabled : true;
            }
        }

        Object value = prefs.get(key);
        if (value instanceof Boolean b) {
            return b;
        }

        // Fallback to general email preference
        return emailEnabled instanceof Boolean ? (Boolean) emailEnabled : true;
    }

    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setBody(notification.getBody());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());

        if (notification.getMetadata() != null) {
            try {
                dto.setMetadata(objectMapper.readValue(
                        notification.getMetadata(),
                        new com.fasterxml.jackson.core.type.TypeReference<>() {
                        }));
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse notification metadata for {}: {}", notification.getId(), e.getMessage());
                dto.setMetadata(java.util.Collections.emptyMap());
            }
        }

        return dto;
    }
}

