package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShareSecretRequest {
    
    @NotBlank(message = "Username or email of the user to share with is required")
    private String sharedWith;
    
    private String permission; // Optional: READ, WRITE, etc. Defaults to READ
}

