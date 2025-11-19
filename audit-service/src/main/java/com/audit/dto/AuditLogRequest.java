package com.audit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {
    
    @NotBlank(message = "Action is required")
    private String action;
    
    @NotBlank(message = "Secret key is required")
    private String secretKey;
    
    @NotBlank(message = "Username is required")
    private String username;
}

