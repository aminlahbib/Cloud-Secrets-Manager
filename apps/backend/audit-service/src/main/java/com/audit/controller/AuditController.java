package com.audit.controller;

import com.audit.dto.AuditLogRequest;
import com.audit.dto.AuditLogResponse;
import com.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Audit", description = "Audit log operations")
public class AuditController {

    private final AuditService auditService;

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
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<AuditLogResponse> logs = auditService.getLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/username/{username}")
    @Operation(summary = "Get logs by username", description = "Retrieves audit logs for a specific user")
    public ResponseEntity<List<AuditLogResponse>> getLogsByUsername(@PathVariable String username) {
        List<AuditLogResponse> logs = auditService.getLogsByUsername(username);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/secret/{secretKey}")
    @Operation(summary = "Get logs by secret key", description = "Retrieves audit logs for a specific secret")
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
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLogResponse> logs = auditService.getLogsByDateRange(start, end, pageable);
        return ResponseEntity.ok(logs);
    }
}

