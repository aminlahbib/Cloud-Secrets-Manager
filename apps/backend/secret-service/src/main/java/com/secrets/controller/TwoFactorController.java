package com.secrets.controller;

import com.secrets.client.AuditClient;
import com.secrets.dto.twofactor.*;
import com.secrets.entity.User;
import com.secrets.security.IntermediateTokenProvider;
import com.secrets.security.JwtTokenProvider;
import com.secrets.service.RefreshTokenService;
import com.secrets.service.TwoFactorService;
import com.secrets.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/auth/2fa")
@Tag(name = "Two-Factor Authentication", description = "TOTP-based two-factor authentication")
public class TwoFactorController {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorController.class);

    private final TwoFactorService twoFactorService;
    private final UserService userService;
    private final IntermediateTokenProvider intermediateTokenProvider;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final AuditClient auditClient;

    // Simple in-memory rate limiting for 2FA endpoints
    private final Map<String, RateLimitInfo> rateLimitCache = new ConcurrentHashMap<>();
    private final int totpRateLimit;
    private final int totpWindowMinutes;

    @Value("${security.jwt.expiration-ms:900000}")
    private long expirationMs;

    public TwoFactorController(
            TwoFactorService twoFactorService,
            UserService userService,
            IntermediateTokenProvider intermediateTokenProvider,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            AuditClient auditClient,
            @Value("${two-factor.rate-limit.totp-attempts:5}") int totpRateLimit,
            @Value("${two-factor.rate-limit.totp-window-minutes:5}") int totpWindowMinutes) {
        this.twoFactorService = twoFactorService;
        this.userService = userService;
        this.intermediateTokenProvider = intermediateTokenProvider;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.auditClient = auditClient;
        this.totpRateLimit = totpRateLimit;
        this.totpWindowMinutes = totpWindowMinutes;
    }

    @PostMapping("/totp/start")
    @Operation(summary = "Start TOTP setup", description = "Generates a TOTP secret and QR code for setup")
    public ResponseEntity<?> startTotpSetup(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            UUID userId = userService.getCurrentUserId(userDetails.getUsername());
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Two-factor authentication is already enabled"));
            }

            // Generate new secret
            String secret = twoFactorService.generateSecret();
            String otpauthUrl = twoFactorService.generateOtpauthUrl(user.getEmail(), secret);
            String qrCodeDataUrl = twoFactorService.generateQrCodeDataUrl(otpauthUrl);

            // Store as pending secret
            user.setPendingTwoFactorSecret(secret);
            user.setPendingTwoFactorCreatedAt(LocalDateTime.now());
            userService.updateUser(user);

            TotpStartResponse response = new TotpStartResponse();
            response.setQrCodeDataUrl(qrCodeDataUrl);
            response.setManualSecret(secret);
            response.setOtpauthUrl(otpauthUrl);

            log.info("TOTP setup started for user: {}", user.getEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to start TOTP setup", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to start TOTP setup: " + e.getMessage()));
        }
    }

    @PostMapping("/totp/confirm")
    @Operation(summary = "Confirm TOTP setup", description = "Verifies the TOTP code and enables 2FA")
    public ResponseEntity<?> confirmTotpSetup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TotpConfirmRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            UUID userId = userService.getCurrentUserId(userDetails.getUsername());
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            if (user.getPendingTwoFactorSecret() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No pending TOTP setup found. Please start setup first."));
            }

            // Verify code against pending secret
            if (!twoFactorService.verifyTotpCode(user.getPendingTwoFactorSecret(), request.getCode())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid code. Please try again."));
            }

            // Generate recovery codes
            List<String> recoveryCodes = twoFactorService.generateRecoveryCodes();
            List<String> hashedCodes = twoFactorService.hashRecoveryCodes(recoveryCodes);

            // Enable 2FA
            String encryptedSecret = twoFactorService.encryptSecret(user.getPendingTwoFactorSecret());
            user.setTwoFactorEnabled(true);
            user.setTwoFactorType("TOTP");
            user.setTwoFactorSecret(encryptedSecret);
            user.setTwoFactorRecoveryCodes(hashedCodes);
            user.setTwoFactorEnabledAt(LocalDateTime.now());
            user.setPendingTwoFactorSecret(null);
            user.setPendingTwoFactorCreatedAt(null);
            userService.updateUser(user);

            TotpConfirmResponse response = new TotpConfirmResponse();
            response.setTwoFactorEnabled(true);
            response.setRecoveryCodes(recoveryCodes);

            // Log audit event
            auditClient.logEvent(
                    null, // No project for user-level events
                    userId,
                    "TWO_FACTOR_ENABLED",
                    "USER",
                    userId.toString(),
                    user.getEmail(),
                    Map.of("type", "TOTP")
            );

            log.info("TOTP 2FA enabled for user: {}", user.getEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to confirm TOTP setup", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to confirm TOTP setup: " + e.getMessage()));
        }
    }

    @PostMapping("/totp/verify-login")
    @Operation(summary = "Verify TOTP during login", description = "Completes login by verifying TOTP code or recovery code")
    public ResponseEntity<?> verifyLogin(@Valid @RequestBody TotpVerifyLoginRequest request) {
        // Rate limiting
        String rateLimitKey = "verify-login:" + request.getIntermediateToken();
        if (!checkRateLimit(rateLimitKey, totpRateLimit, totpWindowMinutes)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many attempts. Please try again later."));
        }

        try {
            // Validate intermediate token
            if (!intermediateTokenProvider.validateToken(request.getIntermediateToken())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid or expired intermediate token"));
            }

            UUID userId = intermediateTokenProvider.getUserId(request.getIntermediateToken());
            String email = intermediateTokenProvider.getEmail(request.getIntermediateToken());

            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Two-factor authentication is not enabled for this user"));
            }

            boolean verified = false;

            // Check if it's a recovery code
            if (twoFactorService.isRecoveryCodeFormat(request.getCode())) {
                List<String> recoveryCodes = user.getTwoFactorRecoveryCodes();
                if (recoveryCodes != null && !recoveryCodes.isEmpty()) {
                    int codeIndex = twoFactorService.verifyRecoveryCode(request.getCode(), recoveryCodes);
                    if (codeIndex >= 0) {
                        // Remove used recovery code
                        recoveryCodes.remove(codeIndex);
                        user.setTwoFactorRecoveryCodes(recoveryCodes);
                        userService.updateUser(user);
                        verified = true;
                        
                        // Log recovery code usage
                        auditClient.logEvent(
                                null,
                                userId,
                                "RECOVERY_CODE_USED",
                                "USER",
                                userId.toString(),
                                email,
                                null
                        );
                        
                        log.info("Recovery code used for user: {}", email);
                    }
                }
            } else if (twoFactorService.isTotpCodeFormat(request.getCode())) {
                // Verify TOTP code
                String decryptedSecret = twoFactorService.decryptSecret(user.getTwoFactorSecret());
                if (twoFactorService.verifyTotpCode(decryptedSecret, request.getCode())) {
                    verified = true;
                    user.setTwoFactorLastVerifiedAt(LocalDateTime.now());
                    userService.updateUser(user);
                }
            }

            if (!verified) {
                // Log failed verification attempt
                auditClient.logEvent(
                        null,
                        userId,
                        "TWO_FACTOR_VERIFICATION_FAILED",
                        "USER",
                        userId.toString(),
                        email,
                        Map.of("reason", "Invalid code")
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid code"));
            }

            // Log successful verification
            String verificationMethod = twoFactorService.isRecoveryCodeFormat(request.getCode()) 
                    ? "RECOVERY_CODE" : "TOTP";
            auditClient.logEvent(
                    null,
                    userId,
                    "TWO_FACTOR_VERIFIED",
                    "USER",
                    userId.toString(),
                    email,
                    Map.of("method", verificationMethod)
            );

            // Generate full access and refresh tokens
            List<GrantedAuthority> authorities = List.of(
                    new org.springframework.security.core.authority.SimpleGrantedAuthority(
                            "ROLE_" + user.getPlatformRole().name())
            );

            String accessToken = jwtTokenProvider.generateToken(email, authorities);
            com.secrets.entity.RefreshToken refreshToken = refreshTokenService.createRefreshToken(email);

            com.secrets.dto.TokenResponse response = com.secrets.dto.TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .tokenType("Bearer")
                    .expiresIn(expirationMs / 1000)
                    .requiresTwoFactor(false)
                    .build();

            log.info("2FA verified successfully for user: {}", email);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to verify 2FA during login", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to verify code: " + e.getMessage()));
        }
    }

    @PostMapping("/disable")
    @Operation(summary = "Disable 2FA", description = "Disables two-factor authentication after verifying code")
    public ResponseEntity<?> disableTwoFactor(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorDisableRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Rate limiting
        String rateLimitKey = "disable:" + userDetails.getUsername();
        if (!checkRateLimit(rateLimitKey, totpRateLimit, totpWindowMinutes)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many attempts. Please try again later."));
        }

        try {
            UUID userId = userService.getCurrentUserId(userDetails.getUsername());
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Two-factor authentication is not enabled"));
            }

            boolean verified = false;

            // Check if it's a recovery code
            if (twoFactorService.isRecoveryCodeFormat(request.getCode())) {
                List<String> recoveryCodes = user.getTwoFactorRecoveryCodes();
                if (recoveryCodes != null && !recoveryCodes.isEmpty()) {
                    int codeIndex = twoFactorService.verifyRecoveryCode(request.getCode(), recoveryCodes);
                    if (codeIndex >= 0) {
                        verified = true;
                    }
                }
            } else if (twoFactorService.isTotpCodeFormat(request.getCode())) {
                // Verify TOTP code
                String decryptedSecret = twoFactorService.decryptSecret(user.getTwoFactorSecret());
                if (twoFactorService.verifyTotpCode(decryptedSecret, request.getCode())) {
                    verified = true;
                }
            }

            if (!verified) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid code"));
            }

            // Disable 2FA
            user.setTwoFactorEnabled(false);
            user.setTwoFactorType(null);
            user.setTwoFactorSecret(null);
            user.setTwoFactorRecoveryCodes(null);
            user.setTwoFactorEnabledAt(null);
            user.setTwoFactorLastVerifiedAt(null);
            userService.updateUser(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Two-factor authentication has been disabled");
            response.put("twoFactorEnabled", false);

            // Log audit event
            auditClient.logEvent(
                    null,
                    userId,
                    "TWO_FACTOR_DISABLED",
                    "USER",
                    userId.toString(),
                    user.getEmail(),
                    null
            );

            log.info("2FA disabled for user: {}", user.getEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to disable 2FA", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to disable 2FA: " + e.getMessage()));
        }
    }

    @PostMapping("/recovery-codes/regenerate")
    @Operation(summary = "Regenerate recovery codes", description = "Generates new recovery codes, invalidating old ones")
    public ResponseEntity<?> regenerateRecoveryCodes(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            UUID userId = userService.getCurrentUserId(userDetails.getUsername());
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Two-factor authentication is not enabled"));
            }

            // Generate new recovery codes
            List<String> recoveryCodes = twoFactorService.generateRecoveryCodes();
            List<String> hashedCodes = twoFactorService.hashRecoveryCodes(recoveryCodes);

            user.setTwoFactorRecoveryCodes(hashedCodes);
            userService.updateUser(user);

            RecoveryCodesResponse response = new RecoveryCodesResponse();
            response.setRecoveryCodes(recoveryCodes);

            // Log audit event
            auditClient.logEvent(
                    null,
                    userId,
                    "RECOVERY_CODES_REGENERATED",
                    "USER",
                    userId.toString(),
                    user.getEmail(),
                    null
            );

            log.info("Recovery codes regenerated for user: {}", user.getEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to regenerate recovery codes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to regenerate recovery codes: " + e.getMessage()));
        }
    }

    private boolean checkRateLimit(String key, int limit, int windowMinutes) {
        long windowMs = windowMinutes * 60_000L;
        long now = System.currentTimeMillis();

        RateLimitInfo info = rateLimitCache.computeIfAbsent(key, k -> new RateLimitInfo(windowMs));

        // Reset if window expired
        if (now - info.windowStart > windowMs) {
            info.count.set(0);
            info.windowStart = now;
        }

        int currentCount = info.count.incrementAndGet();
        return currentCount <= limit;
    }

    private static class RateLimitInfo {
        final AtomicInteger count = new AtomicInteger(0);
        long windowStart = System.currentTimeMillis();

        RateLimitInfo(long windowMs) {
            // windowMs is used in checkRateLimit method via parameter
        }
    }
}

