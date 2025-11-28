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
    
    @Value("${audit.service.api-key}")
    private String serviceApiKey;

    public AuditLogProxyService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public AuditLogPageResponse fetchAuditLogs(
            int page,
            int size,
            String sortBy,
            String sortDir,
            Optional<String> action,
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

                        action.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("action", value));

                        startDate.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("startDate", value));

                        endDate.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("endDate", value));

                        return builder.build();
                    })
                    .header("X-Service-API-Key", serviceApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(AuditLogPageResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch audit logs: {}", ex.getMessage());
            throw ex;
        }
    }

    public AuditLogPageResponse fetchProjectAuditLogs(
            String projectId,
            int page,
            int size,
            Optional<String> action,
            Optional<String> userId,
            Optional<String> resourceType,
            Optional<String> startDate,
            Optional<String> endDate) {

        WebClient client = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

        try {
            // If both startDate and endDate are provided, use the date-range endpoint
            if (startDate.isPresent() && endDate.isPresent() && 
                !startDate.get().isBlank() && !endDate.get().isBlank()) {
                return client.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/api/audit/project/" + projectId + "/date-range")
                                .queryParam("start", startDate.get())
                                .queryParam("end", endDate.get())
                                .queryParam("page", page)
                                .queryParam("size", size)
                                .build())
                        .header("X-Service-API-Key", serviceApiKey)
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve()
                        .bodyToMono(AuditLogPageResponse.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();
            }
            
            // Otherwise use the regular endpoint with optional filters
            return client.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path("/api/audit/project/" + projectId)
                                .queryParam("page", page)
                                .queryParam("size", size);

                        action.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("action", value));

                        userId.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("userId", value));

                        resourceType.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("resourceType", value));

                        startDate.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("startDate", value));

                        endDate.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("endDate", value));

                        return builder.build();
                    })
                    .header("X-Service-API-Key", serviceApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(AuditLogPageResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch project audit logs: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
}
