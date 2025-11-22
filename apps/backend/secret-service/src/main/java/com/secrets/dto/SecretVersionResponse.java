package com.secrets.dto;

import com.secrets.entity.SecretVersion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecretVersionResponse {
    private Long id;
    private String secretKey;
    private Integer versionNumber;
    private String changedBy;
    private String changeDescription;
    private LocalDateTime createdAt;

    public static SecretVersionResponse from(SecretVersion version) {
        return SecretVersionResponse.builder()
            .id(version.getId())
            .secretKey(version.getSecretKey())
            .versionNumber(version.getVersionNumber())
            .changedBy(version.getChangedBy())
            .changeDescription(version.getChangeDescription())
            .createdAt(version.getCreatedAt())
            .build();
    }
}

