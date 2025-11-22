package com.secrets.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${google.cloud.identity.enabled:false}")
    private boolean enabled;

    @Value("${google.cloud.identity.project-id:}")
    private String projectId;

    @Value("${google.cloud.identity.service-account-path:}")
    private String serviceAccountPath;

    @PostConstruct
    public void initialize() {
        if (!enabled) {
            log.info("Google Cloud Identity Platform is disabled");
            return;
        }

        if (projectId == null || projectId.isEmpty()) {
            log.warn("Google Cloud Identity Platform is enabled but project-id is not configured");
            return;
        }

        if (serviceAccountPath == null || serviceAccountPath.isEmpty()) {
            log.warn("Google Cloud Identity Platform is enabled but service-account-path is not configured");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getServiceAccountInputStream();
                
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId(projectId)
                    .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully for project: {}", projectId);
            } else {
                log.info("Firebase Admin SDK already initialized");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK", e);
            throw new RuntimeException("Firebase initialization failed", e);
        }
    }

    @Bean
    @org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
        name = "google.cloud.identity.enabled",
        havingValue = "true",
        matchIfMissing = false
    )
    public FirebaseAuth firebaseAuth() {
        if (!enabled) {
            log.debug("Google Cloud Identity Platform is disabled, not creating FirebaseAuth bean");
            return null;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                log.warn("Firebase not initialized, returning null");
                return null;
            }
            return FirebaseAuth.getInstance();
        } catch (IllegalStateException e) {
            log.warn("Firebase not initialized, returning null");
            return null;
        }
    }

    private InputStream getServiceAccountInputStream() throws IOException {
        // Try as file path first (for Docker/K8s)
        try {
            return new FileInputStream(serviceAccountPath);
        } catch (Exception e) {
            // Fall back to classpath (for local dev)
            String classpathPath = serviceAccountPath.startsWith("classpath:") 
                ? serviceAccountPath.replace("classpath:", "") 
                : serviceAccountPath;
            
            InputStream resourceStream = getClass().getClassLoader()
                .getResourceAsStream(classpathPath);
            
            if (resourceStream == null) {
                throw new IOException("Service account file not found at: " + serviceAccountPath);
            }
            
            return resourceStream;
        }
    }
}

