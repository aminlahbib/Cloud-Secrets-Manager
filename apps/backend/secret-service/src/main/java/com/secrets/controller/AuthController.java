package com.secrets.controller;

import com.secrets.dto.LoginRequest;
import com.secrets.dto.RefreshTokenRequest;
import com.secrets.dto.TokenResponse;
import com.secrets.entity.RefreshToken;
import com.secrets.exception.TokenRefreshException;
import com.secrets.security.GoogleIdentityTokenValidator;
import com.secrets.security.JwtTokenProvider;
import com.secrets.service.GoogleIdentityService;
import com.secrets.service.RefreshTokenService;
import com.google.firebase.auth.FirebaseAuthException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import com.secrets.dto.UserResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final GoogleIdentityTokenValidator googleTokenValidator;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    private final GoogleIdentityService googleIdentityService;

    public AuthController(GoogleIdentityTokenValidator googleTokenValidator, JwtTokenProvider tokenProvider,
                         RefreshTokenService refreshTokenService, GoogleIdentityService googleIdentityService) {
        this.googleTokenValidator = googleTokenValidator;
        this.tokenProvider = tokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.googleIdentityService = googleIdentityService;
    }

    @Value("${security.jwt.expiration-ms:900000}")
    private long expirationMs;

    @Value("${google.cloud.identity.enabled:false}")
    private boolean googleIdentityEnabled;

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieves the currently authenticated user's details")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<String> authorities = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();

        String role = authorities.stream()
            .filter(a -> a.startsWith("ROLE_"))
            .findFirst()
            .map(r -> r.substring(5)) // Remove ROLE_
            .orElse("USER");

        // In v3 architecture, permissions are project-scoped, not global
        // The permissions array is kept empty for backwards compatibility
        List<String> permissions = List.of();

        UserResponse response = UserResponse.builder()
            .id(userDetails.getUsername())
            .email(userDetails.getUsername())
            .role(role)
            .permissions(permissions)
            .active(true)
            .createdAt(java.time.LocalDateTime.now())
            .build();
            
        return ResponseEntity.ok(response);
    }

    /**
     * Google Cloud Identity Platform login endpoint
     * Accepts Google ID token from Firebase SDK and returns JWT token for API calls
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        if (!googleIdentityEnabled) {
            log.error("Google Cloud Identity Platform is not enabled");
            return ResponseEntity.badRequest()
                .body(TokenResponse.builder()
                    .error("Google Cloud Identity Platform is not enabled. Please configure it first.")
                    .build());
        }

        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            return ResponseEntity.badRequest()
                .body(TokenResponse.builder()
                    .error("idToken is required")
                    .build());
        }

        try {
            log.debug("Google Identity login attempt with ID token");
            
            // Validate Google ID token with Firebase Admin SDK
            Authentication authentication = googleTokenValidator.validateToken(request.getIdToken());

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Generate access token
            String accessToken = tokenProvider.generateToken(
                userDetails.getUsername(),
                userDetails.getAuthorities()
            );

            // Generate refresh token
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getUsername());

            TokenResponse response = TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .build();

            log.info("User {} logged in successfully via Google Identity Platform", userDetails.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (FirebaseAuthException e) {
            log.error("Failed to validate Google ID token", e);
            return ResponseEntity.status(401)
                .body(TokenResponse.builder()
                    .error("Invalid ID token: " + e.getMessage())
                    .build());
        } catch (IllegalStateException e) {
            log.error("Google Identity Platform not properly configured", e);
            return ResponseEntity.status(500)
                .body(TokenResponse.builder()
                    .error("Authentication service not available: " + e.getMessage())
                    .build());
        } catch (Exception e) {
            log.error("Unexpected error during authentication", e);
            return ResponseEntity.status(500)
                .body(TokenResponse.builder()
                    .error("Authentication failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Refresh access token using refresh token
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            String refreshTokenString = request.getRefreshToken();

            // Find and verify the refresh token
            RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenString);
            refreshTokenService.verifyExpiration(refreshToken);

            String username = refreshToken.getUsername();

            // Fetch current user authorities from Google Identity Platform
            // This ensures permissions are up-to-date even if they changed since token was issued
            Collection<? extends GrantedAuthority> authorities = fetchUserAuthorities(username);

            // Generate new access token with current authorities
            String newAccessToken = refreshTokenService.generateNewAccessToken(
                refreshToken,
                authorities
            );

            // Optionally rotate the refresh token (security best practice)
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(username);

            TokenResponse response = TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .build();

            log.info("Refreshed access token for user: {}", username);
            return ResponseEntity.ok(response);

        } catch (TokenRefreshException e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                .body(TokenResponse.builder()
                    .error("Invalid refresh token: " + e.getMessage())
                    .build());
        } catch (Exception e) {
            log.error("Unexpected error during token refresh", e);
            return ResponseEntity.status(500)
                .body(TokenResponse.builder()
                    .error("Token refresh failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Fetch user authorities from Google Identity Platform
     * This ensures permissions are up-to-date when refreshing tokens
     */
    private Collection<? extends GrantedAuthority> fetchUserAuthorities(String email) {
        try {
            if (!googleIdentityEnabled) {
                // Fallback to default role if Google Identity is disabled
                return List.of(new SimpleGrantedAuthority("ROLE_USER"));
            }

            Map<String, Object> claims = googleIdentityService.getUserClaims(email);
            List<GrantedAuthority> authorities = new ArrayList<>();

            // Extract roles
            Object rolesClaim = claims.get("roles");
            if (rolesClaim instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) rolesClaim;
                roles.forEach(role -> 
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                );
            } else if (rolesClaim instanceof String) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + ((String) rolesClaim).toUpperCase()));
            }

            // In v3 architecture, permissions are project-scoped via membership table
            // Global permissions from Firebase claims are not used

            // Default to USER role if no roles found
            if (authorities.stream().noneMatch(a -> a.getAuthority().startsWith("ROLE_"))) {
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            return authorities;
        } catch (FirebaseAuthException e) {
            log.warn("Failed to fetch user authorities from Google Identity Platform for user: {}. Using default ROLE_USER", email, e);
            // Fallback to default role on error
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }
    }
}

