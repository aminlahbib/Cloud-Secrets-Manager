package com.secrets.dto.notification;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Generic notification event used for decoupling domain actions
 * (invites, role changes, secret expiration, etc.) from delivery
 * channels (email, in-app notifications, push).
 */
public class NotificationEvent {

    private NotificationType type;

    /** Optional: who initiated the action (user id or email) */
    private String actorUserId;

    /** One or more recipients to notify */
    private List<String> recipientUserIds;

    /** Optional contextual identifiers */
    private String projectId;
    private String teamId;
    private String secretId;

    /** Human readable content */
    private String title;
    private String message;

    /**
     * Additional structured data, such as deep links:
     * e.g. {"deepLink": "/projects/123/secrets/abc"}
     */
    private Map<String, String> metadata;

    private Instant createdAt;

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(String actorUserId) {
        this.actorUserId = actorUserId;
    }

    public List<String> getRecipientUserIds() {
        return recipientUserIds;
    }

    public void setRecipientUserIds(List<String> recipientUserIds) {
        this.recipientUserIds = recipientUserIds;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getSecretId() {
        return secretId;
    }

    public void setSecretId(String secretId) {
        this.secretId = secretId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}


