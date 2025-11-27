package com.secrets.util;

import com.secrets.entity.Secret;
import com.secrets.service.EncryptionService;
import org.springframework.stereotype.Component;

/**
 * Utility class for encryption operations
 * Extracted from SecretService for v3 architecture cleanup
 */
@Component
public class EncryptionUtil {

    private final EncryptionService encryptionService;

    public EncryptionUtil(EncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    /**
     * Decrypt a secret's encrypted value
     */
    public String decryptSecretValue(Secret secret) {
        return encryptionService.decrypt(secret.getEncryptedValue());
    }

    /**
     * Decrypt an arbitrary encrypted payload
     */
    public String decrypt(String encryptedValue) {
        return encryptionService.decrypt(encryptedValue);
    }
}
