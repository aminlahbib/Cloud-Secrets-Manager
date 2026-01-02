package com.secrets.invite.config;

import com.google.cloud.pubsub.v1.Subscriber;
import com.google.cloud.pubsub.v1.SubscriberInterface;
import com.google.pubsub.v1.ProjectSubscriptionName;
import com.secrets.invite.subscriber.InviteEventMessageReceiver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures Pub/Sub subscriber for invitation events.
 */
@Configuration
public class PubSubConfig implements DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(PubSubConfig.class);

    @Value("${gcp.project-id:}")
    private String gcpProjectId;

    @Value("${notifications.subscription-name:notifications-events-sub}")
    private String subscriptionName;

    private Subscriber subscriber;

    @Bean
    public SubscriberInterface inviteSubscriber(InviteEventMessageReceiver messageReceiver) {
        if (gcpProjectId == null || gcpProjectId.isBlank()) {
            log.warn("GCP project id is not configured. Pub/Sub subscriber will not start.");
            return null;
        }

        ProjectSubscriptionName subName = ProjectSubscriptionName.of(gcpProjectId, subscriptionName);

        try {
            this.subscriber = Subscriber.newBuilder(subName, messageReceiver).build();
            this.subscriber.startAsync().awaitRunning();
            log.info("Started Pub/Sub subscriber for {}", subName.toString());
        } catch (Exception ex) {
            log.error("Failed to start Pub/Sub subscriber for {}: {}", subName, ex.getMessage(), ex);
        }

        return this.subscriber;
    }

    @Override
    public void destroy() throws Exception {
        if (subscriber != null) {
            log.info("Shutting down Pub/Sub subscriber");
            subscriber.stopAsync();
        }
    }
}

