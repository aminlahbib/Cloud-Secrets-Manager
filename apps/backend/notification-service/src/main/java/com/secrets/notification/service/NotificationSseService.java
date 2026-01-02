package com.secrets.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secrets.notification.dto.NotificationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
 * 
 * Note: Currently uses in-memory storage. For multi-instance deployments, consider
 * using Redis pub/sub to broadcast notifications across instances.
 */
@Service
public class NotificationSseService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSseService.class);

    private final ConcurrentHashMap<UUID, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final long sseTimeout;

    public NotificationSseService(ObjectMapper objectMapper,
                                  @Value("${notifications.sse.timeout-ms:1800000}") long sseTimeout) {
        if (objectMapper == null) {
            throw new IllegalArgumentException("ObjectMapper cannot be null");
        }
        this.objectMapper = objectMapper;
        // Clamp timeout between 1 minute and 1 hour
        this.sseTimeout = Math.max(60000, Math.min(sseTimeout, 3600000));
        if (this.sseTimeout != sseTimeout) {
            log.warn("SSE timeout adjusted from {}ms to {}ms (valid range: 60000-3600000)", 
                    sseTimeout, this.sseTimeout);
        }
    }

    /**
     * Register a new SSE emitter for a user.
     * Sets up cleanup handlers and stores the emitter for future notifications.
     */
    public SseEmitter addEmitter(UUID userId, SseEmitter emitter) {
        if (userId == null) {
            log.warn("Attempted to register SSE emitter for null user ID");
            throw new IllegalArgumentException("User ID cannot be null");
        }
        
        if (emitter == null) {
            log.warn("Attempted to register null SSE emitter for user {}", userId);
            throw new IllegalArgumentException("SseEmitter cannot be null");
        }
        
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
        Set<SseEmitter> userEmitterSet = userEmitters.get(userId);
        log.debug("Registered SSE emitter for user {}. Total emitters: {}", userId, 
                userEmitterSet != null ? userEmitterSet.size() : 0);

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
            int remainingCount = emitters.size();
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
            log.debug("Removed SSE emitter for user {}. Remaining emitters: {}", userId, remainingCount);
        }
    }

    /**
     * Send a notification to all active SSE emitters for a user.
     * If sending fails for an emitter, it is removed from the registry.
     */
    public void sendNotification(UUID userId, NotificationDto notification) {
        if (userId == null) {
            log.warn("Attempted to send notification to null user ID");
            return;
        }
        
        if (notification == null) {
            log.warn("Attempted to send null notification to user {}", userId);
            return;
        }
        
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("No active SSE emitters for user {}", userId);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(notification);
            emitters.removeIf(emitter -> {
                if (emitter == null) {
                    return true; // Remove null emitters
                }
                try {
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(json));
                    return false;
                } catch (IOException e) {
                    log.warn("Failed to send notification via SSE to user {}: {}", userId, e.getMessage());
                    return true; // Remove failed emitter
                } catch (Exception e) {
                    log.warn("Unexpected error sending notification via SSE to user {}: {}", userId, e.getMessage());
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
    public long getSseTimeout() {
        return sseTimeout;
    }
    
    /**
     * Get the number of active SSE connections.
     */
    public int getActiveConnectionCount() {
        return userEmitters.values().stream()
                .mapToInt(Set::size)
                .sum();
    }
    
    /**
     * Get the number of users with active SSE connections.
     */
    public int getActiveUserCount() {
        return userEmitters.size();
    }
}
