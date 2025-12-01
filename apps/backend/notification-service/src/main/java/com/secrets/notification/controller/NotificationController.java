package com.secrets.notification.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.notification.dto.NotificationDto;
import com.secrets.notification.entity.Notification;
import com.secrets.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    private final ObjectMapper objectMapper;

    public NotificationController(NotificationRepository notificationRepository,
                                  ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Temporary: userId is passed as a query parameter.
     * In production this should come from authenticated principal / token.
     */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> listNotifications(
            @RequestParam("userId") UUID userId,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly) {

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
    public ResponseEntity<Void> markAllAsRead(@RequestParam("userId") UUID userId) {
        List<Notification> notifications =
                notificationRepository.findTop50ByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);

        Instant now = Instant.now();
        notifications.forEach(n -> n.setReadAt(now));
        notificationRepository.saveAll(notifications);

        return ResponseEntity.noContent().build();
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


