package com.secrets.service;

import com.secrets.entity.Secret;
import com.secrets.repository.SecretRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SecretExpirationService {

    private static final Logger log = LoggerFactory.getLogger(SecretExpirationService.class);

    private final SecretRepository secretRepository;

    public SecretExpirationService(SecretRepository secretRepository) {
        this.secretRepository = secretRepository;
    }

    /**
     * Set expiration date for a secret
     */
    @Transactional
    public Secret setExpiration(String secretKey, LocalDateTime expiresAt) {
        Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new com.secrets.exception.SecretNotFoundException(
                "Secret with key '" + secretKey + "' not found"));
        
        secret.setExpiresAt(expiresAt);
        secret.setExpired(false); // Reset expired flag if setting new expiration
        
        Secret updated = secretRepository.save(secret);
        log.info("Set expiration for secret '{}' to {}", secretKey, expiresAt);
        
        return updated;
    }

    /**
     * Remove expiration from a secret (make it never expire)
     */
    @Transactional
    public Secret removeExpiration(String secretKey) {
        Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new com.secrets.exception.SecretNotFoundException(
                "Secret with key '" + secretKey + "' not found"));
        
        secret.setExpiresAt(null);
        secret.setExpired(false);
        
        Secret updated = secretRepository.save(secret);
        log.info("Removed expiration for secret '{}'", secretKey);
        
        return updated;
    }

    /**
     * Mark expired secrets (scheduled task runs every hour)
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void markExpiredSecrets() {
        log.debug("Checking for expired secrets...");
        
        LocalDateTime now = LocalDateTime.now();
        List<Secret> expiredSecrets = secretRepository.findExpiredSecrets(now).stream()
            .filter(s -> !s.getExpired()) // Only mark those not already marked
            .toList();
        
        if (!expiredSecrets.isEmpty()) {
            expiredSecrets.forEach(secret -> {
                secret.setExpired(true);
                secretRepository.save(secret);
                log.info("Marked secret '{}' as expired (expired at: {})", 
                    secret.getSecretKey(), secret.getExpiresAt());
            });
            
            log.info("Marked {} secrets as expired", expiredSecrets.size());
        } else {
            log.debug("No expired secrets found");
        }
    }

    /**
     * Get all expired secrets (admin only) or expired secrets accessible to user
     */
    @Transactional(readOnly = true)
    public List<Secret> getExpiredSecrets(String username, boolean isAdmin) {
        LocalDateTime now = LocalDateTime.now();
        if (isAdmin) {
            return secretRepository.findExpiredSecrets(now);
        } else {
            return secretRepository.findExpiredSecretsForUser(username, now);
        }
    }

    /**
     * Get secrets expiring soon (within specified days)
     * Admin sees all, regular users see only their accessible secrets
     */
    @Transactional(readOnly = true)
    public List<Secret> getSecretsExpiringSoon(int days, String username, boolean isAdmin) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(days);
        
        if (isAdmin) {
            return secretRepository.findSecretsExpiringBetween(now, threshold);
        } else {
            return secretRepository.findSecretsExpiringBetweenForUser(username, now, threshold);
        }
    }
}

