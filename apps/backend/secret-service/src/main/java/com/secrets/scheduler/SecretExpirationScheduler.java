package com.secrets.scheduler;

import com.secrets.entity.Project;
import com.secrets.entity.Secret;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.SecretRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled tasks for secret expiration notifications
 */
@Component
public class SecretExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SecretExpirationScheduler.class);
    private static final int WARNING_DAYS = 7; // Send warning 7 days before expiration

    private final SecretRepository secretRepository;
    private final ProjectRepository projectRepository;

    public SecretExpirationScheduler(SecretRepository secretRepository,
            ProjectRepository projectRepository) {
        this.secretRepository = secretRepository;
        this.projectRepository = projectRepository;
    }

    /**
     * Check for expiring secrets and send warnings
     * Runs daily at 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendExpirationWarnings() {
        log.info("Starting secret expiration check...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(WARNING_DAYS);

        // Find secrets expiring within the warning period
        List<Secret> expiringSoon = secretRepository.findSecretsExpiringBetween(now, threshold);

        if (expiringSoon.isEmpty()) {
            log.info("No secrets expiring in the next {} days", WARNING_DAYS);
            return;
        }

        log.info("Found {} secrets expiring in the next {} days", expiringSoon.size(), WARNING_DAYS);

        for (Secret secret : expiringSoon) {
            try {
                // Get project name
                Project project = projectRepository.findById(secret.getProjectId()).orElse(null);
                if (project == null) {
                    log.warn("Project not found for secret {}, skipping notification", secret.getSecretKey());
                    continue;
                }

                // Note: Expiration notifications removed - only invitation notifications are supported
                log.debug("Secret {} in project {} is expiring soon (expiration notifications disabled)", 
                        secret.getSecretKey(), project.getName());
            } catch (Exception e) {
                log.error("Error processing expiration for secret {}: {}",
                        secret.getSecretKey(), e.getMessage());
            }
        }
        log.info("Expiration check complete.");
    }
}
