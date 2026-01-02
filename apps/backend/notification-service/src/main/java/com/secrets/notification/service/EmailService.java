package com.secrets.notification.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.secrets.notification.entity.EmailDelivery;
import com.secrets.notification.repository.EmailDeliveryRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for sending email notifications using SendGrid.
 * Moved from secret-service so that notification-service owns
 * all outbound email delivery.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm");

    private final EmailTemplateService templateService;
    private final EmailRetryService retryService;
    private final EmailDeliveryRepository emailDeliveryRepository;

    @Value("${email.enabled:true}")
    private boolean emailEnabled;

    @Value("${email.sendgrid.api-key:}")
    private String sendGridApiKey;

    @Value("${email.from.address:noreply@cloudsecrets.com}")
    private String fromAddress;

    @Value("${email.from.name:Cloud Secrets Manager}")
    private String fromName;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public EmailService(EmailTemplateService templateService, EmailRetryService retryService,
                       EmailDeliveryRepository emailDeliveryRepository) {
        if (templateService == null) {
            throw new IllegalArgumentException("EmailTemplateService cannot be null");
        }
        if (retryService == null) {
            throw new IllegalArgumentException("EmailRetryService cannot be null");
        }
        if (emailDeliveryRepository == null) {
            throw new IllegalArgumentException("EmailDeliveryRepository cannot be null");
        }
        this.templateService = templateService;
        this.retryService = retryService;
        this.emailDeliveryRepository = emailDeliveryRepository;
    }

    public void sendInvitationEmail(String recipientEmail, String token, String projectName, String inviterName) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Attempted to send invitation email to null or blank email address");
            return;
        }
        
        if (token == null || token.isBlank()) {
            log.warn("Attempted to send invitation email with null or blank token");
            return;
        }
        
        if (!emailEnabled) {
            log.debug("Email notifications disabled, skipping invitation email to {}", recipientEmail);
            return;
        }

        String subject = String.format("You've been invited to %s", projectName);
        // Use signup page with invitation token - will redirect to login if user exists
        String acceptLink = String.format("%s/signup?invite=%s", appBaseUrl, token);

        String htmlBody = templateService.renderInvitationEmail(inviterName, projectName, acceptLink);
        String plainBody = String.format("""
                Hi,

                %s has invited you to collaborate on the project "%s" in Cloud Secrets Manager.

                Click the link below to accept the invitation:
                %s

                This invitation will expire in 7 days.

                If you didn't expect this invitation, you can safely ignore this email.

                ---
                Cloud Secrets Manager
                Secure secret management for teams
                """, inviterName, projectName, acceptLink);

        EmailDelivery delivery = createEmailDelivery(recipientEmail, subject, "INVITATION");
        retryService.executeWithRetry(
            () -> sendEmailSync(recipientEmail, subject, htmlBody, plainBody, delivery),
            "sendInvitationEmail"
        );
        log.info("Queued invitation email to {} for project {}", recipientEmail, projectName);
    }

    public void sendExpirationWarning(String recipientEmail, String secretKey, String projectName,
                                      LocalDateTime expiresAt) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Attempted to send expiration warning to null or blank email address");
            return;
        }
        
        if (secretKey == null || secretKey.isBlank()) {
            log.warn("Attempted to send expiration warning with null or blank secret key");
            return;
        }
        
        if (expiresAt == null) {
            log.warn("Attempted to send expiration warning with null expiration date");
            return;
        }
        
        if (!emailEnabled) {
            log.debug("Email notifications disabled, skipping expiration warning to {}", recipientEmail);
            return;
        }

        String subject = String.format("Secret Expiration Warning: %s", secretKey);
        String formattedDate = expiresAt.format(DATE_FORMATTER);
        String projectLink = String.format("%s/projects", appBaseUrl);

        String htmlBody = templateService.renderExpirationWarningEmail(secretKey, projectName, expiresAt, projectLink);
        String plainBody = String.format("""
                Hi,

                This is a reminder that your secret "%s" in project "%s" will expire soon.

                Expiration Date: %s

                To prevent service disruptions, please:
                1. Rotate the secret before it expires
                2. Update the expiration date
                3. Or remove the expiration if no longer needed

                Manage your secrets: %s

                ---
                Cloud Secrets Manager
                Secure secret management for teams
                """, secretKey, projectName, formattedDate, projectLink);

        EmailDelivery delivery = createEmailDelivery(recipientEmail, subject, "EXPIRATION_WARNING");
        retryService.executeWithRetry(
            () -> sendEmailSync(recipientEmail, subject, htmlBody, plainBody, delivery),
            "sendExpirationWarning"
        );
        log.info("Queued expiration warning to {} for secret {} (expires: {})", recipientEmail, secretKey, formattedDate);
    }

    public void sendMembershipChangeEmail(String recipientEmail, String projectName, String oldRole, String newRole) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Attempted to send membership change email to null or blank email address");
            return;
        }
        
        if (projectName == null || projectName.isBlank()) {
            log.warn("Attempted to send membership change email with null or blank project name");
            return;
        }
        
        if (newRole == null || newRole.isBlank()) {
            log.warn("Attempted to send membership change email with null or blank new role");
            return;
        }
        
        if (!emailEnabled) {
            log.debug("Email notifications disabled, skipping membership change email to {}", recipientEmail);
            return;
        }

        String subject = String.format("Your role in %s has changed", projectName);
        String projectLink = String.format("%s/projects", appBaseUrl);

        String htmlBody = templateService.renderRoleChangeEmail(projectName, oldRole, newRole, projectLink);
        String plainBody = String.format("""
                Hi,

                Your role in the project "%s" has been updated.

                Previous Role: %s
                New Role: %s

                View project: %s

                If you have questions about this change, please contact the project owner.

                ---
                Cloud Secrets Manager
                Secure secret management for teams
                """, projectName, oldRole, newRole, projectLink);

        EmailDelivery delivery = createEmailDelivery(recipientEmail, subject, "ROLE_CHANGE");
        retryService.executeWithRetry(
            () -> sendEmailSync(recipientEmail, subject, htmlBody, plainBody, delivery),
            "sendMembershipChangeEmail"
        );
        log.info("Queued membership change email to {} for project {} ({} -> {})",
                recipientEmail, projectName, oldRole, newRole);
    }

    private EmailDelivery createEmailDelivery(String recipientEmail, String subject, String emailType) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new IllegalArgumentException("Recipient email cannot be null or blank");
        }
        
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Email subject cannot be null or blank");
        }
        
        if (emailType == null || emailType.isBlank()) {
            throw new IllegalArgumentException("Email type cannot be null or blank");
        }
        
        EmailDelivery delivery = new EmailDelivery();
        delivery.setRecipientEmail(recipientEmail);
        delivery.setSubject(subject.length() > 500 ? subject.substring(0, 500) : subject); // Enforce max length
        delivery.setEmailType(emailType.length() > 50 ? emailType.substring(0, 50) : emailType); // Enforce max length
        delivery.setStatus(EmailDelivery.DeliveryStatus.PENDING);
        return emailDeliveryRepository.save(delivery);
    }

    /**
     * Send email synchronously with circuit breaker and retry protection.
     * Uses Resilience4j circuit breaker to prevent cascading failures.
     */
    @CircuitBreaker(name = "sendgrid", fallbackMethod = "sendEmailFallback")
    @Retry(name = "sendgrid")
    private boolean sendEmailSync(String to, String subject, String htmlBody, String plainBody, EmailDelivery delivery) {
        if (!emailEnabled) {
            delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
            delivery.setErrorMessage("Email notifications disabled");
            emailDeliveryRepository.save(delivery);
            return true; // Not an error, just disabled
        }

        if (sendGridApiKey == null || sendGridApiKey.isBlank()) {
            delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
            delivery.setErrorMessage("SendGrid API key not configured");
            emailDeliveryRepository.save(delivery);
            log.warn(
                    "SendGrid API key not configured. Email to {} not sent. Set SENDGRID_API_KEY environment variable.",
                    to);
            return false;
        }

        try {
            Email from = new Email(fromAddress, fromName);
            Email toEmail = new Email(to);
            Content htmlContent = new Content("text/html", htmlBody);
            Content plainContent = new Content("text/plain", plainBody);
            Mail mail = new Mail(from, subject, toEmail, plainContent);
            mail.addContent(htmlContent);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            int statusCode = response.getStatusCode();
            
            // Handle different HTTP status codes
            if (statusCode >= 200 && statusCode < 300) {
                // Success
                delivery.setStatus(EmailDelivery.DeliveryStatus.SENT);
                delivery.setSentAt(Instant.now());
                // Extract SendGrid message ID from response headers if available
                String messageId = response.getHeaders().get("X-Message-Id");
                if (messageId != null) {
                    delivery.setSendgridMessageId(messageId);
                }
                emailDeliveryRepository.save(delivery);
                log.debug("Email sent successfully to {}: HTTP {}", to, statusCode);
                return true;
            } else if (statusCode >= 400 && statusCode < 500) {
                // Client errors (4xx) - likely permanent, don't retry
                delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
                delivery.setErrorMessage(String.format("HTTP %d: %s", statusCode, response.getBody()));
                emailDeliveryRepository.save(delivery);
                log.error("Failed to send email to {}: HTTP {} - {} (client error, not retrying)",
                        to, statusCode, response.getBody());
                return false;
            } else {
                // Server errors (5xx) - transient, will retry
                delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
                delivery.setErrorMessage(String.format("HTTP %d: %s", statusCode, response.getBody()));
                delivery.setRetryCount(delivery.getRetryCount() + 1);
                emailDeliveryRepository.save(delivery);
                log.warn("Failed to send email to {}: HTTP {} - {} (server error, will retry)",
                        to, statusCode, response.getBody());
                throw new RuntimeException("SendGrid server error: " + statusCode);
            }
        } catch (SocketTimeoutException ex) {
            // Timeout - transient error
            delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
            delivery.setErrorMessage("SendGrid request timeout: " + ex.getMessage());
            delivery.setRetryCount(delivery.getRetryCount() + 1);
            emailDeliveryRepository.save(delivery);
            log.warn("SendGrid request timeout for email to {}: {}", to, ex.getMessage());
            throw new RuntimeException("SendGrid request timeout", ex); // Wrap for retry mechanism
        } catch (IOException ex) {
            // Network errors - transient
            delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
            delivery.setErrorMessage("Network error: " + ex.getMessage());
            delivery.setRetryCount(delivery.getRetryCount() + 1);
            emailDeliveryRepository.save(delivery);
            log.warn("Network error sending email to {}: {}", to, ex.getMessage());
            throw new RuntimeException("Network error sending email", ex); // Wrap for retry mechanism
        } catch (Exception ex) {
            // Check if it's a SendGrid-related error by message
            if (ex.getMessage() != null && ex.getMessage().contains("SendGrid")) {
                delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
                delivery.setErrorMessage("SendGrid error: " + ex.getMessage());
                delivery.setRetryCount(delivery.getRetryCount() + 1);
                emailDeliveryRepository.save(delivery);
                log.error("SendGrid exception sending email to {}: {}", to, ex.getMessage(), ex);
                throw new RuntimeException("SendGrid error", ex); // Wrap for retry mechanism
            }
            // Unexpected errors
            delivery.setStatus(EmailDelivery.DeliveryStatus.FAILED);
            delivery.setErrorMessage("Unexpected error: " + ex.getMessage());
            delivery.setRetryCount(delivery.getRetryCount() + 1);
            emailDeliveryRepository.save(delivery);
            log.error("Unexpected error sending email to {}: {}", to, ex.getMessage(), ex);
            throw new RuntimeException("Unexpected error sending email", ex);
        }
    }
    
    /**
     * Fallback method when circuit breaker is open.
     * This method is called by Resilience4j when the circuit breaker is open.
     */
    @SuppressWarnings("unused")
    private boolean sendEmailFallback(String to, String subject, String htmlBody, String plainBody, 
                                     EmailDelivery delivery, Exception ex) {
        log.warn("Circuit breaker open for SendGrid. Email to {} queued for later retry. Error: {}", 
                to, ex.getMessage());
        delivery.setStatus(EmailDelivery.DeliveryStatus.PENDING);
        delivery.setErrorMessage("Circuit breaker open: " + ex.getMessage());
        emailDeliveryRepository.save(delivery);
        return false; // Will be retried later
    }
}


