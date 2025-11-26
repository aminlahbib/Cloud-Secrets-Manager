package com.secrets.service;

import com.secrets.entity.Secret;
import com.secrets.entity.SecretVersion;
import com.secrets.exception.SecretNotFoundException;
import com.secrets.repository.SecretRepository;
import com.secrets.repository.SecretVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SecretVersionService {

    private static final Logger log = LoggerFactory.getLogger(SecretVersionService.class);

    private final SecretVersionRepository secretVersionRepository;
    private final SecretRepository secretRepository;

    public SecretVersionService(SecretVersionRepository secretVersionRepository, SecretRepository secretRepository) {
        this.secretVersionRepository = secretVersionRepository;
        this.secretRepository = secretRepository;
    }

    /**
     * Create a new version of a secret (v3 - uses UUID)
     */
    @Transactional
    public SecretVersion createVersion(Secret secret, java.util.UUID createdBy, String changeNote) {
        // Get the next version number
        Integer nextVersion = secretVersionRepository.findMaxVersionNumberBySecretId(secret.getId())
            .map(v -> v + 1)
            .orElse(1);

        SecretVersion version = new SecretVersion();
        version.setSecretId(secret.getId());
        version.setSecret(secret);
        version.setVersionNumber(nextVersion);
        version.setEncryptedValue(secret.getEncryptedValue());
        version.setCreatedBy(createdBy);
        version.setChangeNote(changeNote);

        SecretVersion savedVersion = secretVersionRepository.save(version);
        log.debug("Created version {} for secret: {}", nextVersion, secret.getSecretKey());
        return savedVersion;
    }

    /**
     * Create a new version of a secret (legacy - uses String for createdBy)
     */
    @Transactional
    @Deprecated
    public SecretVersion createVersion(Secret secret, String changedBy, String changeDescription) {
        // Try to parse as UUID, otherwise use legacy method
        try {
            java.util.UUID userId = java.util.UUID.fromString(changedBy);
            return createVersion(secret, userId, changeDescription);
        } catch (IllegalArgumentException e) {
            // Legacy: use secretId-based lookup (fallback)
            Integer nextVersion = secretVersionRepository.findMaxVersionNumberBySecretId(secret.getId())
                .map(v -> v + 1)
                .orElse(1);

            SecretVersion version = new SecretVersion();
            version.setSecretId(secret.getId());
            version.setSecret(secret);
            version.setVersionNumber(nextVersion);
            version.setEncryptedValue(secret.getEncryptedValue());
            version.setChangeNote(changeDescription);
            // Note: createdBy cannot be set from string in v3 - this is a legacy method limitation
            // In production, resolve user by email first to get UUID

            return secretVersionRepository.save(version);
        }
    }

    /**
     * Get all versions of a secret, ordered by version number (newest first)
     */
    @Transactional(readOnly = true)
    public List<SecretVersion> getVersions(String secretKey) {
        if (!secretRepository.existsBySecretKey(secretKey)) {
            throw new SecretNotFoundException("Secret with key '" + secretKey + "' not found");
        }

        return secretVersionRepository.findBySecretKeyOrderByVersionNumberDesc(secretKey);
    }

    /**
     * Get a specific version of a secret (legacy - uses secretKey)
     */
    @Transactional(readOnly = true)
    @Deprecated
    public SecretVersion getVersion(String secretKey, Integer versionNumber) {
        // This is a legacy method - in v3, use getVersion(UUID secretId, Integer versionNumber)
        // For now, we need to find the secret first, then get the version
        com.secrets.entity.Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + secretKey + "' not found"));
        
        SecretVersion version = secretVersionRepository.findBySecretIdAndVersionNumber(secret.getId(), versionNumber)
            .orElseThrow(() -> new SecretNotFoundException(
                String.format("Version %d of secret '%s' not found", versionNumber, secretKey)
            ));

        return version;
    }

    /**
     * Rollback a secret to a specific version
     */
    @Transactional
    public Secret rollbackToVersion(String secretKey, Integer versionNumber, String rolledBackBy) {
        // Get the secret
        Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + secretKey + "' not found"));

        // Get the version to rollback to
        SecretVersion targetVersion = getVersion(secretKey, versionNumber);

        // Save current state as a new version before rollback
        createVersion(secret, rolledBackBy, 
            String.format("Pre-rollback snapshot before rolling back to version %d", versionNumber));

        // Rollback: restore the encrypted value from the target version
        secret.setEncryptedValue(targetVersion.getEncryptedValue());
        Secret rolledBackSecret = secretRepository.save(secret);

        // Create a version entry for the rollback
        createVersion(rolledBackSecret, rolledBackBy, 
            String.format("Rolled back to version %d", versionNumber));

        log.info("Secret '{}' rolled back to version {}", secretKey, versionNumber);
        return rolledBackSecret;
    }

    /**
     * Get the current version number for a secret (legacy)
     */
    @Transactional(readOnly = true)
    @Deprecated
    public Integer getCurrentVersionNumber(String secretKey) {
        com.secrets.entity.Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + secretKey + "' not found"));
        return secretVersionRepository.findMaxVersionNumberBySecretId(secret.getId())
            .orElse(0);
    }

    /**
     * Get the total number of versions for a secret (legacy)
     */
    @Transactional(readOnly = true)
    @Deprecated
    public Long getVersionCount(String secretKey) {
        com.secrets.entity.Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + secretKey + "' not found"));
        return secretVersionRepository.countBySecretId(secret.getId());
    }
}

