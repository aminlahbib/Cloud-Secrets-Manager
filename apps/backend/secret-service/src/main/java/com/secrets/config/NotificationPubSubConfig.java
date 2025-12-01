package com.secrets.config;

import com.google.cloud.pubsub.v1.Publisher;
import com.google.pubsub.v1.TopicName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

/**
 * Pub/Sub configuration for notification events.
 *
 * This creates a Publisher bean that other services can use to
 * publish NotificationEvent messages to Google Cloud Pub/Sub.
 */
@Configuration
public class NotificationPubSubConfig implements DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(NotificationPubSubConfig.class);

    @Value("${gcp.project-id:}")
    private String gcpProjectId;

    @Value("${notifications.topic-name:notifications-events}")
    private String notificationsTopicName;

    private Publisher publisher;

    @Bean
    public TopicName notificationsTopic() {
        if (gcpProjectId == null || gcpProjectId.isBlank()) {
            log.warn("GCP project id is not configured. Notification events will not be published.");
            return null;
        }
        return TopicName.of(gcpProjectId, notificationsTopicName);
    }

    @Bean
    public Publisher notificationPublisher(TopicName notificationsTopic) throws IOException {
        if (notificationsTopic == null) {
            return null;
        }
        this.publisher = Publisher.newBuilder(notificationsTopic).build();
        log.info("Initialized Pub/Sub publisher for topic {}", notificationsTopic.toString());
        return this.publisher;
    }

    @Override
    public void destroy() throws Exception {
        if (publisher != null) {
            log.info("Shutting down Pub/Sub notification publisher");
            publisher.shutdown();
        }
    }
}


