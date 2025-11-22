package com.secrets.service.rotation;

import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class PostgresRotationStrategy implements SecretRotationStrategy {

    @Override
    public String rotate(String currentValue) {
        // In a real implementation, this would connect to PostgreSQL and change the password
        // For this demonstration, we generate a strong random password
        byte[] randomBytes = new byte[24];
        new SecureRandom().nextBytes(randomBytes);
        return "pg_passwd_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    @Override
    public String getStrategyType() {
        return "POSTGRES";
    }
}

