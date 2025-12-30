package com.secrets.controller;

import com.secrets.dto.LoginRequest;
import com.secrets.dto.RefreshTokenRequest;
import com.secrets.dto.TokenResponse;
import com.secrets.dto.SignupRequest;
import com.secrets.dto.EmailCheckRequest;
import com.secrets.dto.EmailCheckResponse;
import com.secrets.dto.invitation.InvitationResponse;
import com.secrets.entity.RefreshToken;
import com.secrets.entity.User;
import com.secrets.exception.TokenRefreshException;
import com.secrets.security.GoogleIdentityTokenValidator;
import com.secrets.security.IntermediateTokenProvider;
import com.secrets.security.JwtTokenProvider;
import com.secrets.service.GoogleIdentityService;
import com.secrets.service.RefreshTokenService;
import com.secrets.service.UserService;
import com.secrets.service.InvitationService;
import com.secrets.service.WorkflowService;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
    private final UserService userService;
    private final IntermediateTokenProvider intermediateTokenProvider;
    private final InvitationService invitationService;
    private final WorkflowService workflowService;

    @Value("${two-factor.intermediate-token.expiry-ms:300000}")
    private long intermediateTokenExpiryMs;

    public AuthController(GoogleIdentityTokenValidator googleTokenValidator, JwtTokenProvider tokenProvider,
                         RefreshTokenService refreshTokenService, GoogleIdentityService googleIdentityService,
                         UserService userService, IntermediateTokenProvider intermediateTokenProvider,
                         InvitationService invitationService, WorkflowService workflowService) {
        this.googleTokenValidator = googleTokenValidator;
        this.tokenProvider = tokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.googleIdentityService = googleIdentityService;
        this.userService = userService;
        this.intermediateTokenProvider = intermediateTokenProvider;
        this.invitationService = invitationService;
        this.workflowService = workflowService;
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
        
        String email = userDetails.getUsername();
        
        // Fetch full user details from database
        User user = userService.findByEmail(email)
            .orElse(null);
        
        // Determine role: prefer database platformRole, fallback to JWT authorities
        String role = "USER";
        if (user != null && user.getPlatformRole() != null) {
            role = user.getPlatformRole().name();
        } else {
            List<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
            role = authorities.stream()
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .map(r -> r.substring(5)) // Remove ROLE_
                .orElse("USER");
        }

        // In v3 architecture, permissions are project-scoped, not global
        // The permissions array is kept empty for backwards compatibility
        List<String> permissions = List.of();

        UserResponse.UserResponseBuilder responseBuilder = UserResponse.builder()
            .id(user != null ? user.getId().toString() : email)
            .email(email)
            .role(role)
            .permissions(permissions)
            .active(user != null ? user.getIsActive() : true);
        
        if (user != null) {
            responseBuilder
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .twoFactorType(user.getTwoFactorType());
            // Safely handle onboardingCompleted - may be null if column doesn't exist yet
            Boolean onboardingCompleted = user.getOnboardingCompleted();
            responseBuilder.onboardingCompleted(onboardingCompleted != null ? onboardingCompleted : true);
        } else {
            responseBuilder.createdAt(java.time.LocalDateTime.now());
        }
            
        return ResponseEntity.ok(responseBuilder.build());
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
            String email = userDetails.getUsername();
            
            // Extract Firebase token details to get UID, display name, and photo URL
            FirebaseToken firebaseToken = null;
            if (authentication.getDetails() instanceof FirebaseToken) {
                firebaseToken = (FirebaseToken) authentication.getDetails();
            }
            
            // Ensure user exists in local database (create if doesn't exist)
            String firebaseUid = firebaseToken != null ? firebaseToken.getUid() : email;
            String displayName = firebaseToken != null ? firebaseToken.getName() : null;
            String photoUrl = firebaseToken != null ? firebaseToken.getPicture() : null;
            
            User user = userService.getOrCreateUser(firebaseUid, email, displayName, photoUrl);
            
            // Ensure default workflow exists for the user
            try {
                workflowService.ensureDefaultWorkflow(user.getId());
                log.debug("Ensured default workflow exists for user: {}", email);
            } catch (Exception e) {
                log.warn("Failed to ensure default workflow for user, continuing: {}", e.getMessage());
                // Don't fail login if workflow creation fails
            }
            
            // Check if user has 2FA enabled
            if (user != null && Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                // User has 2FA enabled - return intermediate token
                UUID userId = user.getId();
                String intermediateToken = intermediateTokenProvider.generateToken(userId, email);
                
                TokenResponse response = TokenResponse.builder()
                    .requiresTwoFactor(true)
                    .intermediateToken(intermediateToken)
                    .twoFactorType("TOTP")
                    .expiresIn(intermediateTokenExpiryMs / 1000)
                    .build();
                
                log.info("User {} requires 2FA verification", email);
                return ResponseEntity.ok(response);
            }
            
            // No 2FA - proceed with normal token generation
            String accessToken = tokenProvider.generateToken(
                email,
                userDetails.getAuthorities()
            );

            // Generate refresh token
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(email);

            TokenResponse response = TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .requiresTwoFactor(false)
                .build();

            log.info("User {} logged in successfully via Google Identity Platform", email);
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
     * Check if email exists and return pending invitations
     * Public endpoint for signup flow
     */
    @PostMapping("/check-email")
    @Operation(summary = "Check email", description = "Check if email exists and return pending invitations")
    public ResponseEntity<EmailCheckResponse> checkEmail(@Valid @RequestBody EmailCheckRequest request) {
        try {
            String email = request.getEmail().toLowerCase().trim();
            boolean exists = userService.findByEmail(email).isPresent();
            
            List<InvitationResponse> invitations = List.of();
            boolean hasPendingInvitations = false;
            
            // Get pending invitations for this email (even if user doesn't exist yet)
            try {
                invitations = invitationService.listPendingInvitations(email);
                hasPendingInvitations = !invitations.isEmpty();
            } catch (Exception e) {
                log.warn("Failed to fetch invitations for email {}: {}", email, e.getMessage());
                // Continue without invitations
            }
            
            EmailCheckResponse response = new EmailCheckResponse(exists, hasPendingInvitations, invitations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking email: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(new EmailCheckResponse(false, false, List.of()));
        }
    }

    /**
     * Signup endpoint - Create new user account
     * Creates user in both Firebase and PostgreSQL, then auto-logs them in
     */
    @PostMapping("/signup")
    @Operation(summary = "Sign up", description = "Create a new user account")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody SignupRequest request) {
        if (!googleIdentityEnabled) {
            log.error("Google Cloud Identity Platform is not enabled");
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Google Cloud Identity Platform is not enabled. Please configure it first.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            String email = request.getEmail().toLowerCase().trim();
            
            // Check if user already exists
            if (userService.findByEmail(email).isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User with this email already exists");
                return ResponseEntity.badRequest().body(error);
            }

            log.info("Creating new user account: {}", email);
            
            // Create user in Firebase
            UserRecord userRecord = googleIdentityService.createUser(email, request.getPassword());
            
            // Set default USER role in Firebase
            googleIdentityService.setUserRoles(userRecord.getUid(), List.of("USER"));
            
            // Create user in PostgreSQL immediately
            User newUser = new User();
            newUser.setFirebaseUid(userRecord.getUid());
            newUser.setEmail(email);
            newUser.setDisplayName(request.getDisplayName());
            newUser.setPlatformRole(User.PlatformRole.USER);
            newUser.setIsActive(true);
            newUser.setLastLoginAt(java.time.LocalDateTime.now());
            newUser.setOnboardingCompleted(false); // New users need to complete onboarding
            
            User savedUser = userService.updateUser(newUser);
            
            // Create default workflow for the user
            try {
                workflowService.ensureDefaultWorkflow(savedUser.getId());
                log.debug("Created default workflow for user: {}", email);
            } catch (Exception e) {
                log.warn("Failed to create default workflow for user, continuing: {}", e.getMessage());
                // Don't fail signup if workflow creation fails
            }
            
            // Get pending invitations for this email
            List<InvitationResponse> pendingInvitations = List.of();
            try {
                pendingInvitations = invitationService.listPendingInvitations(email);
                
                // Auto-accept all pending invitations for the new user
                for (InvitationResponse invitation : pendingInvitations) {
                    try {
                        // Find invitation entity by email and project ID to get the token
                        java.util.Optional<com.secrets.entity.ProjectInvitation> invitationEntity = 
                            invitationService.getInvitationEntityByEmailAndProject(
                                email, invitation.getProjectId());
                        if (invitationEntity.isPresent()) {
                            com.secrets.entity.ProjectInvitation entity = invitationEntity.get();
                            invitationService.acceptInvitation(
                                entity.getToken(), 
                                savedUser.getId()
                            );
                            log.info("Auto-accepted invitation for user {} to project {}", 
                                email, invitation.getProjectId());
                        }
                    } catch (Exception e) {
                        log.warn("Failed to auto-accept invitation for user {}: {}", email, e.getMessage());
                        // Continue with other invitations
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch/accept invitations for new user: {}", e.getMessage());
            }
            
            // Generate JWT tokens (auto-login)
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
            String accessToken = tokenProvider.generateToken(email, authorities);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(email);
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken.getToken());
            response.put("tokenType", "Bearer");
            response.put("expiresIn", expirationMs / 1000);
            response.put("pendingInvitations", pendingInvitations);
            response.put("userId", savedUser.getId().toString());
            
            log.info("User {} signed up successfully", email);
            return ResponseEntity.ok(response);
            
        } catch (FirebaseAuthException e) {
            log.error("Failed to create user in Firebase: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create account: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Unexpected error during signup", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Signup failed: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
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

