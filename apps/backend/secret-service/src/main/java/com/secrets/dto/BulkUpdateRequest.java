package com.secrets.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class BulkUpdateRequest {
    
    @NotEmpty(message = "Secrets list cannot be empty")
    @Valid
    private List<SecretRequest> secrets;

    public BulkUpdateRequest() {
    }

    public BulkUpdateRequest(List<SecretRequest> secrets) {
        this.secrets = secrets;
    }

    public List<SecretRequest> getSecrets() {
        return secrets;
    }

    public void setSecrets(List<SecretRequest> secrets) {
        this.secrets = secrets;
    }
}
