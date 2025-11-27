package com.secrets.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class GoogleIdentityTokenValidator {

    private static final Logger log = LoggerFactory.getLogger(GoogleIdentityTokenValidator.class);

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;
    
    @Value("${google.cloud.identity.enabled:false}")
    private boolean enabled;

    /**
     * Validates a Google ID token and returns authentication
     * All user data comes from Google Identity Platform - no local database needed
     */
    public Authentication validateToken(String idToken) throws FirebaseAuthException {
        if (!enabled || firebaseAuth == null) {
            throw new IllegalStateException("Google Cloud Identity Platform is not enabled or not initialized");
        }

        // Verify the ID token with Google Identity Platform
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        
        log.debug("Validated Google ID token for user: {} ({})", email, uid);

        // Extract roles and permissions from custom claims in the token
        // Roles and permissions are stored as custom claims in Google Identity Platform
        Collection<? extends GrantedAuthority> authorities = extractAuthorities(decodedToken);

        // Create authentication object using email as username
        // No password needed - authentication already verified by Google
        org.springframework.security.core.userdetails.User principal = 
            new org.springframework.security.core.userdetails.User(
                email != null ? email : uid, // Use email as username, fallback to uid
                "", // No password needed
                authorities
            );

        // Store FirebaseToken in authentication details for later use (e.g., user creation)
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            principal,
            idToken,
            authorities
        );
        authentication.setDetails(decodedToken); // Store FirebaseToken for user creation
        
        return authentication;
    }

    /**
     * Extract roles and permissions from custom claims in the Firebase token
     * Custom claims are set via Admin SDK (see GoogleIdentityService)
     */
    private Collection<? extends GrantedAuthority> extractAuthorities(FirebaseToken token) {
        List<String> roles = extractRolesFromToken(token);
        List<String> permissions = extractPermissionsFromToken(token);
        
        // Default to USER role if no roles specified
        if (roles.isEmpty()) {
            roles = List.of("USER");
            log.debug("No roles found in token, defaulting to USER role");
        }

        // Build authorities list with both roles and permissions
        List<GrantedAuthority> authorities = roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toList());

        // Add permissions as authorities
        permissions.forEach(permission -> 
            authorities.add(new SimpleGrantedAuthority("PERMISSION_" + permission.toUpperCase()))
        );

        return authorities;
    }

    /**
     * Extract roles from custom claims
     * Custom claims are stored in the token when set via Admin SDK
     */
    @SuppressWarnings("unchecked")
    private List<String> extractRolesFromToken(FirebaseToken token) {
        Object rolesClaim = token.getClaims().get("roles");
        
        if (rolesClaim instanceof List) {
            return (List<String>) rolesClaim;
        }
        
        // Also check for single role string
        if (rolesClaim instanceof String) {
            return List.of((String) rolesClaim);
        }
        
        return List.of();
    }

    /**
     * Extract permissions from custom claims
     * Permissions are stored in the token when set via Admin SDK
     */
    @SuppressWarnings("unchecked")
    private List<String> extractPermissionsFromToken(FirebaseToken token) {
        Object permissionsClaim = token.getClaims().get("permissions");
        
        if (permissionsClaim instanceof List) {
            return (List<String>) permissionsClaim;
        }
        
        // Also check for single permission string
        if (permissionsClaim instanceof String) {
            return List.of((String) permissionsClaim);
        }
        
        return List.of();
    }
}

