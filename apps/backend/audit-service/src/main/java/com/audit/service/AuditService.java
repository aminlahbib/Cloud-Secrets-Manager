package com.audit.service;

import com.audit.dto.AuditLogRequest;
import com.audit.dto.AuditLogResponse;
import com.audit.entity.AuditLog;
import com.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
        log.debug("Logging audit event: {} for user: {}", request.getAction(), request.getUsername());

        AuditLog auditLog = AuditLog.builder()
            .username(request.getUsername())
            .action(request.getAction())
            .secretKey(request.getSecretKey())
            .ipAddress(getClientIpAddress(httpRequest))
            .userAgent(httpRequest.getHeader("User-Agent"))
            .build();

        AuditLog savedLog = auditLogRepository.save(auditLog);
        log.info("Audit event logged: {} for user: {}", request.getAction(), request.getUsername());

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

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByUsername(String username) {
        log.debug("Retrieving audit logs for user: {}", username);
        return auditLogRepository.findByUsername(username).stream()
            .map(AuditLogResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsBySecretKey(String secretKey) {
        log.debug("Retrieving audit logs for secret key: {}", secretKey);
        return auditLogRepository.findBySecretKey(secretKey).stream()
            .map(AuditLogResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByDateRange(
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable) {
        log.debug("Retrieving audit logs between {} and {}", start, end);
        return auditLogRepository.findByTimestampBetween(start, end, pageable)
            .map(AuditLogResponse::from);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
