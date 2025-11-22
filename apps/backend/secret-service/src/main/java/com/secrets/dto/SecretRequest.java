package com.secrets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecretRequest {
    
    @NotBlank(message = "Secret key is required")
    @Size(max = 255, message = "Secret key must not exceed 255 characters")
    private String key;
    
    @NotBlank(message = "Secret value is required")
    @Size(max = 5000, message = "Secret value must not exceed 5000 characters")
    private String value;
}

