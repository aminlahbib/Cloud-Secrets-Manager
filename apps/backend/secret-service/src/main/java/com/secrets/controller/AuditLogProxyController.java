package com.secrets.controller;

import com.secrets.dto.audit.AuditLogPageResponse;
import com.secrets.service.AuditLogProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit Logs", description = "Proxy endpoints that forward requests to the audit-service")
public class AuditLogProxyController {

    private final AuditLogProxyService auditLogProxyService;

    public AuditLogProxyController(AuditLogProxyService auditLogProxyService) {
        this.auditLogProxyService = auditLogProxyService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Get audit logs", description = "Retrieves audit logs via the audit-service")
    public ResponseEntity<AuditLogPageResponse> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String secretKey,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        AuditLogPageResponse response = auditLogProxyService.fetchAuditLogs(
            page,
            size,
            sortBy,
            sortDir,
            Optional.ofNullable(username),
            Optional.ofNullable(action),
            Optional.ofNullable(secretKey),
            Optional.ofNullable(startDate),
            Optional.ofNullable(endDate)
        );

        return ResponseEntity.ok(response);
    }
}

