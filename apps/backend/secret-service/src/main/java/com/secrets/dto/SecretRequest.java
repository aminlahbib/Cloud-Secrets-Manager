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
}
