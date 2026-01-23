package com.secrets.notification.config;

import com.google.cloud.pubsub.v1.Subscriber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Health indicator for Pub/Sub subscriber.
 * Reports the status of the notification event subscriber.
 */
@Component
public class PubSubSubscriberHealthIndicator implements HealthIndicator {

    private final Optional<Subscriber> subscriber;
    private final String gcpProjectId;
    private final String subscriptionName;

    public PubSubSubscriberHealthIndicator(
            Optional<Subscriber> subscriber,
            @Value("${gcp.project-id:}") String gcpProjectId,
            @Value("${notifications.subscription-name:notifications-events-sub}") String subscriptionName) {
        this.subscriber = subscriber;
        this.gcpProjectId = gcpProjectId;
        this.subscriptionName = subscriptionName;
    }

    @Override
    public Health health() {
        if (gcpProjectId == null || gcpProjectId.isBlank()) {
            return Health.down()
                    .withDetail("status", "not_configured")
                    .withDetail("reason", "GCP_PROJECT_ID is not set")
                    .withDetail("impact", "Notification events will not be received. Subscriber did not start.")
                    .build();
        }

        if (subscriber.isEmpty()) {
            return Health.down()
                    .withDetail("status", "subscriber_not_initialized")
                    .withDetail("reason", "Subscriber bean was not created")
                    .withDetail("gcp_project_id", gcpProjectId)
                    .withDetail("subscription_name", subscriptionName)
                    .withDetail("impact", "Notification events will not be processed. Check Pub/Sub subscription configuration.")
                    .build();
        }

        // Check if subscriber is running
        boolean isRunning = subscriber.get().isRunning();
        
        if (!isRunning) {
            return Health.down()
                    .withDetail("status", "subscriber_not_running")
                    .withDetail("gcp_project_id", gcpProjectId)
                    .withDetail("subscription_name", subscriptionName)
                    .withDetail("impact", "Notification events are not being received. Subscriber may have failed to start.")
                    .build();
        }

        return Health.up()
                .withDetail("status", "running")
                .withDetail("gcp_project_id", gcpProjectId)
                .withDetail("subscription_name", subscriptionName)
                .withDetail("subscriber", "active")
                .build();
    }
}

