package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SecretRequest {
    
    @NotBlank(message = "Secret key is required")
    @Size(max = 255, message = "Secret key must not exceed 255 characters")
    private String key;
    
    @NotBlank(message = "Secret value is required")
    @Size(max = 5000, message = "Secret value must not exceed 5000 characters")
    private String value;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    /**
     * ISO-8601 date string (e.g., 2025-11-27T10:00:00Z)
     */
    private String expiresAt;

    public SecretRequest() {
    }

    public SecretRequest(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(String expiresAt) {
        this.expiresAt = expiresAt;
    }
}
