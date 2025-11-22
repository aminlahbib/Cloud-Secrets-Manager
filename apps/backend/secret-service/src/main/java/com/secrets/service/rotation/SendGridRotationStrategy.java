package com.secrets.service.rotation;

import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class SendGridRotationStrategy implements SecretRotationStrategy {

    @Override
    public String rotate(String currentValue) {
        // In a real implementation, this would call SendGrid API to generate a new API Key
        // For this demonstration, we simulate a new API Key
        return "SG." + UUID.randomUUID().toString().replace("-", "") + ".mock_generated_key";
    }

    @Override
    public String getStrategyType() {
        return "SENDGRID";
    }
}

