package com.secrets.service;

import com.secrets.entity.RefreshToken;
import com.secrets.exception.TokenRefreshException;
import com.secrets.repository.RefreshTokenRepository;
import com.secrets.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${security.jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshTokenExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JwtTokenProvider jwtTokenProvider) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Create a new refresh token for a user
     * Handles race conditions where duplicate tokens might be generated
     */
    @Transactional
    public RefreshToken createRefreshToken(String username) {
        // Revoke all existing refresh tokens for this user (token rotation)
        refreshTokenRepository.revokeAllUserTokens(username);

        // Retry logic to handle potential duplicate token collisions
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Generate a new refresh token (includes unique JWT ID to prevent collisions)
                String token = jwtTokenProvider.generateRefreshToken(username, refreshTokenExpirationMs);
                LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000);

                RefreshToken refreshToken = RefreshToken.builder()
                    .token(token)
                    .username(username)
                    .expiresAt(expiresAt)
                    .revoked(false)
                    .build();

                RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
                log.debug("Created refresh token for user: {}", username);
                return savedToken;
            } catch (DataIntegrityViolationException e) {
                // Duplicate token detected (should be rare with UUID in JWT ID)
                if (attempt < maxRetries - 1) {
                    log.warn("Duplicate refresh token detected for user {}, retrying (attempt {}/{})", 
                        username, attempt + 1, maxRetries);
                    // Small delay before retry
                    try {
                        Thread.sleep(10 + (attempt * 5)); // 10ms, 15ms, 20ms delays
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted while retrying token creation", ie);
                    }
                } else {
                    log.error("Failed to create unique refresh token for user {} after {} attempts", 
                        username, maxRetries);
                    throw new RuntimeException("Failed to create unique refresh token after multiple attempts", e);
                }
            }
        }
        
        // Should never reach here, but compiler requires return
        throw new RuntimeException("Failed to create refresh token");
    }

    /**
     * Validate and return a refresh token
     */
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
            .orElseThrow(() -> new TokenRefreshException("Refresh token not found"));
    }

    /**
     * Verify that a refresh token is valid
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (!token.isValid()) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException("Refresh token was expired or revoked. Please make a new signin request");
        }
        return token;
    }

    /**
     * Revoke a refresh token
     */
    @Transactional
    public void revokeToken(String token) {
        refreshTokenRepository.revokeToken(token);
        log.debug("Revoked refresh token");
    }

    /**
     * Revoke all refresh tokens for a user
     */
    @Transactional
    public void revokeAllUserTokens(String username) {
        refreshTokenRepository.revokeAllUserTokens(username);
        log.debug("Revoked all refresh tokens for user: {}", username);
    }

    /**
     * Generate a new access token from a refresh token
     */
    public String generateNewAccessToken(RefreshToken refreshToken, Collection<? extends GrantedAuthority> authorities) {
        verifyExpiration(refreshToken);
        return jwtTokenProvider.generateToken(refreshToken.getUsername(), authorities);
    }

    /**
     * Clean up expired tokens (should be called periodically)
     */
    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.debug("Deleted expired refresh tokens");
    }
}

