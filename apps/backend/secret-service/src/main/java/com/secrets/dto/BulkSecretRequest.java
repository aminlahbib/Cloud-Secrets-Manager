package com.secrets.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class BulkSecretRequest {
    
    @NotEmpty(message = "Secrets list cannot be empty")
    @Valid
    private List<SecretRequest> secrets;

    public BulkSecretRequest() {
    }

    public BulkSecretRequest(List<SecretRequest> secrets) {
        this.secrets = secrets;
    }

    public List<SecretRequest> getSecrets() {
        return secrets;
    }

    public void setSecrets(List<SecretRequest> secrets) {
        this.secrets = secrets;
    }
}
