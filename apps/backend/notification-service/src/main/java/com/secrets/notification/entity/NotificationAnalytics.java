package com.secrets.notification.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_analytics", indexes = {
        @Index(name = "idx_notification_analytics_user", columnList = "userId"),
        @Index(name = "idx_notification_analytics_notification", columnList = "notificationId"),
        @Index(name = "idx_notification_analytics_created", columnList = "createdAt")
})
public class NotificationAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "notification_id", nullable = false)
    private UUID notificationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "action", length = 50)
    private String action;

    @Column(name = "opened_at")
    private Instant openedAt;

    @Column(name = "clicked_at")
    private Instant clickedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(UUID notificationId) {
        this.notificationId = notificationId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Instant getOpenedAt() {
        return openedAt;
    }

    public void setOpenedAt(Instant openedAt) {
        this.openedAt = openedAt;
    }

    public Instant getClickedAt() {
        return clickedAt;
    }

    public void setClickedAt(Instant clickedAt) {
        this.clickedAt = clickedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
