package com.secrets.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Service for rendering HTML email templates using Thymeleaf.
 */
@Service
public class EmailTemplateService {

    private static final Logger log = LoggerFactory.getLogger(EmailTemplateService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm");

    private final TemplateEngine templateEngine;

    public EmailTemplateService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /**
     * Render invitation email HTML template.
     */
    public String renderInvitationEmail(String inviterName, String projectName, String acceptLink) {
        Context context = new Context();
        context.setVariable("inviterName", inviterName);
        context.setVariable("projectName", projectName);
        context.setVariable("acceptLink", acceptLink);
        return templateEngine.process("email/invitation", context);
    }

    /**
     * Render expiration warning email HTML template.
     */
    public String renderExpirationWarningEmail(String secretKey, String projectName, LocalDateTime expiresAt, String projectLink) {
        Context context = new Context();
        context.setVariable("secretKey", secretKey);
        context.setVariable("projectName", projectName);
        context.setVariable("expiresAt", expiresAt.format(DATE_FORMATTER));
        context.setVariable("projectLink", projectLink);
        return templateEngine.process("email/expiration-warning", context);
    }

    /**
     * Render role change email HTML template.
     */
    public String renderRoleChangeEmail(String projectName, String oldRole, String newRole, String projectLink) {
        Context context = new Context();
        context.setVariable("projectName", projectName);
        context.setVariable("oldRole", oldRole);
        context.setVariable("newRole", newRole);
        context.setVariable("projectLink", projectLink);
        return templateEngine.process("email/role-change", context);
    }
}
