package com.secrets.dto;

import com.secrets.entity.SharedSecret;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedSecretResponse {
    private Long id;
    private String secretKey;
    private String sharedWith;
    private String sharedBy;
    private String permission;
    private LocalDateTime sharedAt;

    public static SharedSecretResponse from(SharedSecret sharedSecret) {
        return SharedSecretResponse.builder()
            .id(sharedSecret.getId())
            .secretKey(sharedSecret.getSecretKey())
            .sharedWith(sharedSecret.getSharedWith())
            .sharedBy(sharedSecret.getSharedBy())
            .permission(sharedSecret.getPermission())
            .sharedAt(sharedSecret.getSharedAt())
            .build();
    }
}

