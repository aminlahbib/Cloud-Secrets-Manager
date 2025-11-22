package com.secrets.dto;

import com.secrets.entity.Secret;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecretResponse {
    private String key;
    private String value;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SecretResponse from(Secret secret, String decryptedValue) {
        return SecretResponse.builder()
            .key(secret.getSecretKey())
            .value(decryptedValue)
            .createdBy(secret.getCreatedBy())
            .createdAt(secret.getCreatedAt())
            .updatedAt(secret.getUpdatedAt())
            .build();
    }
}

