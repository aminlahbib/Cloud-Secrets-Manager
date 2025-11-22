package com.secrets.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

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

