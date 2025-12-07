package com.secrets.controller;

import com.secrets.security.JwtTokenProvider;
import com.secrets.service.NotificationProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Proxy endpoints that forward requests to notification-service")
@SecurityRequirement(name = "bearerAuth")
public class NotificationProxyController {

    private final NotificationProxyService notificationProxyService;
    private final JwtTokenProvider jwtTokenProvider;

    public NotificationProxyController(
            NotificationProxyService notificationProxyService,
            JwtTokenProvider jwtTokenProvider) {
        this.notificationProxyService = notificationProxyService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "List notifications", description = "Retrieves notifications for the current user via notification-service")
    public ResponseEntity<String> listNotifications(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            Authentication authentication) {

        String localJwt = generateLocalJwt(authentication);
        String body = notificationProxyService.fetchNotifications(unreadOnly, "Bearer " + localJwt);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    @PostMapping(path = "/{id}/read")
    @Operation(summary = "Mark notification as read", description = "Marks a single notification as read via notification-service")
    public ResponseEntity<Void> markAsRead(
            @PathVariable("id") String notificationId,
            Authentication authentication) {

        String localJwt = generateLocalJwt(authentication);
        notificationProxyService.markAsRead(notificationId, "Bearer " + localJwt);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Marks all notifications as read via notification-service")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {

        String localJwt = generateLocalJwt(authentication);
        notificationProxyService.markAllAsRead("Bearer " + localJwt);
        return ResponseEntity.noContent().build();
    }

    /**
     * Generate a local JWT token for the authenticated user to forward to notification-service.
     * The notification-service expects a local JWT token (not a Firebase token).
     */
    private String generateLocalJwt(Authentication authentication) {
        String username = authentication.getName(); // email
        var authorities = authentication.getAuthorities();
        return jwtTokenProvider.generateToken(username, authorities);
    }
}


