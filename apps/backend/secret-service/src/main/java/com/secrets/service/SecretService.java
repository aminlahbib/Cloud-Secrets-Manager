package com.secrets.service;

import com.secrets.client.AuditClient;
import com.secrets.entity.Secret;
import com.secrets.exception.SecretAlreadyExistsException;
import com.secrets.exception.SecretNotFoundException;
import com.secrets.repository.SecretRepository;
import com.secrets.repository.SecretVersionRepository;
import com.secrets.security.Permission;
import com.secrets.security.PermissionEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecretService {

    private final SecretRepository secretRepository;
    private final EncryptionService encryptionService;
    private final AuditClient auditClient;
    private final SecretVersionService secretVersionService;
    private final SecretVersionRepository secretVersionRepository;
    private final PermissionEvaluator permissionEvaluator;

    @Transactional
    public Secret createSecret(String key, String value, String createdBy, Authentication authentication) {
        log.debug("Creating secret with key: {}", key);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.WRITE)) {
            throw new AccessDeniedException("User does not have WRITE permission");
        }
        
        if (secretRepository.existsBySecretKey(key)) {
            throw new SecretAlreadyExistsException("Secret with key '" + key + "' already exists");
        }

        String encryptedValue = encryptionService.encrypt(value);
        
        Secret secret = Secret.builder()
            .secretKey(key)
            .encryptedValue(encryptedValue)
            .createdBy(createdBy)
            .build();

        Secret savedSecret = secretRepository.save(secret);
        
        // Create initial version
        secretVersionService.createVersion(savedSecret, createdBy, "Initial version");
        
        // Async audit logging
        auditClient.logEvent("CREATE", key, createdBy);
        
        log.info("Secret created successfully with key: {}", key);
        return savedSecret;
    }

    @Transactional(readOnly = true)
    public Secret getSecret(String key, String username, Authentication authentication) {
        log.debug("Retrieving secret with key: {}", key);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.READ)) {
            throw new AccessDeniedException("User does not have READ permission");
        }
        
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));

        // Async audit logging
        auditClient.logEvent("READ", key, username);
        
        log.info("Secret retrieved successfully with key: {}", key);
        return secret;
    }

    @Transactional
    public Secret updateSecret(String key, String newValue, String updatedBy, Authentication authentication) {
        log.debug("Updating secret with key: {}", key);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.WRITE)) {
            throw new AccessDeniedException("User does not have WRITE permission");
        }
        
        Secret secret = secretRepository.findBySecretKey(key)
            .orElseThrow(() -> new SecretNotFoundException("Secret with key '" + key + "' not found"));

        String encryptedValue = encryptionService.encrypt(newValue);
        secret.setEncryptedValue(encryptedValue);
        
        Secret updatedSecret = secretRepository.save(secret);
        
        // Create new version
        secretVersionService.createVersion(updatedSecret, updatedBy, "Secret value updated");
        
        // Async audit logging
        auditClient.logEvent("UPDATE", key, updatedBy);
        
        log.info("Secret updated successfully with key: {}", key);
        return updatedSecret;
    }

    @Transactional
    public void deleteSecret(String key, String deletedBy, Authentication authentication) {
        log.debug("Deleting secret with key: {}", key);
        
        // Check permission
        if (!permissionEvaluator.isAdmin(authentication) && 
            !permissionEvaluator.hasPermission(authentication, Permission.DELETE)) {
            throw new AccessDeniedException("User does not have DELETE permission");
        }
        
        if (!secretRepository.existsBySecretKey(key)) {
            throw new SecretNotFoundException("Secret with key '" + key + "' not found");
        }

        // Delete all versions first (cascade delete)
        secretVersionRepository.deleteBySecretKey(key);
        
        // Delete the secret
        secretRepository.deleteBySecretKey(key);
        
        // Async audit logging
        auditClient.logEvent("DELETE", key, deletedBy);
        
        log.info("Secret deleted successfully with key: {}", key);
    }

    public String decryptSecretValue(Secret secret) {
        return encryptionService.decrypt(secret.getEncryptedValue());
    }
}

