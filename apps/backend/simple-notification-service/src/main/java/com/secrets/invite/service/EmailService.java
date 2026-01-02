package com.secrets.invite.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.MailSettings;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

/**
 * Simple email service for sending invitation emails via SendGrid.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final SendGrid sendGrid;
    private final String fromEmail;
    private final String fromName;
    private final String appBaseUrl;

    public EmailService(
            @Value("${email.sendgrid.api-key:}") String apiKey,
            @Value("${email.from.address:noreply@cloudsecrets.com}") String fromEmail,
            @Value("${email.from.name:Cloud Secrets Manager}") String fromName,
            @Value("${app.base-url:http://localhost:5173}") String appBaseUrl) {
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.appBaseUrl = appBaseUrl;
        
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("SendGrid API key not configured. Email sending will be disabled.");
            this.sendGrid = null;
        } else {
            this.sendGrid = new SendGrid(apiKey);
        }
    }

    /**
     * Send an invitation email.
     */
    public boolean sendInvitationEmail(String recipientEmail, String inviterName, String projectName, 
                                      String token, String role) {
        if (sendGrid == null) {
            log.warn("SendGrid not configured. Skipping email to {}", recipientEmail);
            return false;
        }

        try {
            String acceptUrl = appBaseUrl + "/accept-invite?token=" + token;
            
            String subject = String.format("You've been invited to collaborate on %s", projectName);
            String htmlBody = buildInvitationEmailHtml(inviterName, projectName, role, acceptUrl);
            String plainBody = buildInvitationEmailPlain(inviterName, projectName, role, acceptUrl);

            Mail mail = new Mail(
                    new Email(fromEmail, fromName),
                    subject,
                    new Email(recipientEmail),
                    new Content("text/html", htmlBody)
            );
            mail.addContent(new Content("text/plain", plainBody));

            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            var response = sendGrid.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Successfully sent invitation email to {}", recipientEmail);
                return true;
            } else {
                log.error("Failed to send invitation email to {}: {} - {}", 
                        recipientEmail, response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (IOException e) {
            log.error("Error sending invitation email to {}: {}", recipientEmail, e.getMessage(), e);
            return false;
        }
    }

    private String buildInvitationEmailHtml(String inviterName, String projectName, String role, String acceptUrl) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #007bff; 
                             color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>You've been invited!</h2>
                    <p>%s has invited you to collaborate on <strong>%s</strong> as a <strong>%s</strong>.</p>
                    <p>
                        <a href="%s" class="button">Accept Invitation</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all;">%s</p>
                    <div class="footer">
                        <p>This invitation will expire in 7 days.</p>
                    </div>
                </div>
            </body>
            </html>
            """, inviterName, projectName, role, acceptUrl, acceptUrl);
    }

    private String buildInvitationEmailPlain(String inviterName, String projectName, String role, String acceptUrl) {
        return String.format("""
            You've been invited!
            
            %s has invited you to collaborate on %s as a %s.
            
            Accept your invitation by clicking this link:
            %s
            
            This invitation will expire in 7 days.
            """, inviterName, projectName, role, acceptUrl);
    }
}

