package com.secrets.controller;

import com.secrets.security.TokenBlacklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Token Revocation API Controller
 * 
 * Provides endpoints for revoking JWT tokens:
 * - Revoke current token (logout)
 * - Revoke specific token by JTI
 * - Revoke all tokens for current user (logout from all devices)
 * - Revoke all tokens for any user (admin only)
 * 
 * @author Cloud Secrets Manager Team
 */
@RestController
@RequestMapping("/api/v1/auth/tokens")
@Tag(name = "Token Management", description = "Token revocation and management APIs")
@SecurityRequirement(name = "bearer-auth")
public class TokenRevocationController {

    private static final Logger log = LoggerFactory.getLogger(TokenRevocationController.class);
    
    @Autowired
    private TokenBlacklistService tokenBlacklistService;
    
    // Default token lifetime for TTL (24 hours)
    private static final long DEFAULT_TOKEN_TTL_SECONDS = 24 * 60 * 60;
    
    /**
     * Revoke current token (logout)
     * 
     * @param userDetails Authenticated user
     * @param jti JWT ID from request header
     * @return Success response
     */
    @PostMapping("/revoke")
    @Operation(summary = "Revoke current token", 
               description = "Logout by revoking the current JWT token")
    public ResponseEntity<Map<String, String>> revokeCurrentToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "X-Token-JTI", required = false) String jti) {
        
        if (jti == null || jti.isEmpty()) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Token JTI not provided in header")
            );
        }
        
        String userId = userDetails.getUsername();
        
        try {
            tokenBlacklistService.blacklistToken(jti, userId, DEFAULT_TOKEN_TTL_SECONDS);
            
            log.info("Token revoked successfully - User: {}, JTI: {}", userId, jti);
            
            return ResponseEntity.ok(Map.of(
                "message", "Token revoked successfully",
                "jti", jti
            ));
        } catch (Exception e) {
            log.error("Failed to revoke token - User: {}, JTI: {}", userId, jti, e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to revoke token")
            );
        }
    }
    
    /**
     * Revoke specific token by JTI (self-service or admin)
     * 
     * @param jti JWT ID to revoke
     * @param userDetails Authenticated user
     * @return Success response
     */
    @DeleteMapping("/{jti}")
    @Operation(summary = "Revoke specific token by JTI",
               description = "Revoke a specific token. Users can revoke their own tokens, admins can revoke any token.")
    public ResponseEntity<Map<String, String>> revokeToken(
            @PathVariable String jti,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        String userId = userDetails.getUsername();
        
        try {
            tokenBlacklistService.blacklistToken(jti, userId, DEFAULT_TOKEN_TTL_SECONDS);
            
            log.info("Token revoked by user - User: {}, JTI: {}", userId, jti);
            
            return ResponseEntity.ok(Map.of(
                "message", "Token revoked successfully",
                "jti", jti
            ));
        } catch (Exception e) {
            log.error("Failed to revoke token - User: {}, JTI: {}", userId, jti, e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to revoke token")
            );
        }
    }
    
    /**
     * Revoke all tokens for current user (logout from all devices)
     * 
     * @param userDetails Authenticated user
     * @return Success response
     */
    @PostMapping("/revoke-all")
    @Operation(summary = "Revoke all tokens for current user",
               description = "Logout from all devices by revoking all JWT tokens for the current user")
    public ResponseEntity<Map<String, String>> revokeAllUserTokens(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        String userId = userDetails.getUsername();
        
        try {
            tokenBlacklistService.blacklistAllUserTokens(userId, DEFAULT_TOKEN_TTL_SECONDS);
            
            log.info("All tokens revoked for user: {}", userId);
            
            return ResponseEntity.ok(Map.of(
                "message", "All tokens revoked successfully",
                "userId", userId
            ));
        } catch (Exception e) {
            log.error("Failed to revoke all tokens for user: {}", userId, e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to revoke all tokens")
            );
        }
    }
    
    /**
     * Revoke all tokens for any user (admin only)
     * 
     * @param userId User ID to revoke tokens for
     * @param userDetails Authenticated admin
     * @return Success response
     */
    @PostMapping("/admin/revoke-user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Revoke all tokens for specific user (admin)",
               description = "Admin endpoint to revoke all tokens for any user")
    public ResponseEntity<Map<String, String>> revokeUserTokens(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        String adminId = userDetails.getUsername();
        
        try {
            tokenBlacklistService.blacklistAllUserTokens(userId, DEFAULT_TOKEN_TTL_SECONDS);
            
            log.warn("Admin revoked all tokens for user - Admin: {}, Target: {}", adminId, userId);
            
            return ResponseEntity.ok(Map.of(
                "message", "All tokens revoked for user",
                "userId", userId,
                "revokedBy", adminId
            ));
        } catch (Exception e) {
            log.error("Failed to revoke tokens for user - Admin: {}, Target: {}", adminId, userId, e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to revoke tokens")
            );
        }
    }
    
    /**
     * Get blacklist statistics (admin only)
     * 
     * @return Blacklist statistics
     */
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get token blacklist statistics",
               description = "Admin endpoint to view blacklist statistics")
    public ResponseEntity<TokenBlacklistService.BlacklistStats> getBlacklistStats() {
        try {
            TokenBlacklistService.BlacklistStats stats = tokenBlacklistService.getStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to get blacklist statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

