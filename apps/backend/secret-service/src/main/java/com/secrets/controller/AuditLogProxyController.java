package com.secrets.controller;

import com.secrets.dto.audit.AuditLogPageResponse;
import com.secrets.service.AuditLogProxyService;
import com.secrets.service.ProjectPermissionService;
import com.secrets.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit Logs", description = "Proxy endpoints that forward requests to the audit-service")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogProxyController {

    private final AuditLogProxyService auditLogProxyService;
    private final ProjectPermissionService permissionService;
    private final UserService userService;

    public AuditLogProxyController(
            AuditLogProxyService auditLogProxyService,
            ProjectPermissionService permissionService,
            UserService userService) {
        this.auditLogProxyService = auditLogProxyService;
        this.permissionService = permissionService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get audit logs", description = "Retrieves audit logs via the audit-service. Platform admin only.")
    public ResponseEntity<AuditLogPageResponse> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // TODO: Implement platform admin check
        // This endpoint should only be accessible to platform admins
        
        AuditLogPageResponse response = auditLogProxyService.fetchAuditLogs(
                page,
                size,
                sortBy,
                sortDir,
                Optional.ofNullable(action),
                Optional.ofNullable(startDate),
                Optional.ofNullable(endDate));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get project audit logs", description = "Retrieves audit logs for a specific project. Requires project membership.")
    public ResponseEntity<AuditLogPageResponse> getProjectAuditLogs(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Get current user ID
        UUID currentUserId = userService.getCurrentUserId(userDetails.getUsername());
        
        // Check if user has access to the project (any role: OWNER, ADMIN, MEMBER, or VIEWER)
        UUID projectUuid;
        try {
            projectUuid = UUID.fromString(projectId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        
        if (!permissionService.canViewProject(projectUuid, currentUserId)) {
            throw new AccessDeniedException("Access denied to project");
        }

        AuditLogPageResponse response = auditLogProxyService.fetchProjectAuditLogs(
                projectId,
                page,
                size,
                Optional.ofNullable(action),
                Optional.ofNullable(userId),
                Optional.ofNullable(resourceType),
                Optional.ofNullable(startDate),
                Optional.ofNullable(endDate));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/project/{projectId}/date-range")
    @Operation(summary = "Get project audit logs by date range", description = "Retrieves audit logs for a specific project within a date range. Requires project membership.")
    public ResponseEntity<AuditLogPageResponse> getProjectAuditLogsByDateRange(
            @PathVariable String projectId,
            @RequestParam String start,
            @RequestParam String end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Get current user ID
        UUID currentUserId = userService.getCurrentUserId(userDetails.getUsername());
        
        // Check if user has access to the project
        UUID projectUuid;
        try {
            projectUuid = UUID.fromString(projectId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        
        if (!permissionService.canViewProject(projectUuid, currentUserId)) {
            throw new AccessDeniedException("Access denied to project");
        }

        AuditLogPageResponse response = auditLogProxyService.fetchProjectAuditLogs(
                projectId,
                page,
                size,
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.of(start),
                Optional.of(end));

        return ResponseEntity.ok(response);
    }
}
