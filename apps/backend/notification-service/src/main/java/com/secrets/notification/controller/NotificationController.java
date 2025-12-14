package com.secrets.notification.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.notification.dto.NotificationDto;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.entity.User;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final NotificationSseService sseService;
    private final com.secrets.notification.service.NotificationAnalyticsService analyticsService;

    public NotificationController(NotificationRepository notificationRepository,
                                  UserRepository userRepository,
                                  ObjectMapper objectMapper,
                                  NotificationSseService sseService,
                                  com.secrets.notification.service.NotificationAnalyticsService analyticsService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
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

        Page<NotificationDto> response = notifications.map(this::toDto);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getReadAt() == null) {
                notification.setReadAt(Instant.now());
                notificationRepository.save(notification);
                // Track analytics
                analyticsService.trackOpen(notification.getId(), userId);
            }
        });
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        List<Notification> notifications =
                notificationRepository.findTop50ByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);

        Instant now = Instant.now();
        notifications.forEach(n -> n.setReadAt(now));
        notificationRepository.saveAll(notifications);

        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        UUID userId = resolveCurrentUserId(authentication);
        SseEmitter emitter = new SseEmitter(NotificationSseService.getSseTimeout());
        sseService.addEmitter(userId, emitter);
        log.info("SSE connection established for user {}", userId);
        return emitter;
    }

    @PostMapping("/test")
    public ResponseEntity<NotificationDto> sendTestNotification(
            Authentication authentication,
            @RequestParam(value = "type", defaultValue = "SECRET_EXPIRING_SOON") String notificationType) {
        UUID userId = resolveCurrentUserId(authentication);

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUserId(userId);
        notification.setType(notificationType);
        notification.setTitle("Test Notification: " + notificationType);
        notification.setBody("This is a test notification to verify your notification preferences are working correctly.");
        notification.setCreatedAt(Instant.now());

        notificationRepository.save(notification);

        // Send via SSE
        try {
            NotificationDto dto = toDto(notification);
            sseService.sendNotification(userId, dto);
        } catch (Exception ex) {
            log.warn("Failed to send test notification via SSE: {}", ex.getMessage());
        }

        log.info("Test notification sent to user {}", userId);
        return ResponseEntity.ok(toDto(notification));
    }

    private UUID resolveCurrentUserId(Authentication authentication) {
        String username = authentication.getName(); // email from JWT
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalStateException("User not found for email " + username));
        return user.getId();
    }

    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setBody(notification.getBody());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());

        if (notification.getMetadata() != null) {
            try {
                dto.setMetadata(objectMapper.readValue(
                        notification.getMetadata(),
                        new TypeReference<>() {
                        }));
            } catch (Exception ex) {
                log.warn("Failed to parse notification metadata for {}: {}", notification.getId(), ex.getMessage());
                dto.setMetadata(Collections.emptyMap());
            }
        }

        return dto;
    }
}


