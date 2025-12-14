package com.secrets.notification.controller;

import com.secrets.notification.entity.User;
import com.secrets.notification.repository.UserRepository;
import com.secrets.notification.service.NotificationAnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications/analytics")
public class NotificationAnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(NotificationAnalyticsController.class);

    private final NotificationAnalyticsService analyticsService;
    private final UserRepository userRepository;

    public NotificationAnalyticsController(NotificationAnalyticsService analyticsService,
                                         UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @PostMapping("/{notificationId}/open")
    public ResponseEntity<Void> trackOpen(
            @PathVariable("notificationId") UUID notificationId,
            Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        analyticsService.trackOpen(notificationId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{notificationId}/action")
    public ResponseEntity<Void> trackAction(
            @PathVariable("notificationId") UUID notificationId,
            @RequestParam("action") String action,
            Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        analyticsService.trackAction(notificationId, userId, action);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getSummary(Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        NotificationAnalyticsService.AnalyticsSummary summary = analyticsService.getSummaryForUser(userId);
        return ResponseEntity.ok(Map.of(
                "totalOpens", summary.getTotalOpens(),
                "totalClicks", summary.getTotalClicks()
        ));
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalStateException("User not found for email " + username));
        return user.getId();
    }
}
