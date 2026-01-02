package com.secrets.invite.controller;

import com.secrets.invite.dto.InviteNotificationDto;
import com.secrets.invite.entity.InviteNotification;
import com.secrets.invite.repository.InviteNotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * REST API for invite notifications.
 */
@RestController
@RequestMapping("/api/invite-notifications")
public class InviteNotificationController {

    private final InviteNotificationRepository repository;

    public InviteNotificationController(InviteNotificationRepository repository) {
        this.repository = repository;
    }

    /**
     * List user's invite notifications.
     */
    @GetMapping
    public ResponseEntity<Page<InviteNotificationDto>> listNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Boolean unreadOnly) {
        
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.unauthorized().build();
        }

        // Extract user ID from JWT (assuming it's stored in the principal)
        // This is a simplified version - you may need to adjust based on your JWT structure
        UUID userId = extractUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.unauthorized().build();
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<InviteNotification> notifications;
        
        if (Boolean.TRUE.equals(unreadOnly)) {
            // For unread only, we'll fetch all and filter (or add a custom query)
            notifications = repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            // Filter unread in memory (or add a custom repository method)
        } else {
            notifications = repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        Page<InviteNotificationDto> dtos = notifications.map(this::toDto);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Mark a notification as read.
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            Authentication authentication,
            @PathVariable UUID id) {
        
        if (authentication == null) {
            return ResponseEntity.unauthorized().build();
        }

        UUID userId = extractUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.unauthorized().build();
        }

        InviteNotification notification = repository.findById(id)
                .orElse(null);

        if (notification == null || !notification.getUserId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        notification.setReadAt(Instant.now());
        repository.save(notification);

        return ResponseEntity.noContent().build();
    }

    /**
     * Mark all notifications as read.
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.unauthorized().build();
        }

        UUID userId = extractUserIdFromAuth(authentication);
        if (userId == null) {
            return ResponseEntity.unauthorized().build();
        }

        var unread = repository.findUnreadByUserId(userId);
        unread.forEach(n -> n.setReadAt(Instant.now()));
        repository.saveAll(unread);

        return ResponseEntity.noContent().build();
    }

    private InviteNotificationDto toDto(InviteNotification notification) {
        InviteNotificationDto dto = new InviteNotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setProjectId(notification.getProjectId());
        dto.setTeamId(notification.getTeamId());
        dto.setInviterEmail(notification.getInviterEmail());
        dto.setInviterName(notification.getInviterName());
        dto.setMessage(notification.getMessage());
        dto.setEmailSent(notification.getEmailSent());
        dto.setEmailSentAt(notification.getEmailSentAt());
        dto.setReadAt(notification.getReadAt());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }

    private UUID extractUserIdFromAuth(Authentication authentication) {
        // Simplified - adjust based on your JWT token structure
        // Assuming the user ID is stored in the principal or as a claim
        try {
            String userIdStr = authentication.getName();
            return UUID.fromString(userIdStr);
        } catch (Exception e) {
            return null;
        }
    }
}

