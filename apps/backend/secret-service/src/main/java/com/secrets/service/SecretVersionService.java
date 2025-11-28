package com.secrets.service;

import com.secrets.entity.Secret;
import com.secrets.entity.SecretVersion;
import com.secrets.repository.SecretVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecretVersionService {

    private static final Logger log = LoggerFactory.getLogger(SecretVersionService.class);

    private final SecretVersionRepository secretVersionRepository;

    public SecretVersionService(SecretVersionRepository secretVersionRepository) {
        this.secretVersionRepository = secretVersionRepository;
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
}
