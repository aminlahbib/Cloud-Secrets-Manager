package com.secrets.service;

import com.secrets.dto.audit.AuditLogDto;
import com.secrets.dto.audit.AuditLogPageResponse;
import com.secrets.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogProxyService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogProxyService.class);

    private final WebClient.Builder webClientBuilder;
    private final UserService userService;

    @Value("${audit.service.url}")
    private String auditServiceUrl;
    
    @Value("${audit.service.api-key}")
    private String serviceApiKey;

    public AuditLogProxyService(WebClient.Builder webClientBuilder, UserService userService) {
        this.webClientBuilder = webClientBuilder;
        this.userService = userService;
    }
    
    /**
     * Enrich audit log DTOs with user information (email, displayName)
     */
    private void enrichWithUserData(List<AuditLogDto> auditLogs) {
        if (auditLogs == null || auditLogs.isEmpty()) {
            return;
        }
        
        // Collect unique user IDs
        Set<UUID> userIds = auditLogs.stream()
            .map(AuditLogDto::getUserId)
            .filter(userId -> userId != null)
            .collect(Collectors.toSet());
        
        // Batch fetch users
        java.util.Map<UUID, User> userMap = userIds.stream()
            .map(userService::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toMap(User::getId, user -> user));
        
        // Enrich audit logs with user data
        auditLogs.forEach(log -> {
            if (log.getUserId() != null) {
                User user = userMap.get(log.getUserId());
                if (user != null) {
                    log.setUserEmail(user.getEmail());
                    log.setUserDisplayName(user.getDisplayName());
                }
            }
        });
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
            AuditLogPageResponse response = client.get()
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
            
            // Enrich with user data
            if (response != null && response.getContent() != null) {
                enrichWithUserData(response.getContent());
            }
            
            return response;
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
            AuditLogPageResponse response;
            
            // If both startDate and endDate are provided, use the date-range endpoint
            if (startDate.isPresent() && endDate.isPresent() && 
                !startDate.get().isBlank() && !endDate.get().isBlank()) {
                response = client.get()
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
            } else {
                // Otherwise use the regular endpoint with optional filters
                response = client.get()
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
            }
            
            // Enrich with user data
            if (response != null && response.getContent() != null) {
                enrichWithUserData(response.getContent());
            }
            
            return response;
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

    public com.secrets.dto.audit.AnalyticsResponse fetchProjectAnalytics(
            String projectId,
            String startDate,
            String endDate) {

        WebClient client = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

        try {
            com.secrets.dto.audit.AnalyticsResponse response = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/audit/project/" + projectId + "/analytics")
                            .queryParam("start", startDate)
                            .queryParam("end", endDate)
                            .build())
                    .header("X-Service-API-Key", serviceApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(com.secrets.dto.audit.AnalyticsResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            
            // Enrich topUsers with email/displayName
            if (response != null && response.getTopUsers() != null) {
                response.getTopUsers().forEach(topUser -> {
                    if (topUser.getUserId() != null) {
                        try {
                            UUID userId = UUID.fromString(topUser.getUserId());
                            userService.findById(userId).ifPresent(user -> {
                                topUser.setEmail(user.getEmail());
                                // Note: displayName could be added to TopUser if needed
                            });
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid user ID in analytics: {}", topUser.getUserId());
                        }
                    }
                });
            }
            
            return response;
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch project analytics: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
}
