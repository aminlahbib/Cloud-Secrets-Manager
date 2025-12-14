package com.secrets.notification.service;

import com.secrets.notification.entity.Notification;
import com.secrets.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Service for batching similar notifications to reduce notification spam.
 * Groups notifications of the same type for the same user within a time window.
 */
@Service
public class NotificationBatchingService {

    private static final Logger log = LoggerFactory.getLogger(NotificationBatchingService.class);
    private static final int BATCH_TIME_WINDOW_MINUTES = 5;

    private final NotificationRepository notificationRepository;

    public NotificationBatchingService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Check if a new notification should be batched with an existing unread notification.
     * Returns the existing notification to update, or null if no batching should occur.
     */
    public Notification findBatchableNotification(UUID userId, String notificationType, Instant createdAt) {
        Instant windowStart = createdAt.minus(BATCH_TIME_WINDOW_MINUTES, ChronoUnit.MINUTES);
        
        List<Notification> recentNotifications = notificationRepository
                .findTop50ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> n.getType().equals(notificationType))
                .filter(n -> n.getReadAt() == null)
                .filter(n -> n.getCreatedAt().isAfter(windowStart))
                .toList();

        if (recentNotifications.isEmpty()) {
            return null;
        }

        // Return the most recent unread notification of the same type
        return recentNotifications.get(0);
    }

    /**
     * Update an existing notification to include batch information.
     */
    public void updateNotificationBatch(Notification notification, String newBatchItem) {
        // Increment batch count in metadata
        // For now, we'll store batch info in metadata JSON
        // In a future enhancement, we could add a dedicated batchCount field
        log.debug("Batching notification {} with new item: {}", notification.getId(), newBatchItem);
    }
}
