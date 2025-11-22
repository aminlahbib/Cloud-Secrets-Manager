package com.secrets.service.rotation;

import org.springframework.stereotype.Component;

@Component
public class DefaultRotationStrategy implements SecretRotationStrategy {

    @Override
    public String rotate(String currentValue) {
        // Simple implementation: append timestamp to make it unique
        // In production, use a proper secret generation library or service
        return currentValue + "-rotated-" + System.currentTimeMillis();
    }

    @Override
    public String getStrategyType() {
        return "DEFAULT";
    }
}

