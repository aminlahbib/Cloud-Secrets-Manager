package com.secrets.notification.controller;

import com.secrets.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for testing email functionality.
 */
@RestController
@RequestMapping("/api/internal/email")
public class EmailTestController {

    private static final Logger log = LoggerFactory.getLogger(EmailTestController.class);

    private final EmailService emailService;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Test email sending - sends a test invitation email
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testEmail(
            Authentication authentication,
            @RequestParam(value = "recipient", required = false) String recipientEmail) {
        
        String userEmail = authentication != null ? authentication.getName() : "test@example.com";
        String testRecipient = recipientEmail != null ? recipientEmail : userEmail;
        
        try {
            // Send a test invitation email
            String testToken = "test-token-" + System.currentTimeMillis();
            emailService.sendInvitationEmail(
                testRecipient,
                testToken,
                "Test Project",
                "Test User"
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Test email sent successfully");
            response.put("recipient", testRecipient);
            response.put("note", "Check your inbox (and spam folder) for the test invitation email");
            
            log.info("Test email sent to {}", testRecipient);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            log.error("Failed to send test email: {}", ex.getMessage(), ex);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to send test email: " + ex.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}

