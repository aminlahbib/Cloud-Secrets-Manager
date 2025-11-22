package com.secrets.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long validityInMs;

    public JwtTokenProvider(
            @Value("${security.jwt.secret}") String jwtSecret,
            @Value("${security.jwt.expiration-ms:900000}") long validityInMs) {
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.validityInMs = validityInMs;
    }

    public String generateToken(String username, java.util.Collection<? extends GrantedAuthority> authorities) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityInMs);

        String roles = authorities.stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

        return Jwts.builder()
            .subject(username)
            .claim("roles", roles)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
    }

    /**
     * Generate a refresh token (longer-lived token for obtaining new access tokens)
     * Refresh tokens are stored in the database and can be revoked
     * Note: The actual expiration is managed in the database, this JWT just needs to be valid
     */
    public String generateRefreshToken(String username, long refreshTokenExpirationMs) {
        Date now = new Date();
        // Refresh tokens have longer expiration (configured separately)
        // This is just the JWT part - actual expiration is managed in database
        Date expiry = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
            .subject(username)
            .claim("type", "refresh")
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public java.util.Collection<? extends GrantedAuthority> getAuthorities(String token) {
        Claims claims = getClaims(token);
        String roles = claims.get("roles", String.class);
        
        if (roles == null || roles.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        return Arrays.stream(roles.split(","))
            .map(String::trim)
            .map(SimpleGrantedAuthority::new)
            .collect(java.util.stream.Collectors.toList());
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT token: {}", e.getMessage());
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

