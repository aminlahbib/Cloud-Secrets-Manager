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
     * Mark expired secrets (scheduled task runs every hour)
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void markExpiredSecrets() {
        log.debug("Checking for expired secrets...");

        LocalDateTime now = LocalDateTime.now();
        List<Secret> expiredSecrets = secretRepository.findExpiredSecrets(now).stream()
                .filter(s -> s.isExpired()) // Only get those that are expired
                .toList();

        if (!expiredSecrets.isEmpty()) {
            // In v3, expired is computed, not stored, so we just log
            expiredSecrets.forEach(secret -> {
                log.info("Secret '{}' is expired (expired at: {})",
                        secret.getSecretKey(), secret.getExpiresAt());
            });

            log.info("Found {} expired secrets", expiredSecrets.size());
        } else {
            log.debug("No expired secrets found");
        }
    }
}
