package com.audit.service;

import com.audit.dto.AnalyticsResponse;
import com.audit.dto.AuditLogRequest;
import com.audit.dto.AuditLogResponse;
import com.audit.entity.AuditLog;
import com.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLogResponse logEvent(AuditLogRequest request, HttpServletRequest httpRequest) {
        log.debug("Logging audit event: {} for user: {} in project: {}", 
            request.getAction(), request.getUserId(), request.getProjectId());

        AuditLog auditLog = AuditLog.builder()
            .projectId(request.getProjectId())
            .userId(request.getUserId())
            .action(request.getAction())
            .resourceType(request.getResourceType())
            .resourceId(request.getResourceId())
            .resourceName(request.getResourceName())
            .oldValue(request.getOldValue())
            .newValue(request.getNewValue())
            .metadata(request.getMetadata())
            .ipAddress(getClientIpAddress(httpRequest))
            .userAgent(httpRequest.getHeader("User-Agent"))
            .build();

        AuditLog savedLog = auditLogRepository.save(auditLog);
        log.info("Audit event logged: {} for user: {} in project: {}", 
            request.getAction(), request.getUserId(), request.getProjectId());

        return AuditLogResponse.from(savedLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        log.debug("Retrieving all audit logs");
        return auditLogRepository.findAll().stream()
            .map(AuditLogResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogs(Pageable pageable) {
        log.debug("Retrieving audit logs with pagination");
        return auditLogRepository.findAll(pageable)
            .map(AuditLogResponse::from);
    }

    // Project-scoped queries
    @Transactional(readOnly = true)
    @Cacheable(value = "projectAuditLogs", key = "#projectId + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<AuditLogResponse> getLogsByProjectId(UUID projectId, Pageable pageable) {
        log.debug("Retrieving audit logs for project: {}", projectId);
        return auditLogRepository.findByProjectId(projectId, pageable)
            .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByProjectIdAndAction(
            UUID projectId, String action, Pageable pageable) {
        log.debug("Retrieving audit logs for project: {} with action: {}", projectId, action);
        return auditLogRepository.findByProjectIdAndAction(projectId, action, pageable)
            .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByProjectIdAndResourceType(
            UUID projectId, String resourceType, Pageable pageable) {
        log.debug("Retrieving audit logs for project: {} with resource type: {}", projectId, resourceType);
        return auditLogRepository.findByProjectIdAndResourceType(projectId, resourceType, pageable)
            .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByProjectIdAndDateRange(
            UUID projectId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        log.debug("Retrieving audit logs for project: {} between {} and {}", projectId, start, end);
        return auditLogRepository.findByProjectIdAndCreatedAtBetween(projectId, start, end, pageable)
            .map(AuditLogResponse::from);
    }

    // User-scoped queries
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByUserId(UUID userId, Pageable pageable) {
        log.debug("Retrieving audit logs for user: {}", userId);
        return auditLogRepository.findByUserId(userId, pageable)
            .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByUserId(UUID userId) {
        log.debug("Retrieving all audit logs for user: {}", userId);
        return auditLogRepository.findByUserId(userId).stream()
            .map(AuditLogResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByUserIdAndDateRange(
            UUID userId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        log.debug("Retrieving audit logs for user: {} between {} and {}", userId, start, end);
        return auditLogRepository.findByUserIdAndCreatedAtBetween(userId, start, end, pageable)
            .map(AuditLogResponse::from);
    }

    // Resource-scoped queries
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByResource(String resourceType, String resourceId, Pageable pageable) {
        log.debug("Retrieving audit logs for resource: {}:{}", resourceType, resourceId);
        return auditLogRepository.findByResourceTypeAndResourceId(resourceType, resourceId, pageable)
            .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByResource(String resourceType, String resourceId) {
        log.debug("Retrieving all audit logs for resource: {}:{}", resourceType, resourceId);
        return auditLogRepository.findByResourceTypeAndResourceId(resourceType, resourceId).stream()
            .map(AuditLogResponse::from)
            .collect(Collectors.toList());
    }


    // Action-based queries
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByAction(String action, Pageable pageable) {
        log.debug("Retrieving audit logs for action: {}", action);
        return auditLogRepository.findByAction(action, pageable)
            .map(AuditLogResponse::from);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByAction(String action) {
        log.debug("Retrieving all audit logs for action: {}", action);
        return auditLogRepository.findByAction(action).stream()
            .map(AuditLogResponse::from)
            .collect(Collectors.toList());
    }

    // Date range queries
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByDateRange(
            LocalDateTime start, LocalDateTime end, Pageable pageable) {
        log.debug("Retrieving audit logs between {} and {}", start, end);
        return auditLogRepository.findByCreatedAtBetween(start, end, pageable)
            .map(AuditLogResponse::from);
    }

    // Combined queries
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByProjectIdAndUserIdAndDateRange(
            UUID projectId, UUID userId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        log.debug("Retrieving audit logs for project: {}, user: {} between {} and {}", 
            projectId, userId, start, end);
        return auditLogRepository.findByProjectIdAndUserIdAndCreatedAtBetween(
            projectId, userId, start, end, pageable)
            .map(AuditLogResponse::from);
    }

    // Analytics
    @Transactional(readOnly = true)
    @Cacheable(value = "analytics", key = "#projectId + '_' + #start + '_' + #end")
    public AnalyticsResponse calculateAnalytics(UUID projectId, LocalDateTime start, LocalDateTime end) {
        log.debug("Calculating analytics for project: {} between {} and {}", projectId, start, end);
        
        // Total actions
        long totalActions = auditLogRepository.countByProjectIdAndDateRange(projectId, start, end);
        
        // Actions by type
        List<Object[]> actionsByTypeResults = auditLogRepository.countActionsByType(projectId, start, end);
        Map<String, Long> actionsByType = actionsByTypeResults.stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> ((Number) row[1]).longValue(),
                (v1, v2) -> v1,
                LinkedHashMap::new
            ));
        
        // Actions by user
        List<Object[]> actionsByUserResults = auditLogRepository.countActionsByUser(projectId, start, end);
        Map<String, Long> actionsByUser = actionsByUserResults.stream()
            .collect(Collectors.toMap(
                row -> row[0].toString(),
                row -> ((Number) row[1]).longValue(),
                (v1, v2) -> v1,
                LinkedHashMap::new
            ));
        
        // Actions by day
        List<Object[]> actionsByDayResults = auditLogRepository.countActionsByDay(projectId, start, end);
        Map<String, Long> actionsByDay = actionsByDayResults.stream()
            .collect(Collectors.toMap(
                row -> {
                    if (row[0] instanceof LocalDate) {
                        return ((LocalDate) row[0]).format(DateTimeFormatter.ISO_LOCAL_DATE);
                    } else if (row[0] instanceof java.sql.Date) {
                        return ((java.sql.Date) row[0]).toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
                    } else {
                        return row[0].toString();
                    }
                },
                row -> ((Number) row[1]).longValue(),
                (v1, v2) -> v1,
                LinkedHashMap::new
            ));
        
        // Top actions (limit to 5)
        List<AnalyticsResponse.TopItem> topActions = actionsByTypeResults.stream()
            .limit(5)
            .map(row -> new AnalyticsResponse.TopItem((String) row[0], ((Number) row[1]).longValue()))
            .collect(Collectors.toList());
        
        // Top users (limit to 5)
        List<AnalyticsResponse.TopUser> topUsers = actionsByUserResults.stream()
            .limit(5)
            .map(row -> new AnalyticsResponse.TopUser(
                row[0].toString(),
                null, // Email will be enriched by proxy service if needed
                ((Number) row[1]).longValue()
            ))
            .collect(Collectors.toList());
        
        return new AnalyticsResponse(
            totalActions,
            actionsByType,
            actionsByUser,
            actionsByDay,
            topActions,
            topUsers
        );
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
