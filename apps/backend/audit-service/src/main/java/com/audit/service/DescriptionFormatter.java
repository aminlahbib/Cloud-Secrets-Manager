package com.audit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Service for generating human-readable descriptions from audit log entries.
 * Formats activities like: "userA read secretB in projectC (team if there is any)"
 */
@Component
public class DescriptionFormatter {

    /**
     * Generate a human-readable description from audit log data.
     * 
     * @param userName User's display name or email
     * @param action Action performed (e.g., "SECRET_READ", "SECRET_CREATE")
     * @param resourceType Type of resource (e.g., "SECRET", "PROJECT", "TEAM")
     * @param resourceName Name of the resource
     * @param projectName Name of the project (optional)
     * @param teamName Name of the team (optional, from metadata)
     * @param metadata Additional metadata that may contain team information
     * @return Human-readable description
     */
    public String formatDescription(String userName, String action, String resourceType,
                                   String resourceName, String projectName, Map<String, Object> metadata) {
        
        // Extract team name from metadata if available
        String teamName = null;
        if (metadata != null) {
            Object teamObj = metadata.get("teamName");
            if (teamObj != null) {
                teamName = teamObj.toString();
            }
        }

        // Format action verb (e.g., "SECRET_READ" -> "read", "SECRET_CREATE" -> "created")
        String actionVerb = formatActionVerb(action);
        
        // Format resource type (e.g., "SECRET" -> "secret", "PROJECT" -> "project")
        String resourceTypeFormatted = formatResourceType(resourceType);
        
        // Build the description
        StringBuilder description = new StringBuilder();
        
        // User name
        if (userName != null && !userName.isEmpty()) {
            description.append(userName);
        } else {
            description.append("Unknown user");
        }
        
        // Action verb
        description.append(" ").append(actionVerb);
        
        // Resource type and name
        if (resourceName != null && !resourceName.isEmpty()) {
            description.append(" ").append(resourceTypeFormatted).append(" ").append(resourceName);
        } else if (resourceType != null) {
            description.append(" ").append(resourceTypeFormatted);
        }
        
        // Project name
        if (projectName != null && !projectName.isEmpty()) {
            description.append(" in project ").append(projectName);
        } else {
            description.append(" in project");
        }
        
        // Team name (if available)
        if (teamName != null && !teamName.isEmpty()) {
            description.append(" (team: ").append(teamName).append(")");
        }
        
        return description.toString();
    }

    /**
     * Format action string to a human-readable verb.
     */
    private String formatActionVerb(String action) {
        if (action == null) {
            return "performed action on";
        }
        
        action = action.toUpperCase();
        
        // Handle common action patterns
        if (action.contains("READ") || action.contains("VIEW")) {
            return "read";
        } else if (action.contains("CREATE")) {
            return "created";
        } else if (action.contains("UPDATE") || action.contains("EDIT")) {
            return "updated";
        } else if (action.contains("DELETE") || action.contains("REMOVE")) {
            return "deleted";
        } else if (action.contains("ROTATE")) {
            return "rotated";
        } else if (action.contains("MOVE")) {
            return "moved";
        } else if (action.contains("COPY")) {
            return "copied";
        } else if (action.contains("ROLLBACK")) {
            return "rolled back";
        } else if (action.contains("ENABLE")) {
            return "enabled";
        } else if (action.contains("DISABLE")) {
            return "disabled";
        } else if (action.contains("VERIFY") || action.contains("VERIFIED")) {
            return "verified";
        } else if (action.contains("LOGIN") || action.contains("LOG_IN")) {
            return "logged in";
        } else if (action.contains("LOGOUT") || action.contains("LOG_OUT")) {
            return "logged out";
        } else if (action.contains("GRANT") || action.contains("ASSIGN")) {
            return "granted access to";
        } else if (action.contains("REVOKE") || action.contains("REMOVE_ACCESS")) {
            return "revoked access from";
        } else if (action.contains("JOIN")) {
            return "joined";
        } else if (action.contains("LEAVE")) {
            return "left";
        } else {
            // Default: convert SNAKE_CASE to lowercase with spaces
            return action.toLowerCase().replace("_", " ");
        }
    }

    /**
     * Format resource type to a human-readable form.
     */
    private String formatResourceType(String resourceType) {
        if (resourceType == null) {
            return "resource";
        }
        
        resourceType = resourceType.toLowerCase();
        
        // Handle common resource types
        switch (resourceType) {
            case "secret":
                return "secret";
            case "project":
                return "project";
            case "team":
                return "team";
            case "user":
                return "user";
            case "workflow":
                return "workflow";
            case "notification":
                return "notification";
            default:
                return resourceType;
        }
    }
}

