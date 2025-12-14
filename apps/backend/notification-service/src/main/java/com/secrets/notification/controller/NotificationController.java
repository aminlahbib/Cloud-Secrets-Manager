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

    public NotificationController(NotificationRepository notificationRepository,
                                  UserRepository userRepository,
                                  ObjectMapper objectMapper,
                                  NotificationSseService sseService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.sseService = sseService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> listNotifications(
            Authentication authentication,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly) {

        UUID userId = resolveCurrentUserId(authentication);

        List<Notification> notifications = unreadOnly
                ? notificationRepository.findTop50ByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId)
                : notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);

        List<NotificationDto> response = notifications.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable("id") UUID id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getReadAt() == null) {
                notification.setReadAt(Instant.now());
                notificationRepository.save(notification);
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


