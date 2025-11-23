package com.secrets.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Token Blacklist Service using Redis
 * 
 * Manages revoked JWT tokens to prevent their use after logout or compromise.
 * Tokens are stored in Redis with TTL matching their expiration time.
 * 
 * Key Schema:
 * - blacklist:token:{jti} -> {userId}
 * - blacklist:user:{userId} -> Set<jti>
 * 
 * @author Cloud Secrets Manager Team
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    
    private static final String BLACKLIST_TOKEN_PREFIX = "blacklist:token:";
    private static final String BLACKLIST_USER_PREFIX = "blacklist:user:";
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    /**
     * Blacklist a token
     * 
     * @param jti JWT ID (unique token identifier)
     * @param userId User ID who owns the token
     * @param expiresInSeconds Time until token naturally expires
     */
    public void blacklistToken(String jti, String userId, long expiresInSeconds) {
        if (jti == null || jti.isEmpty()) {
            log.warn("Attempted to blacklist token with null/empty JTI");
            return;
        }
        
        try {
            String tokenKey = BLACKLIST_TOKEN_PREFIX + jti;
            String userKey = BLACKLIST_USER_PREFIX + userId;
            
            // Store token -> userId mapping with TTL
            redisTemplate.opsForValue().set(tokenKey, userId, expiresInSeconds, TimeUnit.SECONDS);
            
            // Add token to user's blacklist set with TTL
            redisTemplate.opsForSet().add(userKey, jti);
            redisTemplate.expire(userKey, expiresInSeconds, TimeUnit.SECONDS);
            
            log.info("Token blacklisted successfully - JTI: {}, User: {}, TTL: {}s", 
                     jti, userId, expiresInSeconds);
        } catch (Exception e) {
            log.error("Failed to blacklist token - JTI: {}, User: {}", jti, userId, e);
            throw new RuntimeException("Failed to blacklist token", e);
        }
    }
    
    /**
     * Check if a token is blacklisted
     * 
     * @param jti JWT ID to check
     * @return true if token is blacklisted, false otherwise
     */
    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isEmpty()) {
            return false;
        }
        
        try {
            String tokenKey = BLACKLIST_TOKEN_PREFIX + jti;
            Boolean exists = redisTemplate.hasKey(tokenKey);
            
            if (Boolean.TRUE.equals(exists)) {
                log.debug("Token is blacklisted - JTI: {}", jti);
                return true;
            }
            
            return false;
        } catch (Exception e) {
            log.error("Failed to check token blacklist status - JTI: {}", jti, e);
            // Fail secure: if we can't check, treat as blacklisted
            return true;
        }
    }
    
    /**
     * Blacklist all tokens for a user
     * Useful for "logout from all devices" functionality
     * 
     * @param userId User ID
     * @param maxTokenLifetimeSeconds Maximum token lifetime for TTL
     */
    public void blacklistAllUserTokens(String userId, long maxTokenLifetimeSeconds) {
        if (userId == null || userId.isEmpty()) {
            log.warn("Attempted to blacklist tokens for null/empty userId");
            return;
        }
        
        try {
            String userKey = BLACKLIST_USER_PREFIX + userId;
            
            // Get all tokens for this user
            Set<String> tokens = redisTemplate.opsForSet().members(userKey);
            
            if (tokens != null && !tokens.isEmpty()) {
                log.info("Blacklisting {} tokens for user: {}", tokens.size(), userId);
                
                for (String jti : tokens) {
                    String tokenKey = BLACKLIST_TOKEN_PREFIX + jti;
                    redisTemplate.opsForValue().set(tokenKey, userId, 
                                                    maxTokenLifetimeSeconds, TimeUnit.SECONDS);
                }
            }
            
            // Set user blacklist marker
            String userBlacklistKey = BLACKLIST_USER_PREFIX + userId + ":all";
            redisTemplate.opsForValue().set(userBlacklistKey, "true", 
                                           maxTokenLifetimeSeconds, TimeUnit.SECONDS);
            
            log.info("All tokens blacklisted for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to blacklist all tokens for user: {}", userId, e);
            throw new RuntimeException("Failed to blacklist user tokens", e);
        }
    }
    
    /**
     * Check if all tokens for a user are blacklisted
     * 
     * @param userId User ID
     * @return true if all user tokens are blacklisted
     */
    public boolean isUserBlacklisted(String userId) {
        if (userId == null || userId.isEmpty()) {
            return false;
        }
        
        try {
            String userBlacklistKey = BLACKLIST_USER_PREFIX + userId + ":all";
            Boolean exists = redisTemplate.hasKey(userBlacklistKey);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Failed to check user blacklist status - User: {}", userId, e);
            // Fail secure
            return true;
        }
    }
    
    /**
     * Remove a token from blacklist (if needed for testing or edge cases)
     * 
     * @param jti JWT ID
     */
    public void removeFromBlacklist(String jti) {
        if (jti == null || jti.isEmpty()) {
            return;
        }
        
        try {
            String tokenKey = BLACKLIST_TOKEN_PREFIX + jti;
            String userId = redisTemplate.opsForValue().get(tokenKey);
            
            // Remove token key
            redisTemplate.delete(tokenKey);
            
            // Remove from user's set if we know the user
            if (userId != null) {
                String userKey = BLACKLIST_USER_PREFIX + userId;
                redisTemplate.opsForSet().remove(userKey, jti);
            }
            
            log.info("Token removed from blacklist - JTI: {}", jti);
        } catch (Exception e) {
            log.error("Failed to remove token from blacklist - JTI: {}", jti, e);
        }
    }
    
    /**
     * Get blacklist statistics for monitoring
     * 
     * @return BlacklistStats object with current statistics
     */
    public BlacklistStats getStatistics() {
        try {
            Set<String> tokenKeys = redisTemplate.keys(BLACKLIST_TOKEN_PREFIX + "*");
            Set<String> userKeys = redisTemplate.keys(BLACKLIST_USER_PREFIX + "*");
            
            long tokenCount = tokenKeys != null ? tokenKeys.size() : 0;
            long userCount = userKeys != null ? userKeys.size() : 0;
            
            return new BlacklistStats(tokenCount, userCount);
        } catch (Exception e) {
            log.error("Failed to get blacklist statistics", e);
            return new BlacklistStats(0, 0);
        }
    }
    
    /**
     * Blacklist statistics
     */
    public static class BlacklistStats {
        private final long blacklistedTokenCount;
        private final long affectedUserCount;
        
        public BlacklistStats(long tokenCount, long userCount) {
            this.blacklistedTokenCount = tokenCount;
            this.affectedUserCount = userCount;
        }
        
        public long getBlacklistedTokenCount() {
            return blacklistedTokenCount;
        }
        
        public long getAffectedUserCount() {
            return affectedUserCount;
        }
    }
}

