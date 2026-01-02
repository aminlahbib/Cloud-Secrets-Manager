package com.secrets.notification.service;

import com.secrets.notification.entity.Notification;
import com.secrets.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    
    private final NotificationRepository notificationRepository;
    private final int batchTimeWindowMinutes;

    public NotificationBatchingService(NotificationRepository notificationRepository,
                                       @Value("${notifications.batching.time-window-minutes:5}") int batchTimeWindowMinutes) {
        this.notificationRepository = notificationRepository;
        // Clamp between 1 and 60 minutes
        this.batchTimeWindowMinutes = Math.max(1, Math.min(batchTimeWindowMinutes, 60));
        if (this.batchTimeWindowMinutes != batchTimeWindowMinutes) {
            log.warn("Batch time window adjusted from {} to {} minutes (valid range: 1-60)", 
                    batchTimeWindowMinutes, this.batchTimeWindowMinutes);
        }
    }

    /**
     * Check if a new notification should be batched with an existing unread notification.
     * Returns the existing notification to update, or null if no batching should occur.
     * 
     * Optimized query: Uses database filtering instead of fetching 50 records and filtering in memory.
     */
    public Notification findBatchableNotification(UUID userId, String notificationType, Instant createdAt) {
        if (userId == null) {
            log.warn("Attempted to find batchable notification for null user ID");
            return null;
        }
        
        if (notificationType == null || notificationType.isBlank()) {
            log.warn("Attempted to find batchable notification with null or blank type");
            return null;
        }
        
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        
        try {
            Instant windowStart = createdAt.minus(batchTimeWindowMinutes, ChronoUnit.MINUTES);
            
            // Use optimized query with filters - only fetch what we need
            Pageable pageable = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"));
            List<Notification> batchableNotifications = notificationRepository
                    .findByUserIdUnreadWithFilters(userId, notificationType, windowStart, createdAt, pageable)
                    .getContent();

            if (batchableNotifications.isEmpty()) {
                return null;
            }

            // Return the most recent unread notification of the same type within the time window
            return batchableNotifications.get(0);
        } catch (Exception e) {
            log.error("Failed to find batchable notification for user {} with type {}: {}", 
                    userId, notificationType, e.getMessage(), e);
            return null; // Return null on error to allow creating new notification
        }
    }

    /**
     * Update an existing notification to include batch information.
     * Updates the title to indicate multiple similar notifications.
     */
    public void updateNotificationBatch(Notification notification, String newBatchItem) {
        if (notification == null) {
            log.warn("Attempted to batch null notification");
            return;
        }
        
        if (notification.getTitle() == null) {
            notification.setTitle("Notification (2 similar)");
            return;
        }
        
        // Update title to show it's a batch
        String currentTitle = notification.getTitle();
        if (!currentTitle.contains("(")) {
            notification.setTitle(currentTitle + " (2 similar)");
        } else {
            // Extract current count and increment
            try {
                int openParen = currentTitle.indexOf("(");
                int closeParen = currentTitle.indexOf(")");
                
                if (openParen >= 0 && closeParen > openParen) {
                    String countPart = currentTitle.substring(openParen + 1, closeParen);
                    String[] parts = countPart.split(" ");
                    if (parts.length > 0) {
                        int count = Integer.parseInt(parts[0]);
                        notification.setTitle(currentTitle.replace("(" + countPart + ")", "(" + (count + 1) + " similar)"));
                    } else {
                        notification.setTitle(currentTitle + " (+1)");
                    }
                } else {
                    // Malformed title, just append
                    notification.setTitle(currentTitle + " (+1)");
                }
            } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
                // If parsing fails, just append
                log.debug("Failed to parse batch count from title '{}', appending (+1): {}", currentTitle, e.getMessage());
                notification.setTitle(currentTitle + " (+1)");
            }
        }
        log.debug("Batching notification {} with new item: {}", notification.getId(), newBatchItem);
    }
}
