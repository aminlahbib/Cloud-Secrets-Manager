package com.secrets.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Health indicator for email service.
 * Reports the status of email notification configuration.
 */
@Component
public class EmailServiceHealthIndicator implements HealthIndicator {

    private final boolean emailEnabled;
    private final String sendGridApiKey;
    private final String fromAddress;

    public EmailServiceHealthIndicator(
            @Value("${email.enabled:true}") boolean emailEnabled,
            @Value("${email.sendgrid.api-key:}") String sendGridApiKey,
            @Value("${email.from.address:noreply@cloudsecrets.com}") String fromAddress) {
        this.emailEnabled = emailEnabled;
        this.sendGridApiKey = sendGridApiKey;
        this.fromAddress = fromAddress;
    }

    @Override
    public Health health() {
        if (!emailEnabled) {
            return Health.down()
                    .withDetail("status", "disabled")
                    .withDetail("reason", "EMAIL_ENABLED is set to false")
                    .withDetail("impact", "Email notifications will not be sent.")
                    .build();
        }

        if (sendGridApiKey == null || sendGridApiKey.isBlank()) {
            return Health.down()
                    .withDetail("status", "not_configured")
                    .withDetail("reason", "SENDGRID_API_KEY is not set")
                    .withDetail("from_address", fromAddress)
                    .withDetail("impact", "Email notifications will fail. Emails are queued but not sent.")
                    .build();
        }

        // Check if API key looks valid (SendGrid API keys start with "SG.")
        if (!sendGridApiKey.startsWith("SG.") && sendGridApiKey.length() < 20) {
            return Health.down()
                    .withDetail("status", "invalid_api_key")
                    .withDetail("reason", "SENDGRID_API_KEY does not appear to be valid")
                    .withDetail("from_address", fromAddress)
                    .withDetail("impact", "Email notifications will fail. Check SendGrid API key format.")
                    .build();
        }

        return Health.up()
                .withDetail("status", "configured")
                .withDetail("provider", "sendgrid")
                .withDetail("from_address", fromAddress)
                .withDetail("api_key_configured", true)
                .build();
    }
}

