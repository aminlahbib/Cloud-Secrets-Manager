package com.secrets.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Evaluates if a user has a specific permission
 */
@Component
public class PermissionEvaluator {

    private static final Logger log = LoggerFactory.getLogger(PermissionEvaluator.class);

    /**
     * Check if the authenticated user has the required permission
     */
    public boolean hasPermission(Authentication authentication, Permission requiredPermission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        
        // Extract permissions from authorities
        Set<String> userPermissions = authorities.stream()
            .map(GrantedAuthority::getAuthority)
            .filter(auth -> auth.startsWith("PERMISSION_"))
            .map(auth -> auth.replace("PERMISSION_", "").toLowerCase())
            .collect(Collectors.toSet());

        // Check if user has the required permission
        boolean hasPermission = userPermissions.contains(requiredPermission.getValue().toLowerCase());
        
        log.debug("Permission check: user={}, required={}, hasPermission={}", 
            authentication.getName(), requiredPermission, hasPermission);
        
        return hasPermission;
    }

    /**
     * Check if the authenticated user has any of the required permissions
     */
    public boolean hasAnyPermission(Authentication authentication, Permission... requiredPermissions) {
        for (Permission permission : requiredPermissions) {
            if (hasPermission(authentication, permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the authenticated user has all of the required permissions
     */
    public boolean hasAllPermissions(Authentication authentication, Permission... requiredPermissions) {
        for (Permission permission : requiredPermissions) {
            if (!hasPermission(authentication, permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if user has ADMIN role (admins have all permissions)
     */
    public boolean isAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(auth -> auth.equals("ROLE_ADMIN"));
    }
}

