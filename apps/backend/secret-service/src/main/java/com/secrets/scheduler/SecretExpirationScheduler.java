package com.secrets.scheduler;

import com.secrets.entity.Project;
import com.secrets.entity.Secret;
import com.secrets.entity.User;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.SecretRepository;
import com.secrets.repository.UserRepository;
import com.secrets.service.EmailService;
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
    private final UserRepository userRepository;
    private final EmailService emailService;

    public SecretExpirationScheduler(SecretRepository secretRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.secretRepository = secretRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
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

        int emailsSent = 0;
        int emailsFailed = 0;

        for (Secret secret : expiringSoon) {
            try {
                // Get project name
                Project project = projectRepository.findById(secret.getProjectId()).orElse(null);
                if (project == null) {
                    log.warn("Project not found for secret {}, skipping notification", secret.getSecretKey());
                    continue;
                }

                // Get secret owner
                User owner = userRepository.findById(secret.getCreatedBy()).orElse(null);
                if (owner == null) {
                    log.warn("Owner not found for secret {}, skipping notification", secret.getSecretKey());
                    continue;
                }

                // Send warning email
                emailService.sendExpirationWarning(
                        owner.getEmail(),
                        secret.getSecretKey(),
                        project.getName(),
                        secret.getExpiresAt());

                emailsSent++;
            } catch (Exception e) {
                log.error("Failed to send expiration warning for secret {}: {}",
                        secret.getSecretKey(), e.getMessage());
                emailsFailed++;
            }
        }

        log.info("Expiration check complete. Emails sent: {}, failed: {}", emailsSent, emailsFailed);
    }
}
