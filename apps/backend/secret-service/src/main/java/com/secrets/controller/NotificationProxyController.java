package com.secrets.controller;

import com.secrets.service.NotificationProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Proxy endpoints that forward requests to notification-service")
@SecurityRequirement(name = "bearerAuth")
public class NotificationProxyController {

    private final NotificationProxyService notificationProxyService;

    public NotificationProxyController(NotificationProxyService notificationProxyService) {
        this.notificationProxyService = notificationProxyService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "List notifications", description = "Retrieves notifications for the current user via notification-service")
    public ResponseEntity<String> listNotifications(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {

        String body = notificationProxyService.fetchNotifications(unreadOnly, authHeader);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    @PostMapping(path = "/{id}/read")
    @Operation(summary = "Mark notification as read", description = "Marks a single notification as read via notification-service")
    public ResponseEntity<Void> markAsRead(
            @PathVariable("id") String notificationId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {

        notificationProxyService.markAsRead(notificationId, authHeader);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Marks all notifications as read via notification-service")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {

        notificationProxyService.markAllAsRead(authHeader);
        return ResponseEntity.noContent().build();
    }
}


