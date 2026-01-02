package com.secrets.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

/**
 * Service for retrying email operations with exponential backoff.
 */
@Service
public class EmailRetryService {

    private static final Logger log = LoggerFactory.getLogger(EmailRetryService.class);
    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_DELAY_MS = 1000; // 1 second

    /**
     * Execute an email operation with retry logic and exponential backoff.
     * 
     * @param operation The email operation to execute
     * @param operationName Name of the operation for logging
     * @return CompletableFuture that completes when operation succeeds or all retries are exhausted
     */
    @Async
    public CompletableFuture<Boolean> executeWithRetry(Supplier<Boolean> operation, String operationName) {
        if (operation == null) {
            log.error("Email retry operation is null for operation '{}'", operationName);
            return CompletableFuture.completedFuture(false);
        }
        
        if (operationName == null || operationName.isBlank()) {
            operationName = "unknown";
        }
        
        int attempt = 0;
        long delay = INITIAL_DELAY_MS;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                boolean success = operation.get();
                if (success) {
                    if (attempt > 1) {
                        log.info("Email operation '{}' succeeded on attempt {}", operationName, attempt);
                    }
                    return CompletableFuture.completedFuture(true);
                } else {
                    log.warn("Email operation '{}' returned false on attempt {}", operationName, attempt);
                }
            } catch (Exception ex) {
                log.warn("Email operation '{}' failed on attempt {}: {}", operationName, attempt, ex.getMessage());
            }

            if (attempt < MAX_RETRIES) {
                try {
                    Thread.sleep(delay);
                    delay *= 2; // Exponential backoff: 1s, 2s, 4s
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("Retry delay interrupted for operation '{}'", operationName);
                    return CompletableFuture.completedFuture(false);
                }
            }
        }

        log.error("Email operation '{}' failed after {} attempts", operationName, MAX_RETRIES);
        return CompletableFuture.completedFuture(false);
    }
}
