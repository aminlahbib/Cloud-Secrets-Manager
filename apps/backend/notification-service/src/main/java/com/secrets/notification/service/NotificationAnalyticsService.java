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
        // Check if already tracked
        List<NotificationAnalytics> existing = analyticsRepository.findByNotificationId(notificationId);
        boolean alreadyTracked = existing.stream()
                .anyMatch(a -> a.getUserId().equals(userId) && a.getOpenedAt() != null);

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
    }

    /**
     * Track action click (e.g., "View Project", "Rotate Secret")
     */
    @Transactional
    public void trackAction(UUID notificationId, UUID userId, String action) {
        NotificationAnalytics analytics = new NotificationAnalytics();
        analytics.setNotificationId(notificationId);
        analytics.setUserId(userId);
        analytics.setAction(action);
        analytics.setClickedAt(Instant.now());
        analyticsRepository.save(analytics);
        log.debug("Tracked notification action: notificationId={}, userId={}, action={}", notificationId, userId, action);
    }

    /**
     * Get analytics summary for a user
     */
    public AnalyticsSummary getSummaryForUser(UUID userId) {
        Long opens = analyticsRepository.countOpensByUserId(userId);
        Long clicks = analyticsRepository.countClicksByUserId(userId);
        return new AnalyticsSummary(opens != null ? opens : 0L, clicks != null ? clicks : 0L);
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
