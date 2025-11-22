package com.secrets.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetPermissionsRequest {
    @NotEmpty(message = "Permissions list cannot be empty")
    private List<String> permissions;
}

