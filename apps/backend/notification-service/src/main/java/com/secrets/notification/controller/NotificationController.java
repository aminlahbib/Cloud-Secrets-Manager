package com.secrets.notification.controller;

import com.secrets.notification.dto.NotificationDto;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.entity.User;
import com.secrets.notification.mapper.NotificationMapper;
import com.secrets.notification.repository.NotificationRepository;
import com.secrets.notification.repository.UserRepository;
import com.secrets.notification.service.NotificationSseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final NotificationSseService sseService;
    private final com.secrets.notification.service.NotificationAnalyticsService analyticsService;

    public NotificationController(NotificationRepository notificationRepository,
                                  UserRepository userRepository,
                                  NotificationMapper notificationMapper,
                                  NotificationSseService sseService,
                                  com.secrets.notification.service.NotificationAnalyticsService analyticsService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationMapper = notificationMapper;
        this.sseService = sseService;
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> listNotifications(
            Authentication authentication,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {

        UUID userId = resolveCurrentUserId(authentication);

        // Validate pagination parameters
        if (page < 0) page = 0;
        if (size < 1) size = 1;
        if (size > 100) size = 100; // Max 100 per page

        Pageable pageable = PageRequest.of(page, size);

        Page<Notification> notifications;
        if (type != null || startDate != null || endDate != null) {
            // Use filtered query
            notifications = unreadOnly
                    ? notificationRepository.findByUserIdUnreadWithFilters(userId, type, startDate, endDate, pageable)
                    : notificationRepository.findByUserIdWithFilters(userId, type, startDate, endDate, pageable);
        } else {
            // Use simple query for backward compatibility
            notifications = unreadOnly
                    ? notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable)
                    : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        Page<NotificationDto> response = notifications.map(notificationMapper::toDto);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UUID userId = resolveCurrentUserId(authentication);
        notificationRepository.findById(id).ifPresent(notification -> {
            // Verify the notification belongs to the current user
            if (!notification.getUserId().equals(userId)) {
                log.warn("User {} attempted to mark notification {} as read, but notification belongs to user {}",
                        userId, id, notification.getUserId());
                return;
            }
            
            if (notification.getReadAt() == null) {
                notification.setReadAt(Instant.now());
                notificationRepository.save(notification);
                // Track analytics
                try {
                    analyticsService.trackOpen(notification.getId(), userId);
                } catch (Exception e) {
                    log.warn("Failed to track notification open for {}: {}", id, e.getMessage());
                    // Don't fail the request if analytics tracking fails
                }
            }
        });
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        List<Notification> notifications =
                notificationRepository.findTop50ByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);

        if (notifications.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        Instant now = Instant.now();
        notifications.forEach(n -> {
            if (n.getReadAt() == null) {
                n.setReadAt(now);
            }
        });
        
        try {
            notificationRepository.saveAll(notifications);
            log.info("Marked {} notifications as read for user {}", notifications.size(), userId);
        } catch (Exception e) {
            log.error("Failed to mark notifications as read for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        SseEmitter emitter = new SseEmitter(sseService.getSseTimeout());
        sseService.addEmitter(userId, emitter);
        log.info("SSE connection established for user {}. Active connections: {}", 
                userId, sseService.getActiveConnectionCount());
        return emitter;
    }

    @PostMapping("/test")
    public ResponseEntity<NotificationDto> sendTestNotification(
            Authentication authentication,
            @RequestParam(value = "type", defaultValue = "SECRET_EXPIRING_SOON") String notificationType) {
        UUID userId = resolveCurrentUserId(authentication);

        // Validate notification type
        if (notificationType == null || notificationType.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUserId(userId);
        notification.setType(notificationType);
        notification.setTitle("Test Notification: " + notificationType);
        notification.setBody("This is a test notification to verify your notification preferences are working correctly.");
        notification.setCreatedAt(Instant.now());

        try {
            notification = notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to save test notification for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }

        // Send via SSE
        try {
            NotificationDto dto = notificationMapper.toDto(notification);
            sseService.sendNotification(userId, dto);
        } catch (Exception ex) {
            log.warn("Failed to send test notification via SSE: {}", ex.getMessage());
            // Don't fail the request if SSE fails
        }

        log.info("Test notification sent to user {}", userId);
        return ResponseEntity.ok(notificationMapper.toDto(notification));
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        String username = authentication.getName(); // email from JWT
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalStateException("User not found for email " + username));
        return user.getId();
    }
}


