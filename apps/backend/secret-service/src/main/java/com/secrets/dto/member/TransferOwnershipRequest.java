package com.secrets.dto.member;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class TransferOwnershipRequest {
    
    @NotNull(message = "New owner user ID is required")
    private UUID newOwnerUserId;

    public TransferOwnershipRequest() {
    }

    public UUID getNewOwnerUserId() {
        return newOwnerUserId;
    }

    public void setNewOwnerUserId(UUID newOwnerUserId) {
        this.newOwnerUserId = newOwnerUserId;
    }
}

