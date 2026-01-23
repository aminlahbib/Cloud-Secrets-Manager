package com.secrets.notification.service;

import com.secrets.dto.notification.NotificationType;
import com.secrets.notification.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Service for checking user notification preferences.
 * Centralizes preference checking logic with proper logging and error handling.
 */
@Service
public class NotificationPreferenceService {

    private static final Logger log = LoggerFactory.getLogger(NotificationPreferenceService.class);

    /**
     * Get the preference key for a notification type's enabled state
     */
    public String getEnabledPreferenceKey(NotificationType type) {
        return switch (type) {
            case SECRET_EXPIRING_SOON -> "secretExpiration";
            case PROJECT_INVITATION, TEAM_INVITATION -> "projectInvitations";
            case SECURITY_ALERT -> "securityAlerts";
            case ROLE_CHANGED -> "roleChanged";
        };
    }

    /**
     * Get the preference key for a notification type's in-app state
     */
    public String getInAppPreferenceKey(NotificationType type) {
        return switch (type) {
            case SECRET_EXPIRING_SOON -> "secretExpirationInApp";
            case PROJECT_INVITATION, TEAM_INVITATION -> "projectInvitationsInApp";
            case SECURITY_ALERT -> "securityAlertsInApp";
            case ROLE_CHANGED -> "roleChangedInApp";
        };
    }

    /**
     * Get the preference key for a notification type's email state
     */
    public String getEmailPreferenceKey(NotificationType type) {
        return switch (type) {
            case SECRET_EXPIRING_SOON -> "secretExpirationEmail";
            case PROJECT_INVITATION, TEAM_INVITATION -> "projectInvitationsEmail";
            case SECURITY_ALERT -> "securityAlertsEmail";
            case ROLE_CHANGED -> "roleChangedEmail";
        };
    }

    /**
     * Check if a notification type is enabled for a user
     * @param user User to check preferences for
     * @param type Notification type
     * @return true if enabled, false if disabled, true by default if preference is missing
     */
    public boolean isNotificationEnabled(User user, NotificationType type) {
        Map<String, Object> prefs = user.getNotificationPreferences();
        
        if (prefs == null || prefs.isEmpty()) {
            log.debug("User {} has no notification preferences, defaulting to enabled for type {}", 
                user.getId(), type);
            return true;
        }

        String key = getEnabledPreferenceKey(type);
        Object value = prefs.get(key);
        
        if (value instanceof Boolean b) {
            if (!b) {
                log.debug("Notification {} disabled by preference '{}' for user {}", 
                    type, key, user.getId());
            }
            return b;
        }

        // Preference key missing or not boolean - default to enabled
        if (value != null) {
            log.warn("Preference '{}' for user {} has invalid type: {}. Expected Boolean, defaulting to enabled.", 
                key, user.getId(), value.getClass().getSimpleName());
        } else {
            log.debug("Preference '{}' not found for user {}, defaulting to enabled for type {}", 
                key, user.getId(), type);
        }
        return true;
    }

    /**
     * Check if in-app notifications are enabled for a notification type
     * @param user User to check preferences for
     * @param type Notification type
     * @return true if enabled, false if disabled, falls back to general enabled preference
     */
    public boolean isInAppEnabled(User user, NotificationType type) {
        Map<String, Object> prefs = user.getNotificationPreferences();
        
        if (prefs == null || prefs.isEmpty()) {
            log.debug("User {} has no notification preferences, defaulting to enabled for in-app type {}", 
                user.getId(), type);
            return true;
        }

        String key = getInAppPreferenceKey(type);
        Object value = prefs.get(key);
        
        if (value instanceof Boolean b) {
            if (!b) {
                log.debug("In-app notification {} disabled by preference '{}' for user {}", 
                    type, key, user.getId());
            }
            return b;
        }

        // Fallback to general enabled preference
        log.debug("In-app preference '{}' not found for user {}, falling back to general enabled preference for type {}", 
            key, user.getId(), type);
        return isNotificationEnabled(user, type);
    }

    /**
     * Check if email notifications are enabled for a notification type
     * @param user User to check preferences for
     * @param type Notification type
     * @return true if enabled, false if disabled, respects master email toggle
     */
    public boolean isEmailEnabled(User user, NotificationType type) {
        Map<String, Object> prefs = user.getNotificationPreferences();
        
        if (prefs == null || prefs.isEmpty()) {
            log.debug("User {} has no notification preferences, defaulting to enabled for email type {}", 
                user.getId(), type);
            return true;
        }

        // Check master email toggle first
        Object emailEnabled = prefs.get("email");
        if (emailEnabled instanceof Boolean b && !b) {
            log.debug("Email notifications disabled globally for user {} (master 'email' preference is false)", 
                user.getId());
            return false;
        }

        String key = getEmailPreferenceKey(type);
        Object value = prefs.get(key);
        
        if (value instanceof Boolean b) {
            if (!b) {
                log.debug("Email notification {} disabled by preference '{}' for user {}", 
                    type, key, user.getId());
            }
            return b;
        }

        // Fallback to master email preference
        log.debug("Email preference '{}' not found for user {}, falling back to master email preference for type {}", 
            key, user.getId(), type);
        return emailEnabled instanceof Boolean ? (Boolean) emailEnabled : true;
    }
}
