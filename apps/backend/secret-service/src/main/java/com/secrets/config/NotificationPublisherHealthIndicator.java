package com.secrets.config;

import com.google.cloud.pubsub.v1.Publisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Health indicator for notification event publisher.
 * Reports the status of the Pub/Sub publisher configuration.
 */
@Component
public class NotificationPublisherHealthIndicator implements HealthIndicator {

    private final Optional<Publisher> publisher;
    private final String gcpProjectId;

    public NotificationPublisherHealthIndicator(Optional<Publisher> publisher,
                                                @Value("${gcp.project-id:}") String gcpProjectId) {
        this.publisher = publisher;
        this.gcpProjectId = gcpProjectId;
    }

    @Override
    public Health health() {
        if (gcpProjectId == null || gcpProjectId.isBlank()) {
            return Health.down()
                    .withDetail("status", "not_configured")
                    .withDetail("reason", "GCP_PROJECT_ID is not set")
                    .withDetail("impact", "Notification events will not be published. Events are silently skipped.")
                    .build();
        }

        if (publisher.isEmpty()) {
            return Health.down()
                    .withDetail("status", "publisher_not_initialized")
                    .withDetail("reason", "Publisher bean was not created")
                    .withDetail("gcp_project_id", gcpProjectId)
                    .withDetail("impact", "Notification events will not be published. Check Pub/Sub topic configuration.")
                    .build();
        }

        return Health.up()
                .withDetail("status", "configured")
                .withDetail("gcp_project_id", gcpProjectId)
                .withDetail("publisher", "initialized")
                .build();
    }
}

