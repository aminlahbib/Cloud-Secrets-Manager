package com.secrets.controller;

import com.secrets.dto.UserPreferencesRequest;
import com.secrets.dto.UserPreferencesResponse;
import com.secrets.service.UserService;
import com.secrets.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/preferences")
@Tag(name = "User Preferences", description = "Manage user preferences")
public class PreferencesController {

    private static final Logger log = LoggerFactory.getLogger(PreferencesController.class);

    private final UserService userService;

    public PreferencesController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get user preferences", description = "Retrieves the current user's preferences")
    public ResponseEntity<UserPreferencesResponse> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.notFound().build();
        }

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        UserPreferencesResponse response = new UserPreferencesResponse();
        
        // Set notification preferences
        UserPreferencesResponse.NotificationPreferences notifications = new UserPreferencesResponse.NotificationPreferences();
        if (user.getNotificationPreferences() != null) {
            Map<String, Object> prefs = user.getNotificationPreferences();
            notifications.setEmail((Boolean) prefs.getOrDefault("email", true));
            notifications.setSecretExpiration((Boolean) prefs.getOrDefault("secretExpiration", true));
            notifications.setProjectInvitations((Boolean) prefs.getOrDefault("projectInvitations", true));
            notifications.setSecurityAlerts((Boolean) prefs.getOrDefault("securityAlerts", true));
        } else {
            // Default values
            notifications.setEmail(true);
            notifications.setSecretExpiration(true);
            notifications.setProjectInvitations(true);
            notifications.setSecurityAlerts(true);
        }
        response.setNotifications(notifications);
        
        response.setTimezone(user.getTimezone() != null ? user.getTimezone() : "UTC");
        response.setDateFormat(user.getDateFormat() != null ? user.getDateFormat() : "MM/DD/YYYY");

        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Update user preferences", description = "Updates the current user's preferences")
    public ResponseEntity<UserPreferencesResponse> updatePreferences(
            @Valid @RequestBody UserPreferencesRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.notFound().build();
        }

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Update notification preferences
        if (request.getNotifications() != null) {
            Map<String, Object> prefs = new HashMap<>();
            UserPreferencesRequest.NotificationPreferences notifPrefs = request.getNotifications();
            if (notifPrefs.getEmail() != null) {
                prefs.put("email", notifPrefs.getEmail());
            }
            if (notifPrefs.getSecretExpiration() != null) {
                prefs.put("secretExpiration", notifPrefs.getSecretExpiration());
            }
            if (notifPrefs.getProjectInvitations() != null) {
                prefs.put("projectInvitations", notifPrefs.getProjectInvitations());
            }
            if (notifPrefs.getSecurityAlerts() != null) {
                prefs.put("securityAlerts", notifPrefs.getSecurityAlerts());
            }
            
            // Merge with existing preferences
            if (user.getNotificationPreferences() != null) {
                prefs.putAll(user.getNotificationPreferences());
            }
            user.setNotificationPreferences(prefs);
        }

        // Update timezone
        if (request.getTimezone() != null) {
            user.setTimezone(request.getTimezone());
        }

        // Update date format
        if (request.getDateFormat() != null) {
            user.setDateFormat(request.getDateFormat());
        }

        userService.updateUser(user);
        log.info("Updated preferences for user: {}", userDetails.getUsername());

        // Return updated preferences
        UserPreferencesResponse response = new UserPreferencesResponse();
        UserPreferencesResponse.NotificationPreferences notifications = new UserPreferencesResponse.NotificationPreferences();
        Map<String, Object> prefs = user.getNotificationPreferences();
        if (prefs != null) {
            notifications.setEmail((Boolean) prefs.getOrDefault("email", true));
            notifications.setSecretExpiration((Boolean) prefs.getOrDefault("secretExpiration", true));
            notifications.setProjectInvitations((Boolean) prefs.getOrDefault("projectInvitations", true));
            notifications.setSecurityAlerts((Boolean) prefs.getOrDefault("securityAlerts", true));
        } else {
            notifications.setEmail(true);
            notifications.setSecretExpiration(true);
            notifications.setProjectInvitations(true);
            notifications.setSecurityAlerts(true);
        }
        response.setNotifications(notifications);
        response.setTimezone(user.getTimezone() != null ? user.getTimezone() : "UTC");
        response.setDateFormat(user.getDateFormat() != null ? user.getDateFormat() : "MM/DD/YYYY");

        return ResponseEntity.ok(response);
    }
}

