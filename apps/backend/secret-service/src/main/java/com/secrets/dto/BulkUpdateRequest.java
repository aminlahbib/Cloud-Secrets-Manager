package com.secrets.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateRequest {
    
    @NotEmpty(message = "Secrets list cannot be empty")
    @Valid
    private List<SecretRequest> secrets;
}

