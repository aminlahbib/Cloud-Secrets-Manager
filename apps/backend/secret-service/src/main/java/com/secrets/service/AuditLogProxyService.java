package com.secrets.service;

import com.secrets.dto.audit.AuditLogDto;
import com.secrets.dto.audit.AuditLogPageResponse;
import com.secrets.entity.Project;
import com.secrets.entity.Team;
import com.secrets.entity.TeamProject;
import com.secrets.entity.User;
import com.secrets.repository.ProjectRepository;
import com.secrets.repository.TeamMembershipRepository;
import com.secrets.repository.TeamProjectRepository;
import com.secrets.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogProxyService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogProxyService.class);

    private final WebClient.Builder webClientBuilder;
    private final UserService userService;
    private final ProjectRepository projectRepository;
    private final TeamProjectRepository teamProjectRepository;
    private final TeamRepository teamRepository;
    private final TeamMembershipRepository teamMembershipRepository;

    @Value("${audit.service.url}")
    private String auditServiceUrl;
    
    @Value("${audit.service.api-key}")
    private String serviceApiKey;

    public AuditLogProxyService(
            WebClient.Builder webClientBuilder,
            UserService userService,
            ProjectRepository projectRepository,
            TeamProjectRepository teamProjectRepository,
            TeamRepository teamRepository,
            TeamMembershipRepository teamMembershipRepository) {
        this.webClientBuilder = webClientBuilder;
        this.userService = userService;
        this.projectRepository = projectRepository;
        this.teamProjectRepository = teamProjectRepository;
        this.teamRepository = teamRepository;
        this.teamMembershipRepository = teamMembershipRepository;
    }
    
    /**
     * Enrich audit log DTOs with user, project, and team information
     * and personalize descriptions for the current user (replace user's name/email with "you")
     */
    private void enrichWithUserData(List<AuditLogDto> auditLogs, UUID currentUserId) {
        if (auditLogs == null || auditLogs.isEmpty()) {
            return;
        }
        
        // Collect unique user IDs
        Set<UUID> userIds = auditLogs.stream()
            .map(AuditLogDto::getUserId)
            .filter(userId -> userId != null)
            .collect(Collectors.toSet());
        
        // Batch fetch users
        java.util.Map<UUID, User> userMap = userIds.stream()
            .map(userService::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toMap(User::getId, user -> user));
        
        // Log enrichment stats for debugging
        if (!userIds.isEmpty()) {
            log.debug("Enriching {} audit logs with user data. Found {}/{} users in database.", 
                auditLogs.size(), userMap.size(), userIds.size());
            if (userMap.size() < userIds.size()) {
                Set<UUID> missingUserIds = userIds.stream()
                    .filter(id -> !userMap.containsKey(id))
                    .collect(Collectors.toSet());
                log.warn("{} user(s) not found in database for enrichment: {}. These logs will show 'Unknown' or UUIDs.", 
                    missingUserIds.size(), missingUserIds);
            }
        }
        
        // Collect unique project IDs
        Set<UUID> projectIds = auditLogs.stream()
            .map(AuditLogDto::getProjectId)
            .filter(projectId -> projectId != null)
            .collect(Collectors.toSet());
        
        // Batch fetch projects
        java.util.Map<UUID, Project> projectMap = projectIds.stream()
            .map(projectRepository::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toMap(Project::getId, project -> project));
        
        // Batch fetch team-project relationships and teams
        java.util.Map<UUID, String> projectTeamMap = new HashMap<>();
        if (!projectIds.isEmpty()) {
            // Fetch team projects for each project ID
            List<TeamProject> teamProjects = projectIds.stream()
                .flatMap(projectId -> teamProjectRepository.findByProjectId(projectId).stream())
                .collect(Collectors.toList());
            
            Set<UUID> teamIds = teamProjects.stream()
                .map(TeamProject::getTeamId)
                .collect(Collectors.toSet());
            
            java.util.Map<UUID, Team> teamMap = teamIds.stream()
                .map(teamRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toMap(Team::getId, team -> team));
            
            // Map each project to its first team name (only teams user is a member of)
            for (TeamProject tp : teamProjects) {
                UUID projectId = tp.getProjectId();
                // Only include teams the current user is a member of
                if (currentUserId != null && teamMembershipRepository.existsByTeamIdAndUserId(tp.getTeamId(), currentUserId)) {
                    if (!projectTeamMap.containsKey(projectId)) {
                        Team team = teamMap.get(tp.getTeamId());
                        if (team != null) {
                            projectTeamMap.put(projectId, team.getName());
                        }
                    }
                }
            }
        }
        
        // Enrich audit logs with user, project, and team data
        auditLogs.forEach(log -> {
            // Enrich user data
            if (log.getUserId() != null) {
                User user = userMap.get(log.getUserId());
                if (user != null) {
                    log.setUserEmail(user.getEmail());
                    log.setUserDisplayName(user.getDisplayName());
                    
                    // Regenerate description with user email/displayName instead of UUID
                    // This is more reliable than string replacement
                    String userName = user.getDisplayName() != null && !user.getDisplayName().isEmpty()
                            ? user.getDisplayName()
                            : user.getEmail();
                    
                    // Personalize for current user
                    if (currentUserId != null && log.getUserId().equals(currentUserId)) {
                        userName = "you";
                    }
                    
                    // Regenerate description using same logic as DescriptionFormatter
                    String regeneratedDescription = regenerateDescription(
                            userName,
                            log.getAction(),
                            log.getResourceType(),
                            log.getResourceName(),
                            log.getProjectId(),
                            log.getMetadata(),
                            projectMap,
                            projectTeamMap
                    );
                    
                    if (regeneratedDescription != null && !regeneratedDescription.isEmpty()) {
                        log.setDescription(regeneratedDescription);
                    } else {
                        // Fallback to string replacement if regeneration fails
                        String description = log.getDescription();
                        if (description != null) {
                            String userIdStr = log.getUserId().toString();
                            if (description.contains(userIdStr)) {
                                description = description.replace(userIdStr, userName);
                                log.setDescription(description);
                            } else if (description.contains("Unknown user")) {
                                description = description.replace("Unknown user", userName);
                                log.setDescription(description);
                            }
                        }
                    }
                } else {
                    // User not found - log warning and try to replace user ID in description
                    LoggerFactory.getLogger(AuditLogProxyService.class).warn("User not found for audit log enrichment: userId={}, logId={}", 
                        log.getUserId(), log.getId());
                    if (log.getDescription() != null && log.getUserId() != null) {
                        String description = log.getDescription();
                        String userIdStr = log.getUserId().toString();
                        if (description.contains(userIdStr)) {
                            description = description.replace(userIdStr, "Unknown user");
                            log.setDescription(description);
                        }
                    }
                    // Still set userEmail to null explicitly (frontend will show "Unknown")
                    log.setUserEmail(null);
                    log.setUserDisplayName(null);
                }
            }
            
            // Enrich project and team data in metadata
            if (log.getProjectId() != null) {
                Project project = projectMap.get(log.getProjectId());
                if (project != null) {
                    // Ensure metadata exists
                    Map<String, Object> metadata = log.getMetadata();
                    if (metadata == null) {
                        metadata = new HashMap<>();
                        log.setMetadata(metadata);
                    }
                    
                    // Add project name if not already present
                    if (!metadata.containsKey("projectName")) {
                        metadata.put("projectName", project.getName());
                    }
                    
                    // Add team name if project is in a team
                    String teamName = projectTeamMap.get(log.getProjectId());
                    if (teamName != null && !metadata.containsKey("teamName")) {
                        metadata.put("teamName", teamName);
                    }
                }
            }
        });
    }

    /**
     * Regenerate description using same logic as DescriptionFormatter
     * This ensures descriptions are properly formatted with user emails instead of UUIDs
     */
    private String regenerateDescription(String userName, String action, String resourceType,
                                       String resourceName, UUID projectId, Map<String, Object> metadata,
                                       Map<UUID, Project> projectMap, Map<UUID, String> projectTeamMap) {
        if (userName == null || userName.isEmpty()) {
            userName = "Unknown user";
        }

        // Extract team name from metadata or project-team mapping
        String teamName = null;
        if (metadata != null && metadata.containsKey("teamName")) {
            teamName = metadata.get("teamName").toString();
        } else if (projectId != null) {
            teamName = projectTeamMap.get(projectId);
        }

        // Extract project name from metadata or project map
        String projectName = null;
        if (metadata != null && metadata.containsKey("projectName")) {
            projectName = metadata.get("projectName").toString();
        } else if (projectId != null) {
            Project project = projectMap.get(projectId);
            if (project != null) {
                projectName = project.getName();
            }
        }

        // Format action verb (same logic as DescriptionFormatter)
        String actionVerb = formatActionVerb(action);

        // Format resource type
        String resourceTypeFormatted = formatResourceType(resourceType);

        // Build description
        StringBuilder description = new StringBuilder();
        description.append(userName);
        description.append(" ").append(actionVerb);

        if (resourceName != null && !resourceName.isEmpty()) {
            description.append(" ").append(resourceTypeFormatted).append(" ").append(resourceName);
        } else if (resourceType != null) {
            description.append(" ").append(resourceTypeFormatted);
        }

        if (projectName != null && !projectName.isEmpty()) {
            description.append(" in project ").append(projectName);
        } else {
            description.append(" in project");
        }

        if (teamName != null && !teamName.isEmpty()) {
            description.append(" (team: ").append(teamName).append(")");
        }

        return description.toString();
    }

    /**
     * Format action string to a human-readable verb (same logic as DescriptionFormatter)
     */
    private String formatActionVerb(String action) {
        if (action == null) {
            return "performed action on";
        }

        action = action.toUpperCase();

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
            return action.toLowerCase().replace("_", " ");
        }
    }

    /**
     * Format resource type to a human-readable form (same logic as DescriptionFormatter)
     */
    private String formatResourceType(String resourceType) {
        if (resourceType == null) {
            return "resource";
        }

        resourceType = resourceType.toLowerCase();

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

    public AuditLogPageResponse fetchAuditLogs(
            int page,
            int size,
            String sortBy,
            String sortDir,
            Optional<String> action,
            Optional<String> startDate,
            Optional<String> endDate,
            UUID currentUserId) {

        WebClient client = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

        try {
            AuditLogPageResponse response = client.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path("/api/audit")
                                .queryParam("page", page)
                                .queryParam("size", size)
                                .queryParam("sortBy", sortBy)
                                .queryParam("sortDir", sortDir);

                        action.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("action", value));

                        startDate.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("startDate", value));

                        endDate.filter(value -> !value.isBlank())
                                .ifPresent(value -> builder.queryParam("endDate", value));

                        return builder.build();
                    })
                    .header("X-Service-API-Key", serviceApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(AuditLogPageResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            
            // Enrich with user data and personalize descriptions
            if (response != null && response.getContent() != null) {
                enrichWithUserData(response.getContent(), currentUserId);
            }
            
            return response;
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch audit logs: {}", ex.getMessage());
            throw ex;
        }
    }

    public AuditLogPageResponse fetchProjectAuditLogs(
            String projectId,
            int page,
            int size,
            Optional<String> action,
            Optional<String> userId,
            Optional<String> resourceType,
            Optional<String> startDate,
            Optional<String> endDate,
            UUID currentUserId) {

        WebClient client = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

        try {
            AuditLogPageResponse response;
            
            // If both startDate and endDate are provided, use the date-range endpoint
            if (startDate.isPresent() && endDate.isPresent() && 
                !startDate.get().isBlank() && !endDate.get().isBlank()) {
                response = client.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/api/audit/project/" + projectId + "/date-range")
                                .queryParam("start", startDate.get())
                                .queryParam("end", endDate.get())
                                .queryParam("page", page)
                                .queryParam("size", size)
                                .build())
                        .header("X-Service-API-Key", serviceApiKey)
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve()
                        .bodyToMono(AuditLogPageResponse.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();
            } else {
                // Otherwise use the regular endpoint with optional filters
                response = client.get()
                        .uri(uriBuilder -> {
                            var builder = uriBuilder.path("/api/audit/project/" + projectId)
                                    .queryParam("page", page)
                                    .queryParam("size", size);

                            action.filter(value -> !value.isBlank())
                                    .ifPresent(value -> builder.queryParam("action", value));

                            userId.filter(value -> !value.isBlank())
                                    .ifPresent(value -> builder.queryParam("userId", value));

                            resourceType.filter(value -> !value.isBlank())
                                    .ifPresent(value -> builder.queryParam("resourceType", value));

                            startDate.filter(value -> !value.isBlank())
                                    .ifPresent(value -> builder.queryParam("startDate", value));

                            endDate.filter(value -> !value.isBlank())
                                    .ifPresent(value -> builder.queryParam("endDate", value));

                            return builder.build();
                        })
                        .header("X-Service-API-Key", serviceApiKey)
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve()
                        .bodyToMono(AuditLogPageResponse.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();
            }
            
            // Enrich with user data and personalize descriptions
            if (response != null && response.getContent() != null) {
                enrichWithUserData(response.getContent(), currentUserId);
            }
            
            return response;
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch project audit logs: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    public com.secrets.dto.audit.AnalyticsResponse fetchProjectAnalytics(
            String projectId,
            String startDate,
            String endDate) {

        WebClient client = webClientBuilder
                .baseUrl(auditServiceUrl)
                .build();

        try {
            com.secrets.dto.audit.AnalyticsResponse response = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/audit/project/" + projectId + "/analytics")
                            .queryParam("start", startDate)
                            .queryParam("end", endDate)
                            .build())
                    .header("X-Service-API-Key", serviceApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(com.secrets.dto.audit.AnalyticsResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            
            // Enrich topUsers with email/displayName
            if (response != null && response.getTopUsers() != null) {
                response.getTopUsers().forEach(topUser -> {
                    if (topUser.getUserId() != null) {
                        try {
                            UUID userId = UUID.fromString(topUser.getUserId());
                            userService.findById(userId).ifPresent(user -> {
                                topUser.setEmail(user.getEmail());
                                topUser.setDisplayName(user.getDisplayName());
                            });
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid user ID in analytics: {}", topUser.getUserId());
                        }
                    }
                });
            }
            
            // Enrich actionsByUser map: convert user IDs to emails
            if (response != null && response.getActionsByUser() != null && !response.getActionsByUser().isEmpty()) {
                Map<String, Long> enrichedActionsByUser = new HashMap<>();
                response.getActionsByUser().forEach((userId, count) -> {
                    try {
                        UUID userUuid = UUID.fromString(userId);
                        Optional<User> userOpt = userService.findById(userUuid);
                        if (userOpt.isPresent()) {
                            User user = userOpt.get();
                            // Use email as key instead of user ID
                            String email = user.getEmail();
                            if (email != null && !email.isEmpty()) {
                                // If multiple user IDs map to same email (shouldn't happen), sum counts
                                enrichedActionsByUser.merge(email, count, (a, b) -> a + b);
                            } else {
                                // Fallback to user ID if email is missing
                                enrichedActionsByUser.put(userId, count);
                            }
                        } else {
                            // User not found, keep the original user ID
                            enrichedActionsByUser.put(userId, count);
                        }
                    } catch (IllegalArgumentException e) {
                        // Invalid UUID format, keep as-is
                        log.warn("Invalid user ID format in actionsByUser: {}", userId);
                        enrichedActionsByUser.put(userId, count);
                    }
                });
                response.setActionsByUser(enrichedActionsByUser);
            }
            
            return response;
        } catch (WebClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw ex;
            }
            log.error("Audit service responded with error: status={}, body={}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to fetch project analytics: {}", ex.getMessage(), ex);
            throw ex;
        }
    }
}
