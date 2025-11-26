package com.secrets.service;

import com.secrets.dto.audit.AuditLogPageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Optional;

@Service
public class AuditLogProxyService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogProxyService.class);

    private final WebClient.Builder webClientBuilder;

    @Value("${audit.service.url}")
    private String auditServiceUrl;

    public AuditLogProxyService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public AuditLogPageResponse fetchAuditLogs(
            int page,
            int size,
            String sortBy,
            String sortDir,
            Optional<String> username,
            Optional<String> action,
            Optional<String> secretKey,
            Optional<String> startDate,
            Optional<String> endDate) {

        WebClient client = webClientBuilder
            .baseUrl(auditServiceUrl)
            .build();

        try {
            return client.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/api/audit")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .queryParam("sortBy", sortBy)
                        .queryParam("sortDir", sortDir);

                    username.filter(value -> !value.isBlank())
                        .ifPresent(value -> builder.queryParam("username", value));

                    action.filter(value -> !value.isBlank())
                        .ifPresent(value -> builder.queryParam("action", value));

                    secretKey.filter(value -> !value.isBlank())
                        .ifPresent(value -> builder.queryParam("secretKey", value));

                    startDate.filter(value -> !value.isBlank())
                        .ifPresent(value -> builder.queryParam("startDate", value));

                    endDate.filter(value -> !value.isBlank())
                        .ifPresent(value -> builder.queryParam("endDate", value));

                    return builder.build();
                })
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(AuditLogPageResponse.class)
                .timeout(Duration.ofSeconds(5))
                .block();
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch audit logs: {}", ex.getMessage());
            throw ex;
        }
    }
}

