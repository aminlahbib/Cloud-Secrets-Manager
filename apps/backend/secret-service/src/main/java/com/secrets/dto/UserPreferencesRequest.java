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
        
        @JsonProperty("secretExpirationInApp")
        private Boolean secretExpirationInApp;
        
        @JsonProperty("secretExpirationEmail")
        private Boolean secretExpirationEmail;
        
        @JsonProperty("projectInvitations")
        private Boolean projectInvitations;
        
        @JsonProperty("projectInvitationsInApp")
        private Boolean projectInvitationsInApp;
        
        @JsonProperty("projectInvitationsEmail")
        private Boolean projectInvitationsEmail;
        
        @JsonProperty("securityAlerts")
        private Boolean securityAlerts;
        
        @JsonProperty("securityAlertsInApp")
        private Boolean securityAlertsInApp;
        
        @JsonProperty("securityAlertsEmail")
        private Boolean securityAlertsEmail;
        
        @JsonProperty("roleChangedInApp")
        private Boolean roleChangedInApp;
        
        @JsonProperty("roleChangedEmail")
        private Boolean roleChangedEmail;

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

        public Boolean getSecretExpirationInApp() {
            return secretExpirationInApp;
        }

        public void setSecretExpirationInApp(Boolean secretExpirationInApp) {
            this.secretExpirationInApp = secretExpirationInApp;
        }

        public Boolean getSecretExpirationEmail() {
            return secretExpirationEmail;
        }

        public void setSecretExpirationEmail(Boolean secretExpirationEmail) {
            this.secretExpirationEmail = secretExpirationEmail;
        }

        public Boolean getProjectInvitationsInApp() {
            return projectInvitationsInApp;
        }

        public void setProjectInvitationsInApp(Boolean projectInvitationsInApp) {
            this.projectInvitationsInApp = projectInvitationsInApp;
        }

        public Boolean getProjectInvitationsEmail() {
            return projectInvitationsEmail;
        }

        public void setProjectInvitationsEmail(Boolean projectInvitationsEmail) {
            this.projectInvitationsEmail = projectInvitationsEmail;
        }

        public Boolean getSecurityAlertsInApp() {
            return securityAlertsInApp;
        }

        public void setSecurityAlertsInApp(Boolean securityAlertsInApp) {
            this.securityAlertsInApp = securityAlertsInApp;
        }

        public Boolean getSecurityAlertsEmail() {
            return securityAlertsEmail;
        }

        public void setSecurityAlertsEmail(Boolean securityAlertsEmail) {
            this.securityAlertsEmail = securityAlertsEmail;
        }

        public Boolean getRoleChangedInApp() {
            return roleChangedInApp;
        }

        public void setRoleChangedInApp(Boolean roleChangedInApp) {
            this.roleChangedInApp = roleChangedInApp;
        }

        public Boolean getRoleChangedEmail() {
            return roleChangedEmail;
        }

        public void setRoleChangedEmail(Boolean roleChangedEmail) {
            this.roleChangedEmail = roleChangedEmail;
        }
    }
}

