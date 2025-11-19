package com.audit.dto;

import com.audit.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private Long id;
    private String username;
    private String action;
    private String secretKey;
    private LocalDateTime timestamp;
    private String ipAddress;
    private String userAgent;

    public static AuditLogResponse from(AuditLog auditLog) {
        return AuditLogResponse.builder()
            .id(auditLog.getId())
            .username(auditLog.getUsername())
            .action(auditLog.getAction())
            .secretKey(auditLog.getSecretKey())
            .timestamp(auditLog.getTimestamp())
            .ipAddress(auditLog.getIpAddress())
            .userAgent(auditLog.getUserAgent())
            .build();
    }
}

