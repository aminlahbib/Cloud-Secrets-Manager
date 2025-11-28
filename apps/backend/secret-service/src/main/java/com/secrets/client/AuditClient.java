package com.secrets.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditClient {

    private static final Logger log = LoggerFactory.getLogger(AuditClient.class);

    private final WebClient.Builder webClientBuilder;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    public AuditClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    /**
     * Log an audit event with v3 structure
     */
    @Async
    public void logEvent(UUID projectId, UUID userId, String action, String resourceType,
                        String resourceId, String resourceName, Map<String, Object> metadata) {
        try {
            WebClient webClient = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

            Map<String, Object> auditEvent = new HashMap<>();
            auditEvent.put("userId", userId.toString());
            if (projectId != null) {
                auditEvent.put("projectId", projectId.toString());
            }
            auditEvent.put("action", action);
            auditEvent.put("resourceType", resourceType);
            if (resourceId != null) {
                auditEvent.put("resourceId", resourceId);
            }
            if (resourceName != null) {
                auditEvent.put("resourceName", resourceName);
            }
            if (metadata != null && !metadata.isEmpty()) {
                auditEvent.put("metadata", metadata);
            }
            
            webClient.post()
                .uri("/api/audit/log")
                .bodyValue(auditEvent)
                .retrieve()
                .bodyToMono(Void.class)
                .timeout(Duration.ofMillis(5000))
                .doOnError(error -> log.error("Failed to send audit event: {} - {}", action, error.getMessage()))
                .onErrorResume(error -> Mono.empty())
                .subscribe();
                
        } catch (Exception e) {
            log.error("Error sending audit event: {} - {}", action, e.getMessage());
        }
    }

    /**
     * Convenience method for secret operations
     */
    @Async
    public void logSecretEvent(UUID projectId, UUID userId, String action, String secretKey) {
        logEvent(projectId, userId, action, "SECRET", secretKey, secretKey, null);
    }

}
