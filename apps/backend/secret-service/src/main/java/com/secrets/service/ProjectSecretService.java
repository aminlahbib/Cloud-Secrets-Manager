package com.secrets.service;

import com.secrets.client.AuditClient;
import com.secrets.dto.SecretRequest;
import com.secrets.entity.Secret;
import com.secrets.entity.SecretVersion;
import com.secrets.exception.SecretAlreadyExistsException;
import com.secrets.exception.SecretNotFoundException;
import com.secrets.entity.User;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.SecretRepository;
import com.secrets.repository.SecretVersionRepository;
import com.secrets.service.rotation.DefaultRotationStrategy;
import com.secrets.service.rotation.SecretRotationStrategy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import java.util.List;
import java.util.Locale;

/**
 * Service for project-scoped secret operations (v3 architecture)
 */
@Service
@Transactional
public class ProjectSecretService {

    private static final Logger log = LoggerFactory.getLogger(ProjectSecretService.class);

    private final SecretRepository secretRepository;
    private final ProjectRepository projectRepository;
    private final EncryptionService encryptionService;
    private final SecretVersionService secretVersionService;
    private final SecretVersionRepository secretVersionRepository;
    private final ProjectPermissionService permissionService;
    private final AuditClient auditClient;
    private final UserService userService;
    private final List<SecretRotationStrategy> rotationStrategies;

    public ProjectSecretService(SecretRepository secretRepository,
                               ProjectRepository projectRepository,
                               EncryptionService encryptionService,
                               SecretVersionService secretVersionService,
                               SecretVersionRepository secretVersionRepository,
                               ProjectPermissionService permissionService,
                               AuditClient auditClient,
                               UserService userService,
                               List<SecretRotationStrategy> rotationStrategies) {
        this.secretRepository = secretRepository;
        this.projectRepository = projectRepository;
        this.encryptionService = encryptionService;
        this.secretVersionService = secretVersionService;
        this.secretVersionRepository = secretVersionRepository;
        this.permissionService = permissionService;
        this.auditClient = auditClient;
        this.userService = userService;
        this.rotationStrategies = rotationStrategies;
    }

    /**
     * List secrets in a project
     */
    @Transactional(readOnly = true)
    public Page<Secret> listProjectSecrets(UUID projectId, UUID userId, String keyword, Pageable pageable) {
        // Check access
        if (!permissionService.canViewProject(projectId, userId)) {
            throw new AccessDeniedException("Access denied to project");
        }

        // Verify project exists
        projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (keyword != null && !keyword.trim().isEmpty()) {
            return secretRepository.findByProjectIdAndKeyword(projectId, keyword.trim(), pageable);
        } else {
            return secretRepository.findByProjectId(projectId, pageable);
        }
    }

    /**
     * Get a secret from a project
     */
    @Transactional(readOnly = true)
    public Secret getProjectSecret(UUID projectId, String secretKey, UUID userId) {
        // Check access
        if (!permissionService.canViewProject(projectId, userId)) {
            throw new AccessDeniedException("Access denied to project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_READ", secretKey, username);

        return secret;
    }

    /**
     * Create a secret in a project
     */
    public Secret createProjectSecret(UUID projectId, SecretRequest request, UUID userId) {
        // Check permission
        if (!permissionService.canCreateSecrets(projectId, userId)) {
            throw new AccessDeniedException("You don't have permission to create secrets in this project");
        }

        // Verify project exists
        projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check if secret key already exists in this project
        if (secretRepository.existsByProjectIdAndSecretKey(projectId, request.getKey())) {
            throw new SecretAlreadyExistsException("Secret with key '" + request.getKey() + "' already exists in this project");
        }

        String encryptedValue = encryptionService.encrypt(request.getValue());

        Secret secret = new Secret();
        secret.setProjectId(projectId);
        secret.setSecretKey(request.getKey());
        secret.setEncryptedValue(encryptedValue);
        secret.setDescription(normalizeDescription(request.getDescription()));
        secret.setExpiresAt(parseTimestamp(request.getExpiresAt()));
        secret.setCreatedBy(userId);

        Secret saved = secretRepository.save(secret);

        // Create initial version
        secretVersionService.createVersion(saved, userId, "Initial version");

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_CREATE", request.getKey(), username);

        log.info("Created secret {} in project {}", request.getKey(), projectId);
        return saved;
    }

    /**
     * Update a secret in a project
     */
    public Secret updateProjectSecret(UUID projectId, String secretKey, SecretRequest request, UUID userId) {
        // Check permission
        if (!permissionService.canUpdateSecrets(projectId, userId)) {
            throw new AccessDeniedException("You don't have permission to update secrets in this project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        String encryptedValue = encryptionService.encrypt(request.getValue());
        secret.setEncryptedValue(encryptedValue);
        secret.setUpdatedBy(userId);
        if (request.getDescription() != null) {
            secret.setDescription(normalizeDescription(request.getDescription()));
        }
        if (request.getExpiresAt() != null) {
            secret.setExpiresAt(parseTimestamp(request.getExpiresAt()));
        }

        Secret saved = secretRepository.save(secret);

        // Create new version
        secretVersionService.createVersion(saved, userId, "Secret value updated");

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_UPDATE", secretKey, username);

        log.info("Updated secret {} in project {}", secretKey, projectId);
        return saved;
    }

    /**
     * Delete a secret from a project
     */
    public void deleteProjectSecret(UUID projectId, String secretKey, UUID userId) {
        // Check permission
        if (!permissionService.canDeleteSecrets(projectId, userId)) {
            throw new AccessDeniedException("You don't have permission to delete secrets in this project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        // Delete all versions
        secretVersionRepository.deleteBySecretId(secret.getId());

        // Delete the secret
        secretRepository.delete(secret);

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_DELETE", secretKey, username);

        log.info("Deleted secret {} from project {}", secretKey, projectId);
    }

    /**
     * Rotate a secret in a project
     */
    public Secret rotateProjectSecret(UUID projectId, String secretKey, UUID userId) {
        // Check permission
        if (!permissionService.canRotateSecrets(projectId, userId)) {
            throw new AccessDeniedException("You don't have permission to rotate secrets in this project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        // Generate new value using context-aware rotation strategy
        String currentValue = encryptionService.decrypt(secret.getEncryptedValue());
        SecretRotationStrategy strategy = resolveRotationStrategy(secret);
        String newValue = strategy.rotate(currentValue);
        String encryptedValue = encryptionService.encrypt(newValue);

        secret.setEncryptedValue(encryptedValue);
        secret.setUpdatedBy(userId);
        secret.setLastRotatedAt(java.time.LocalDateTime.now());

        Secret saved = secretRepository.save(secret);

        // Create new version
        secretVersionService.createVersion(saved, userId, "Secret rotated");

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_ROTATE", secretKey, username);

        log.info("Rotated secret {} in project {}", secretKey, projectId);
        return saved;
    }

    /**
     * Move a secret to another project
     */
    public Secret moveSecret(UUID sourceProjectId, String secretKey, UUID targetProjectId, UUID userId) {
        // Check permission on source project (OWNER or ADMIN)
        if (!permissionService.canMoveSecrets(sourceProjectId, userId)) {
            throw new AccessDeniedException("You don't have permission to move secrets from this project");
        }

        // Check access to target project (at least MEMBER)
        if (!permissionService.isMemberOrHigher(targetProjectId, userId)) {
            throw new AccessDeniedException("You don't have access to the target project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(sourceProjectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        // Check if key already exists in target project
        if (secretRepository.existsByProjectIdAndSecretKey(targetProjectId, secretKey)) {
            throw new SecretAlreadyExistsException("Secret with key '" + secretKey + "' already exists in target project");
        }

        // Move secret
        secret.setProjectId(targetProjectId);
        secret.setUpdatedBy(userId);
        Secret saved = secretRepository.save(secret);

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_MOVE", secretKey, username);

        log.info("Moved secret {} from project {} to {}", secretKey, sourceProjectId, targetProjectId);
        return saved;
    }

    /**
     * Copy a secret to another project
     */
    public Secret copySecret(UUID sourceProjectId, String secretKey, UUID targetProjectId, String newKey, UUID userId) {
        // Check permission on source project (OWNER or ADMIN)
        if (!permissionService.canMoveSecrets(sourceProjectId, userId)) {
            throw new AccessDeniedException("You don't have permission to copy secrets from this project");
        }

        // Check access to target project (at least MEMBER)
        if (!permissionService.isMemberOrHigher(targetProjectId, userId)) {
            throw new AccessDeniedException("You don't have access to the target project");
        }

        Secret sourceSecret = secretRepository.findByProjectIdAndSecretKey(sourceProjectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        String targetKey = newKey != null ? newKey : secretKey;

        // Check if key already exists in target project
        if (secretRepository.existsByProjectIdAndSecretKey(targetProjectId, targetKey)) {
            throw new SecretAlreadyExistsException("Secret with key '" + targetKey + "' already exists in target project");
        }

        // Copy secret
        Secret copiedSecret = new Secret();
        copiedSecret.setProjectId(targetProjectId);
        copiedSecret.setSecretKey(targetKey);
        copiedSecret.setEncryptedValue(sourceSecret.getEncryptedValue()); // Same encrypted value
        copiedSecret.setDescription(sourceSecret.getDescription());
        copiedSecret.setCreatedBy(userId);
        copiedSecret.setExpiresAt(sourceSecret.getExpiresAt());

        Secret saved = secretRepository.save(copiedSecret);

        // Create initial version
        secretVersionService.createVersion(saved, userId, 
            String.format("Copied from project %s", sourceProjectId));

        // Audit log
        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_COPY", secretKey, username);

        log.info("Copied secret {} from project {} to {} as {}", secretKey, sourceProjectId, targetProjectId, targetKey);
        return saved;
    }

    /**
     * Get version history for a secret
     */
    @Transactional(readOnly = true)
    public java.util.List<com.secrets.entity.SecretVersion> getSecretVersions(UUID projectId, String secretKey, UUID userId) {
        // Check access
        if (!permissionService.canViewProject(projectId, userId)) {
            throw new AccessDeniedException("Access denied to project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        return secretVersionRepository.findBySecretIdOrderByVersionNumberDesc(secret.getId());
    }

    /**
     * Get a specific version of a secret
     */
    @Transactional(readOnly = true)
    public com.secrets.entity.SecretVersion getSecretVersion(UUID projectId, String secretKey, Integer versionNumber, UUID userId) {
        if (!permissionService.canViewProject(projectId, userId)) {
            throw new AccessDeniedException("Access denied to project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        return secretVersionRepository.findBySecretIdAndVersionNumber(secret.getId(), versionNumber)
            .orElseThrow(() -> new SecretNotFoundException(
                String.format("Version %d of secret %s not found", versionNumber, secretKey)
            ));
    }

    /**
     * Restore a secret to a previous version
     */
    @Transactional
    public Secret restoreSecretVersion(UUID projectId, String secretKey, Integer versionNumber, UUID userId) {
        if (!permissionService.canUpdateSecrets(projectId, userId)) {
            throw new AccessDeniedException("You don't have permission to restore versions in this project");
        }

        Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret not found"));

        SecretVersion targetVersion = secretVersionRepository.findBySecretIdAndVersionNumber(secret.getId(), versionNumber)
            .orElseThrow(() -> new SecretNotFoundException(
                String.format("Version %d of secret %s not found", versionNumber, secretKey)
            ));

        secret.setEncryptedValue(targetVersion.getEncryptedValue());
        secret.setUpdatedBy(userId);
        Secret saved = secretRepository.save(secret);

        secretVersionService.createVersion(saved, userId,
            String.format("Restored to version %d", versionNumber));

        User user = userService.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : userId.toString();
        auditClient.logEvent("SECRET_ROLLBACK", secretKey, username);

        log.info("Restored secret {} in project {} to version {}", secretKey, projectId, versionNumber);
        return saved;
    }

    private SecretRotationStrategy resolveRotationStrategy(Secret secret) {
        String explicitStrategy = extractStrategyToken(secret.getDescription());
        if (explicitStrategy != null) {
            return getStrategyByType(explicitStrategy);
        }

        String key = secret.getSecretKey() != null ? secret.getSecretKey().toUpperCase(Locale.ROOT) : "";
        if (key.contains("POSTGRES") || key.contains("PG_") || key.contains("DATABASE")) {
            return getStrategyByType("POSTGRES");
        }
        if (key.contains("SENDGRID") || key.contains("SG.")) {
            return getStrategyByType("SENDGRID");
        }

        return getStrategyByType("DEFAULT");
    }

    private String extractStrategyToken(String description) {
        if (description == null) {
            return null;
        }
        String normalized = description.toUpperCase(Locale.ROOT);
        String token = findToken(normalized, "ROTATION=");
        if (token != null) {
            return token;
        }
        return findToken(normalized, "STRATEGY=");
    }

    private String findToken(String source, String marker) {
        int idx = source.indexOf(marker);
        if (idx < 0) {
            return null;
        }
        int start = idx + marker.length();
        int end = findDelimiter(source, start);
        if (start >= end) {
            return null;
        }
        return source.substring(start, end).trim();
    }

    private int findDelimiter(String source, int start) {
        for (int i = start; i < source.length(); i++) {
            char c = source.charAt(i);
            if (c == ']' || c == ')' || Character.isWhitespace(c)) {
                return i;
            }
        }
        return source.length();
    }

    private SecretRotationStrategy getStrategyByType(String type) {
        if (rotationStrategies != null) {
            for (SecretRotationStrategy strategy : rotationStrategies) {
                if (strategy.getStrategyType().equalsIgnoreCase(type)) {
                    return strategy;
                }
            }
        }
        // Fallback to the default implementation if available
        if (rotationStrategies != null && !rotationStrategies.isEmpty()) {
            return rotationStrategies.stream()
                .filter(strategy -> "DEFAULT".equalsIgnoreCase(strategy.getStrategyType()))
                .findFirst()
                .orElse(rotationStrategies.get(0));
        }
        return new DefaultRotationStrategy();
    }

    private LocalDateTime parseTimestamp(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(value);
        }
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

