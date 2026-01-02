package com.secrets.notification.config;

import com.google.api.gax.core.InstantiatingExecutorProvider;
import com.google.api.gax.rpc.ApiException;
import com.google.cloud.pubsub.v1.Subscriber;
import com.google.pubsub.v1.ProjectSubscriptionName;
import com.secrets.notification.subscriber.NotificationEventMessageReceiver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures a Pub/Sub subscriber for notification events.
 *
 * This service runs as a long-lived consumer of the notifications-events
 * subscription and forwards messages to NotificationEventMessageReceiver.
 */
@Configuration
public class NotificationSubscriberConfig implements DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(NotificationSubscriberConfig.class);

    @Value("${gcp.project-id:}")
    private String gcpProjectId;

    @Value("${notifications.subscription-name:notifications-events-sub}")
    private String subscriptionName;

    private Subscriber subscriber;

    @Bean
    public Subscriber notificationSubscriber(NotificationEventMessageReceiver messageReceiver) {
        if (gcpProjectId == null || gcpProjectId.isBlank()) {
            log.warn("GCP project id is not configured. Notification subscriber will not start.");
            return null;
        }

        ProjectSubscriptionName subName =
                ProjectSubscriptionName.of(gcpProjectId, subscriptionName);

        try {
            this.subscriber = Subscriber.newBuilder(subName, messageReceiver)
                    .setExecutorProvider(
                            InstantiatingExecutorProvider.newBuilder()
                                    .setExecutorThreadCount(4)
                                    .build()
                    )
                    .build();
            this.subscriber.startAsync().awaitRunning();
            log.info("Started Pub/Sub subscriber for {}", subName.toString());
        } catch (ApiException ex) {
            log.error("Failed to start Pub/Sub subscriber for {}: {}", subName, ex.getMessage(), ex);
        }

        return this.subscriber;
    }

    @Override
    public void destroy() {
        if (subscriber != null) {
            log.info("Stopping Pub/Sub notification subscriber");
            subscriber.stopAsync();
        }
    }
}


