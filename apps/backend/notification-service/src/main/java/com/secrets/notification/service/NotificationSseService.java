package com.secrets.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.notification.dto.NotificationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Service for managing Server-Sent Events (SSE) connections for real-time notifications.
 * Maintains a registry of active SSE emitters per user and provides methods to send
 * notifications to connected clients.
 */
@Service
public class NotificationSseService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSseService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    private final ConcurrentHashMap<UUID, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public NotificationSseService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Register a new SSE emitter for a user.
     * Sets up cleanup handlers and stores the emitter for future notifications.
     */
    public SseEmitter addEmitter(UUID userId, SseEmitter emitter) {
        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> {
            log.debug("SSE emitter timeout for user {}", userId);
            removeEmitter(userId, emitter);
        });
        emitter.onError((ex) -> {
            log.warn("SSE emitter error for user {}: {}", userId, ex.getMessage());
            removeEmitter(userId, emitter);
        });

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(emitter);
        log.debug("Registered SSE emitter for user {}. Total emitters: {}", userId, userEmitters.get(userId).size());

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            log.warn("Failed to send initial connection message to user {}: {}", userId, e.getMessage());
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    /**
     * Remove an emitter from a user's set of active emitters.
     * Cleans up empty sets to prevent memory leaks.
     */
    public void removeEmitter(UUID userId, SseEmitter emitter) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
            log.debug("Removed SSE emitter for user {}. Remaining emitters: {}", userId, 
                    emitters.size());
        }
    }

    /**
     * Send a notification to all active SSE emitters for a user.
     * If sending fails for an emitter, it is removed from the registry.
     */
    public void sendNotification(UUID userId, NotificationDto notification) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("No active SSE emitters for user {}", userId);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(notification);
            emitters.removeIf(emitter -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(json));
                    return false;
                } catch (IOException e) {
                    log.warn("Failed to send notification via SSE to user {}: {}", userId, e.getMessage());
                    return true; // Remove failed emitter
                }
            });

            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        } catch (Exception e) {
            log.error("Failed to serialize notification for SSE to user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Get the timeout value for SSE emitters.
     */
    public static long getSseTimeout() {
        return SSE_TIMEOUT;
    }
}
