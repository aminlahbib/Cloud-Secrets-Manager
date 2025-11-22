package com.secrets.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class BulkDeleteRequest {
    
    @NotEmpty(message = "Secret keys list cannot be empty")
    private List<String> keys;

    public BulkDeleteRequest() {
    }

    public BulkDeleteRequest(List<String> keys) {
        this.keys = keys;
    }

    public List<String> getKeys() {
        return keys;
    }

    public void setKeys(List<String> keys) {
        this.keys = keys;
    }
}
