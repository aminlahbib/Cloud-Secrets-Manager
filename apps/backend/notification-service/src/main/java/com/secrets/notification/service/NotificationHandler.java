package com.secrets.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.dto.notification.NotificationEvent;
import com.secrets.dto.notification.NotificationType;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.entity.User;
import com.secrets.notification.dto.NotificationDto;
import com.secrets.notification.mapper.NotificationMapper;
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
    private final NotificationMapper notificationMapper;

    public NotificationHandler(NotificationRepository notificationRepository,
            UserRepository userRepository,
            EmailService emailService,
            ObjectMapper objectMapper,
            NotificationSseService sseService,
            NotificationBatchingService batchingService,
            NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
        this.sseService = sseService;
        this.batchingService = batchingService;
        this.notificationMapper = notificationMapper;
    }

    /**
     * Handle a notification event for all recipients.
     * Improved error handling: individual recipient failures don't block other recipients.
     * 
     * @param event The notification event to process
     * @throws RuntimeException only for critical failures that should trigger message retry
     */
    public void handle(NotificationEvent event) {
        if (event == null) {
            log.warn("Received null notification event, skipping");
            return;
        }
        
        if (event.getRecipientUserIds() == null || event.getRecipientUserIds().isEmpty()) {
            log.debug("Notification event {} has no recipients, skipping", event.getType());
            return;
        }

        // Invitations are handled specially by email only (recipient ids are emails,
        // not UUIDs)
        if (event.getType() == NotificationType.PROJECT_INVITATION ||
                event.getType() == NotificationType.TEAM_INVITATION) {
            try {
                handleInvitationEmail(event);
            } catch (Exception ex) {
                log.error("Failed to handle invitation email for event type {}: {}", 
                        event.getType(), ex.getMessage(), ex);
                // Don't throw - invitation failures shouldn't block other notifications
            }
            return;
        }

        // Batch load all users to avoid N+1 query problem
        java.util.List<UUID> userIds = new java.util.ArrayList<>();
        for (String userIdStr : event.getRecipientUserIds()) {
            try {
                userIds.add(UUID.fromString(userIdStr));
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid recipient user id '{}' in notification event {}, skipping recipient", 
                        userIdStr, event.getType());
            }
        }
        
        if (userIds.isEmpty()) {
            log.warn("No valid user IDs in notification event {}", event.getType());
            return;
        }
        
        // Batch load users
        java.util.Map<UUID, User> usersMap = new java.util.HashMap<>();
        java.util.List<User> users = userRepository.findAllById(userIds);
        for (User user : users) {
            usersMap.put(user.getId(), user);
        }
        
        int successCount = 0;
        int failureCount = 0;
        
        // Process notifications for all valid users
        for (UUID userId : userIds) {
            try {
                User user = usersMap.get(userId);
                if (user == null) {
                    log.debug("User {} not found when handling notification {}, skipping", userId, event.getType());
                    failureCount++;
                    continue;
                }
                
                processNotificationForUser(user, event);
                successCount++;
            } catch (Exception ex) {
                // Individual recipient processing failure - log but continue
                log.error("Failed to process notification for user {} in event {}: {}", 
                        userId, event.getType(), ex.getMessage(), ex);
                failureCount++;
            }
        }
        
        log.info("Processed notification event {}: {} succeeded, {} failed out of {} recipients", 
                event.getType(), successCount, failureCount, event.getRecipientUserIds().size());
        
        // Only throw if all recipients failed - this might indicate a systemic issue
        if (successCount == 0 && failureCount > 0) {
            throw new RuntimeException("All recipients failed for notification event " + event.getType());
        }
    }
    
    /**
     * Process notification for a single user.
     * 
     * @param user User entity (already loaded)
     * @param event Notification event
     * @throws RuntimeException for processing failures
     */
    private void processNotificationForUser(User user, NotificationEvent event) {
        UUID userId = user.getId();

        // Check if notification type is enabled at all
        if (!isEnabledForEvent(user, event)) {
            log.debug("Notification {} disabled by preferences for user {}, skipping",
                    event.getType(), userId);
            return;
        }

        // Check if in-app notifications are enabled
        boolean inAppEnabled = isInAppEnabledForEvent(user, event);
        // Check if email notifications are enabled
        boolean emailEnabled = isEmailEnabledForEvent(user, event);

        Notification notification = null;
        if (inAppEnabled) {
            try {
                notification = createOrUpdateNotification(userId, event);
                
                // Send via SSE to connected clients
                if (notification != null) {
                    sendSseNotification(userId, notification);
                }
            } catch (Exception ex) {
                log.error("Failed to create/send in-app notification for user {}: {}", 
                        userId, ex.getMessage(), ex);
                // Continue to email even if in-app fails
            }
        }

        // Send email where appropriate
        if (emailEnabled) {
            try {
                sendEmailForEvent(user, event);
            } catch (Exception ex) {
                log.error("Failed to send email for user {} in event {}: {}", 
                        userId, event.getType(), ex.getMessage(), ex);
                // Email failures are logged but don't fail the whole operation
            }
        }
    }
    
    /**
     * Create or update notification in database.
     */
    private Notification createOrUpdateNotification(UUID userId, NotificationEvent event) {
        Instant createdAt = event.getCreatedAt() != null ? event.getCreatedAt() : Instant.now();

        // Check if we should batch this notification
        Notification existingBatch = batchingService.findBatchableNotification(
                userId, event.getType().name(), createdAt);

        if (existingBatch != null) {
            // Update existing notification with batch info
            String batchInfo = String.format("Additional: %s",
                    event.getTitle() != null ? event.getTitle() : "Notification");
            batchingService.updateNotificationBatch(existingBatch, batchInfo);
            notificationRepository.save(existingBatch);
            return existingBatch;
        } else {
            // Create new notification
            Notification notification = new Notification();
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
                    log.warn("Failed to serialize notification metadata for user {}: {}", userId,
                            e.getMessage());
                }
            }

            return notificationRepository.save(notification);
        }
    }
    
    /**
     * Send notification via SSE with improved error handling.
     */
    private void sendSseNotification(UUID userId, Notification notification) {
        try {
            NotificationDto dto = notificationMapper.toDto(notification);
            sseService.sendNotification(userId, dto);
        } catch (Exception ex) {
            log.warn("Failed to send notification via SSE to user {}: {}", userId, ex.getMessage());
            // SSE failures are non-critical - notification is still saved in DB
        }
    }

    private void handleInvitationEmail(NotificationEvent event) {
        var metadata = event.getMetadata();
        if (metadata == null || metadata.isEmpty()) {
            log.warn("Invitation email event missing metadata");
            return;
        }

        String email = metadata.getOrDefault("email", null);
        String projectName = metadata.getOrDefault("projectName", "");
        String token = metadata.getOrDefault("token", "");
        String inviterName = metadata.getOrDefault("inviterName", "A teammate");

        if (email == null || email.isBlank()) {
            log.warn("Invitation email event missing recipient email");
            return;
        }

        if (token == null || token.isBlank()) {
            log.warn("Invitation email event missing token for email: {}", email);
            return;
        }

        emailService.sendInvitationEmail(email, token, projectName, inviterName);
    }

    private void sendEmailForEvent(User user, NotificationEvent event) {
        var metadata = event.getMetadata();
        if (metadata == null || metadata.isEmpty()) {
            log.debug("Event {} missing metadata for email sending", event.getType());
            return;
        }

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            log.debug("User {} has no email address, skipping email for event {}", user.getId(), event.getType());
            return;
        }

        try {
            if (event.getType() == NotificationType.SECRET_EXPIRING_SOON) {
                String secretKey = metadata.getOrDefault("secretKey", "");
                String projectName = metadata.getOrDefault("projectName", "");
                String expiresAtStr = metadata.getOrDefault("expiresAt", "");

                if (secretKey.isEmpty() || projectName.isEmpty() || expiresAtStr.isEmpty()) {
                    log.warn("Missing required metadata for expiration warning email: secretKey={}, projectName={}, expiresAt={}",
                            secretKey.isEmpty() ? "missing" : "present",
                            projectName.isEmpty() ? "missing" : "present",
                            expiresAtStr.isEmpty() ? "missing" : "present");
                    return;
                }

                try {
                    LocalDateTime expiresAt = LocalDateTime.parse(expiresAtStr);
                    emailService.sendExpirationWarning(email, secretKey, projectName, expiresAt);
                } catch (Exception e) {
                    log.error("Failed to parse expiration date '{}' for email to {}: {}", expiresAtStr, email, e.getMessage());
                }
            } else if (event.getType() == NotificationType.ROLE_CHANGED) {
                String projectName = metadata.getOrDefault("projectName", "");
                String oldRole = metadata.getOrDefault("oldRole", "");
                String newRole = metadata.getOrDefault("newRole", "");

                if (projectName.isEmpty() || newRole.isEmpty()) {
                    log.warn("Missing required metadata for role change email: projectName={}, newRole={}",
                            projectName.isEmpty() ? "missing" : "present",
                            newRole.isEmpty() ? "missing" : "present");
                    return;
                }

                emailService.sendMembershipChangeEmail(email, projectName, oldRole, newRole);
            }
        } catch (Exception ex) {
            log.error("Failed to send email for event {} to {}: {}", event.getType(), email, ex.getMessage(), ex);
        }
    }

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

}
