package com.secrets.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

public class UserPreferencesRequest {
    
    @Valid
    private NotificationPreferences notifications;
    
    @Pattern(regexp = "^[A-Za-z_/]+$", message = "Invalid timezone format")
    private String timezone;
    
    @Pattern(regexp = "^(MM/DD/YYYY|DD/MM/YYYY|YYYY-MM-DD)$", message = "Invalid date format")
    private String dateFormat;

    public UserPreferencesRequest() {
    }

    public NotificationPreferences getNotifications() {
        return notifications;
    }

    public void setNotifications(NotificationPreferences notifications) {
        this.notifications = notifications;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public static class NotificationPreferences {
        @JsonProperty("email")
        private Boolean email;
        
        @JsonProperty("secretExpiration")
        private Boolean secretExpiration;
        
        @JsonProperty("projectInvitations")
        private Boolean projectInvitations;
        
        @JsonProperty("securityAlerts")
        private Boolean securityAlerts;

        public NotificationPreferences() {
        }

        public Boolean getEmail() {
            return email;
        }

        public void setEmail(Boolean email) {
            this.email = email;
        }

        public Boolean getSecretExpiration() {
            return secretExpiration;
        }

        public void setSecretExpiration(Boolean secretExpiration) {
            this.secretExpiration = secretExpiration;
        }

        public Boolean getProjectInvitations() {
            return projectInvitations;
        }

        public void setProjectInvitations(Boolean projectInvitations) {
            this.projectInvitations = projectInvitations;
        }

        public Boolean getSecurityAlerts() {
            return securityAlerts;
        }

        public void setSecurityAlerts(Boolean securityAlerts) {
            this.securityAlerts = securityAlerts;
        }
    }
}

