package com.secrets.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
public class AuditClient {

    private static final Logger log = LoggerFactory.getLogger(AuditClient.class);

    private final WebClient.Builder webClientBuilder;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    public AuditClient(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public void logEvent(String action, String secretKey, String username) {
        try {
            WebClient webClient = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

            Map<String, String> auditEvent = Map.of(
                "action", action,
                "secretKey", secretKey,
                "username", username
            );

            webClient.post()
                .uri("/api/audit/log")
                .bodyValue(auditEvent)
                .retrieve()
                .bodyToMono(Void.class)
                .timeout(Duration.ofMillis(5000))
                .doOnError(error -> log.error("Failed to send audit event: {}", error.getMessage()))
                .onErrorResume(error -> Mono.empty())
                .subscribe();
        } catch (Exception e) {
            log.error("Error sending audit event: {}", e.getMessage());
        }
    }
}

