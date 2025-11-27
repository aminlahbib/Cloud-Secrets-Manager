package com.audit.controller;

import com.audit.dto.AuditLogRequest;
import com.audit.dto.AuditLogResponse;
import com.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit", description = "Audit log operations")
public class AuditController {

    private static final Logger log = LoggerFactory.getLogger(AuditController.class);

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping("/log")
    @Operation(summary = "Log an audit event", description = "Internal endpoint for logging audit events")
    public ResponseEntity<AuditLogResponse> logEvent(
            @Valid @RequestBody AuditLogRequest request,
            HttpServletRequest httpRequest) {

        log.debug("Received audit log request: {}", request.getAction());
        AuditLogResponse response = auditService.logEvent(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all audit logs", description = "Retrieves all audit logs with optional pagination")
    public ResponseEntity<Page<AuditLogResponse>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<AuditLogResponse> logs = auditService.getLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    // Project-scoped endpoints
    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get logs by project ID", description = "Retrieves audit logs for a specific project")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByProjectId(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<AuditLogResponse> logs = auditService.getLogsByProjectId(projectId, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/project/{projectId}/action/{action}")
    @Operation(summary = "Get logs by project and action", description = "Retrieves audit logs for a project filtered by action")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByProjectIdAndAction(
            @PathVariable UUID projectId,
            @PathVariable String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> logs = auditService.getLogsByProjectIdAndAction(projectId, action, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/project/{projectId}/resource-type/{resourceType}")
    @Operation(summary = "Get logs by project and resource type", description = "Retrieves audit logs for a project filtered by resource type")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByProjectIdAndResourceType(
            @PathVariable UUID projectId,
            @PathVariable String resourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> logs = auditService.getLogsByProjectIdAndResourceType(projectId, resourceType, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/project/{projectId}/date-range")
    @Operation(summary = "Get logs by project and date range", description = "Retrieves audit logs for a project within a date range")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByProjectIdAndDateRange(
            @PathVariable UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> logs = auditService.getLogsByProjectIdAndDateRange(projectId, start, end, pageable);
        return ResponseEntity.ok(logs);
    }

    // User-scoped endpoints
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get logs by user ID", description = "Retrieves audit logs for a specific user")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<AuditLogResponse> logs = auditService.getLogsByUserId(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    // Resource-scoped endpoints
    @GetMapping("/resource/{resourceType}/{resourceId}")
    @Operation(summary = "Get logs by resource", description = "Retrieves audit logs for a specific resource")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByResource(
            @PathVariable String resourceType,
            @PathVariable String resourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> logs = auditService.getLogsByResource(resourceType, resourceId, pageable);
        return ResponseEntity.ok(logs);
    }

    // Legacy endpoints for backward compatibility
    @GetMapping("/username/{username}")
    @Operation(summary = "Get logs by username (legacy)", description = "Legacy endpoint - use /user/{userId} instead")
    @Deprecated
    public ResponseEntity<List<AuditLogResponse>> getLogsByUsername(@PathVariable String username) {
        log.warn("Deprecated endpoint /username/{} called. Use /user/{{userId}} instead.", username);
        // Return empty list as username lookup is no longer supported
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/secret/{secretKey}")
    @Operation(summary = "Get logs by secret key (legacy)", description = "Retrieves audit logs for a specific secret (legacy endpoint)")
    public ResponseEntity<List<AuditLogResponse>> getLogsBySecretKey(@PathVariable String secretKey) {
        List<AuditLogResponse> logs = auditService.getLogsBySecretKey(secretKey);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get logs by date range", description = "Retrieves audit logs within a date range")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> logs = auditService.getLogsByDateRange(start, end, pageable);
        return ResponseEntity.ok(logs);
    }
}
