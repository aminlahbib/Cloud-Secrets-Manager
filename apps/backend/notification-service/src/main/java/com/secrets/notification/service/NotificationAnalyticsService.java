package com.secrets.notification.service;

import com.secrets.notification.entity.NotificationAnalytics;
import com.secrets.notification.repository.NotificationAnalyticsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for tracking notification analytics (opens, clicks, etc.)
 */
@Service
public class NotificationAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(NotificationAnalyticsService.class);

    private final NotificationAnalyticsRepository analyticsRepository;

    public NotificationAnalyticsService(NotificationAnalyticsRepository analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }

    /**
     * Track notification open (when user marks as read or views notification)
     */
    @Transactional
    public void trackOpen(UUID notificationId, UUID userId) {
        if (notificationId == null) {
            log.warn("Attempted to track open for null notification ID");
            return;
        }
        
        if (userId == null) {
            log.warn("Attempted to track open for null user ID");
            return;
        }
        
        try {
            // Check if already tracked
            List<NotificationAnalytics> existing = analyticsRepository.findByNotificationId(notificationId);
            boolean alreadyTracked = existing.stream()
                    .anyMatch(a -> a.getUserId() != null && a.getUserId().equals(userId) && a.getOpenedAt() != null);

            if (alreadyTracked) {
                log.debug("Open already tracked for notification {} by user {}", notificationId, userId);
                return;
            }

            NotificationAnalytics analytics = new NotificationAnalytics();
            analytics.setNotificationId(notificationId);
            analytics.setUserId(userId);
            analytics.setOpenedAt(Instant.now());
            analyticsRepository.save(analytics);
            log.debug("Tracked notification open: notificationId={}, userId={}", notificationId, userId);
        } catch (Exception e) {
            log.error("Failed to track notification open for notification {} by user {}: {}", 
                    notificationId, userId, e.getMessage(), e);
            // Don't throw - analytics failures shouldn't break the main flow
        }
    }

    /**
     * Track action click (e.g., "View Project", "Rotate Secret")
     */
    @Transactional
    public void trackAction(UUID notificationId, UUID userId, String action) {
        if (notificationId == null) {
            log.warn("Attempted to track action for null notification ID");
            return;
        }
        
        if (userId == null) {
            log.warn("Attempted to track action for null user ID");
            return;
        }
        
        if (action == null || action.isBlank()) {
            log.warn("Attempted to track action with null or blank action name");
            return;
        }
        
        try {
            NotificationAnalytics analytics = new NotificationAnalytics();
            analytics.setNotificationId(notificationId);
            analytics.setUserId(userId);
            analytics.setAction(action.length() > 50 ? action.substring(0, 50) : action); // Enforce max length
            analytics.setClickedAt(Instant.now());
            analyticsRepository.save(analytics);
            log.debug("Tracked notification action: notificationId={}, userId={}, action={}", notificationId, userId, action);
        } catch (Exception e) {
            log.error("Failed to track notification action for notification {} by user {} with action {}: {}", 
                    notificationId, userId, action, e.getMessage(), e);
            // Don't throw - analytics failures shouldn't break the main flow
        }
    }

    /**
     * Get analytics summary for a user
     */
    public AnalyticsSummary getSummaryForUser(UUID userId) {
        if (userId == null) {
            log.warn("Attempted to get analytics summary for null user ID");
            return new AnalyticsSummary(0L, 0L);
        }
        
        try {
            Long opens = analyticsRepository.countOpensByUserId(userId);
            Long clicks = analyticsRepository.countClicksByUserId(userId);
            return new AnalyticsSummary(opens != null ? opens : 0L, clicks != null ? clicks : 0L);
        } catch (Exception e) {
            log.error("Failed to get analytics summary for user {}: {}", userId, e.getMessage(), e);
            return new AnalyticsSummary(0L, 0L); // Return empty summary on error
        }
    }

    public static class AnalyticsSummary {
        private final Long totalOpens;
        private final Long totalClicks;

        public AnalyticsSummary(Long totalOpens, Long totalClicks) {
            this.totalOpens = totalOpens;
            this.totalClicks = totalClicks;
        }

        public Long getTotalOpens() {
            return totalOpens;
        }

        public Long getTotalClicks() {
            return totalClicks;
        }
    }
}
