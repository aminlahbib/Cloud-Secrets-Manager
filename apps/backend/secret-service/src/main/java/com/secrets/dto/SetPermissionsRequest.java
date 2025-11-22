package com.secrets.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class SetPermissionsRequest {
    @NotEmpty(message = "Permissions list cannot be empty")
    private List<String> permissions;

    public SetPermissionsRequest() {
    }

    public SetPermissionsRequest(List<String> permissions) {
        this.permissions = permissions;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
}
