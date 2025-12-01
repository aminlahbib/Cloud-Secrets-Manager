package com.secrets.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notification_preferences", columnDefinition = "jsonb")
    private Map<String, Object> notificationPreferences;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Map<String, Object> getNotificationPreferences() {
        return notificationPreferences;
    }

    public void setNotificationPreferences(Map<String, Object> notificationPreferences) {
        this.notificationPreferences = notificationPreferences;
    }
}


