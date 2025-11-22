package com.secrets.security;

/**
 * Fine-grained permissions for secret operations
 */
public enum Permission {
    /**
     * Read/view secrets
     */
    READ("read"),
    
    /**
     * Create and update secrets
     */
    WRITE("write"),
    
    /**
     * Delete secrets
     */
    DELETE("delete"),
    
    /**
     * Share secrets with other users/teams
     */
    SHARE("share"),
    
    /**
     * Rotate/regenerate secrets
     */
    ROTATE("rotate");

    private final String value;

    Permission(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Permission fromString(String value) {
        for (Permission permission : Permission.values()) {
            if (permission.value.equalsIgnoreCase(value)) {
                return permission;
            }
        }
        throw new IllegalArgumentException("Unknown permission: " + value);
    }
}

