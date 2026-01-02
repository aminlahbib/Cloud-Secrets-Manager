package com.secrets.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for rendering HTML email templates using Thymeleaf.
 */
@Service
public class EmailTemplateService {

    private static final Logger log = LoggerFactory.getLogger(EmailTemplateService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm");

    private final TemplateEngine templateEngine;

    public EmailTemplateService(TemplateEngine templateEngine) {
        if (templateEngine == null) {
            throw new IllegalArgumentException("TemplateEngine cannot be null");
        }
        this.templateEngine = templateEngine;
    }

    /**
     * Render invitation email HTML template.
     */
    public String renderInvitationEmail(String inviterName, String projectName, String acceptLink) {
        try {
            Context context = new Context();
            context.setVariable("inviterName", inviterName != null ? inviterName : "A teammate");
            context.setVariable("projectName", projectName != null ? projectName : "a project");
            context.setVariable("acceptLink", acceptLink != null ? acceptLink : "");
            return templateEngine.process("email/invitation", context);
        } catch (Exception e) {
            log.error("Failed to render invitation email template: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to render invitation email template", e);
        }
    }

    /**
     * Render expiration warning email HTML template.
     */
    public String renderExpirationWarningEmail(String secretKey, String projectName, LocalDateTime expiresAt, String projectLink) {
        try {
            Context context = new Context();
            context.setVariable("secretKey", secretKey != null ? secretKey : "");
            context.setVariable("projectName", projectName != null ? projectName : "");
            context.setVariable("expiresAt", expiresAt != null ? expiresAt.format(DATE_FORMATTER) : "");
            context.setVariable("projectLink", projectLink != null ? projectLink : "");
            return templateEngine.process("email/expiration-warning", context);
        } catch (Exception e) {
            log.error("Failed to render expiration warning email template: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to render expiration warning email template", e);
        }
    }

    /**
     * Render role change email HTML template.
     */
    public String renderRoleChangeEmail(String projectName, String oldRole, String newRole, String projectLink) {
        try {
            Context context = new Context();
            context.setVariable("projectName", projectName != null ? projectName : "");
            context.setVariable("oldRole", oldRole != null ? oldRole : "");
            context.setVariable("newRole", newRole != null ? newRole : "");
            context.setVariable("projectLink", projectLink != null ? projectLink : "");
            return templateEngine.process("email/role-change", context);
        } catch (Exception e) {
            log.error("Failed to render role change email template: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to render role change email template", e);
        }
    }
}
