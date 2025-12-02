package com.secrets.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Provider for generating and validating intermediate tokens used in 2FA login flow
 * These tokens are short-lived and used to bridge the gap between primary auth and 2FA verification
 */
@Component
public class IntermediateTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(IntermediateTokenProvider.class);

    private final SecretKey secretKey;
    private final long validityInMs;

    public IntermediateTokenProvider(
            @Value("${security.jwt.secret}") String jwtSecret,
            @Value("${two-factor.intermediate-token.expiry-ms:300000}") long validityInMs) {
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.validityInMs = validityInMs;
    }

    /**
     * Generate an intermediate token for 2FA verification
     * 
     * @param userId User's UUID
     * @param email User's email
     * @return Intermediate token JWT
     */
    public String generateToken(UUID userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityInMs);

        return Jwts.builder()
            .subject(email)
            .claim("userId", userId.toString())
            .claim("requiresTwoFactor", true)
            .claim("type", "intermediate")
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
    }

    /**
     * Extract user ID from intermediate token
     */
    public UUID getUserId(String token) {
        Claims claims = getClaims(token);
        String userIdStr = claims.get("userId", String.class);
        if (userIdStr == null) {
            throw new IllegalArgumentException("Token does not contain userId claim");
        }
        return UUID.fromString(userIdStr);
    }

    /**
     * Extract email from intermediate token
     */
    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Validate intermediate token
     * 
     * @param token Token to validate
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = getClaims(token);
            
            // Verify it's an intermediate token
            String type = claims.get("type", String.class);
            if (!"intermediate".equals(type)) {
                log.warn("Token is not an intermediate token");
                return false;
            }

            // Verify it requires 2FA
            Boolean requiresTwoFactor = claims.get("requiresTwoFactor", Boolean.class);
            if (requiresTwoFactor == null || !requiresTwoFactor) {
                log.warn("Token does not require 2FA");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Invalid intermediate token: {}", e.getMessage());
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}

