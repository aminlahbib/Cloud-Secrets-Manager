package com.secrets.service.rotation;

public interface SecretRotationStrategy {
    /**
     * Generate a new secret value based on the current value.
     * 
     * @param currentValue The current secret value (decrypted)
     * @return The new rotated secret value (decrypted)
     */
    String rotate(String currentValue);
    
    /**
     * @return The identifier for this strategy (e.g., "DEFAULT", "DATABASE", "API_KEY")
     */
    String getStrategyType();
}

