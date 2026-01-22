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
                // Check metadata first for email (in case user was deleted)
                Map<String, Object> metadata = log.getMetadata();
                String metadataEmail = extractEmailFromMetadata(metadata);
                
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
                            metadata,
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
                    // User not found - try to use email from metadata
                    if (metadataEmail != null && !metadataEmail.isEmpty()) {
                        log.setUserEmail(metadataEmail);
                        log.setUserDisplayName(metadataEmail); // Use email as displayName
                        AuditLogProxyService.log.debug("Using email from metadata for deleted user: userId={}, email={}", 
                            log.getUserId(), metadataEmail);
                        
                        // Regenerate description with metadata email
                        String regeneratedDescription = regenerateDescription(
                                metadataEmail,
                                log.getAction(),
                                log.getResourceType(),
                                log.getResourceName(),
                                log.getProjectId(),
                                metadata,
                                projectMap,
                                projectTeamMap
                        );
                        
                        if (regeneratedDescription != null && !regeneratedDescription.isEmpty()) {
                            log.setDescription(regeneratedDescription);
                        } else {
                            // Fallback to string replacement
                            String description = log.getDescription();
                            if (description != null) {
                                String userIdStr = log.getUserId().toString();
                                if (description.contains(userIdStr)) {
                                    description = description.replace(userIdStr, metadataEmail);
                                    log.setDescription(description);
                                } else if (description.contains("Unknown user")) {
                                    description = description.replace("Unknown user", metadataEmail);
                                    log.setDescription(description);
                                }
                            }
                        }
                    } else {
                        // No metadata email either - log warning and set to null
                        AuditLogProxyService.log.warn("User not found for audit log enrichment and no metadata email: userId={}, logId={}", 
                            log.getUserId(), log.getId());
                        if (log.getDescription() != null && log.getUserId() != null) {
                            String description = log.getDescription();
                            String userIdStr = log.getUserId().toString();
                            if (description.contains(userIdStr)) {
                                description = description.replace(userIdStr, "Unknown user");
                                log.setDescription(description);
                            }
                        }
                        // Set userEmail to null explicitly (frontend will show "Unknown")
                        log.setUserEmail(null);
                        log.setUserDisplayName(null);
                    }
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
     * Extract email from metadata if present
     * @param metadata Metadata map that may contain userEmail
     * @return Email string if found, null otherwise
     */
    private String extractEmailFromMetadata(Map<String, Object> metadata) {
        if (metadata == null) {
            return null;
        }
        Object userEmailObj = metadata.get("userEmail");
        if (userEmailObj != null) {
            return userEmailObj.toString();
        }
        return null;
    }

    /**
     * Get email from audit logs metadata for a user
     * Queries the audit service for recent logs by user_id and extracts email from metadata
     * @param userId User ID to look up
     * @param projectId Project ID (optional, can be null)
     * @param startDate Start date for query (optional)
     * @param endDate End date for query (optional)
     * @return Email string if found in metadata, null otherwise
     */
    private String getEmailFromAuditLogsMetadata(UUID userId, String projectId, String startDate, String endDate) {
        if (userId == null) {
            log.debug("getEmailFromAuditLogsMetadata called with null userId");
            return null;
        }
        
        try {
            WebClient client = webClientBuilder
                    .baseUrl(auditServiceUrl)
                    .build();

            // Query audit service for recent logs by this specific user
            // Use /api/audit/user/{userId} endpoint and filter by project in memory if needed
            AuditLogPageResponse auditResponse = client.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path("/api/audit/user/" + userId.toString())
                                .queryParam("page", 0)
                                .queryParam("size", 20); // Get more logs to find one with project match
                        
                        return builder.build();
                    })
                    .header("X-Service-API-Key", serviceApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(AuditLogPageResponse.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();

            if (auditResponse != null && auditResponse.getContent() != null && !auditResponse.getContent().isEmpty()) {
                log.debug("Found {} audit logs for userId={}", 
                    auditResponse.getContent().size(), userId);
                // Filter by project if projectId is specified, otherwise use any log
                UUID projectUuid = null;
                if (projectId != null && !projectId.isEmpty()) {
                    try {
                        projectUuid = UUID.fromString(projectId);
                    } catch (IllegalArgumentException e) {
                        log.debug("Invalid projectId format: {}, will not filter by project", projectId);
                    }
                }
                for (AuditLogDto auditLog : auditResponse.getContent()) {
                    // If projectId is specified, only check logs for that project
                    if (projectUuid != null && auditLog.getProjectId() != null && !auditLog.getProjectId().equals(projectUuid)) {
                        continue;
                    }
                    String email = extractEmailFromMetadata(auditLog.getMetadata());
                    if (email != null && !email.isEmpty()) {
                        log.debug("Found email in audit log metadata: userId={}, email={}, logId={}, projectId={}", 
                            userId, email, auditLog.getId(), auditLog.getProjectId());
                        return email;
                    } else {
                        log.debug("Audit log {} for userId={} has no email in metadata. Metadata keys: {}", 
                            auditLog.getId(), userId, 
                            auditLog.getMetadata() != null ? auditLog.getMetadata().keySet() : "null");
                    }
                }
                log.warn("Found {} audit logs for userId={} but none had email in metadata (or matched projectId={})", 
                    auditResponse.getContent().size(), userId, projectId);
            } else {
                log.debug("No audit logs found for userId={} (response was null or empty)", userId);
            }
        } catch (Exception e) {
            log.warn("Failed to query audit logs for email extraction: userId={}, error={}", userId, e.getMessage(), e);
        }
        return null;
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
                log.debug("Enriching {} topUsers for analytics", response.getTopUsers().size());
                final int[] enrichedCount = {0};
                final int[] notFoundCount = {0};
                final int[] metadataFallbackCount = {0};
                
                response.getTopUsers().forEach(topUser -> {
                    if (topUser.getUserId() != null) {
                        try {
                            UUID userId = UUID.fromString(topUser.getUserId());
                            log.debug("Enriching topUser: userId={}, current email={}, current displayName={}", 
                                userId, topUser.getEmail(), topUser.getDisplayName());
                            Optional<User> userOpt = userService.findById(userId);
                            if (userOpt.isPresent()) {
                                User user = userOpt.get();
                                String userEmail = user.getEmail();
                                String userDisplayName = user.getDisplayName();
                                
                                // Validate email is not null/empty - if it is, try metadata fallback
                                if (userEmail == null || userEmail.isEmpty()) {
                                    log.warn("User {} found but has null/empty email, trying metadata fallback", userId);
                                    String metadataEmail = getEmailFromAuditLogsMetadata(userId, projectId, startDate, endDate);
                                    if (metadataEmail != null && !metadataEmail.isEmpty()) {
                                        topUser.setEmail(metadataEmail);
                                        topUser.setDisplayName(userDisplayName != null && !userDisplayName.isEmpty() 
                                            ? userDisplayName 
                                            : metadataEmail);
                                        metadataFallbackCount[0]++;
                                        log.debug("Using email from audit logs metadata for topUser (user had no email): userId={}, email={}", 
                                            userId, metadataEmail);
                                    } else {
                                        // No email anywhere - use displayName or fallback
                                        if (userDisplayName != null && !userDisplayName.isEmpty()) {
                                            topUser.setDisplayName(userDisplayName);
                                        } else {
                                            topUser.setDisplayName("User " + userId.toString().substring(0, 8));
                                        }
                                        topUser.setEmail(null);
                                        notFoundCount[0]++;
                                        log.warn("User {} found but has no email and no metadata email", userId);
                                    }
                                } else {
                                    // User has valid email - use it
                                    topUser.setEmail(userEmail);
                                    
                                    // Set displayName: prefer displayName, fallback to email
                                    if (userDisplayName != null && !userDisplayName.isEmpty()) {
                                        topUser.setDisplayName(userDisplayName);
                                    } else {
                                        topUser.setDisplayName(userEmail);
                                    }
                                    
                                    enrichedCount[0]++;
                                    log.debug("Enriched topUser: userId={}, email={}, displayName={}", 
                                        userId, topUser.getEmail(), topUser.getDisplayName());
                                }
                            } else {
                                // User not found in database - try to get email from audit logs metadata
                                log.debug("User not found in database for analytics topUser: userId={}, trying metadata fallback", userId);
                                String metadataEmail = getEmailFromAuditLogsMetadata(userId, projectId, startDate, endDate);
                                if (metadataEmail != null && !metadataEmail.isEmpty()) {
                                    topUser.setEmail(metadataEmail);
                                    topUser.setDisplayName(metadataEmail); // Use email as displayName
                                    metadataFallbackCount[0]++;
                                    log.info("Using email from audit logs metadata for topUser (user not in DB): userId={}, email={}", 
                                        userId, metadataEmail);
                                } else {
                                    notFoundCount[0]++;
                                    // Set a fallback displayName even if user not found and no metadata
                                    topUser.setDisplayName("Unknown User");
                                    topUser.setEmail(null); // Explicitly set to null
                                    log.warn("User not found for analytics topUser and no metadata email: userId={}. This may indicate a data sync issue.", topUser.getUserId());
                                }
                            }
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid user ID in analytics: {}", topUser.getUserId());
                        }
                    } else {
                        log.warn("topUser has null userId");
                    }
                });
                
                log.debug("Analytics topUsers enrichment complete: {} enriched, {} from metadata, {} not found", 
                    enrichedCount[0], metadataFallbackCount[0], notFoundCount[0]);
            }
            
            // Enrich actionsByUser map: convert user IDs to emails
            if (response != null && response.getActionsByUser() != null && !response.getActionsByUser().isEmpty()) {
                Map<String, Long> enrichedActionsByUser = new HashMap<>();
                response.getActionsByUser().forEach((userId, count) -> {
                    try {
                        UUID userUuid = UUID.fromString(userId);
                        Optional<User> userOpt = userService.findById(userUuid);
                        String email = null;
                        
                        if (userOpt.isPresent()) {
                            User user = userOpt.get();
                            email = user.getEmail();
                        } else {
                            // User not found - try to get email from audit logs metadata
                            email = getEmailFromAuditLogsMetadata(userUuid, projectId, startDate, endDate);
                            if (email != null) {
                                log.debug("Using email from audit logs metadata for actionsByUser: userId={}, email={}", 
                                    userId, email);
                            }
                        }
                        
                        if (email != null && !email.isEmpty()) {
                            // Use email as key instead of user ID
                            // If multiple user IDs map to same email (shouldn't happen), sum counts
                            enrichedActionsByUser.merge(email, count, (a, b) -> a + b);
                        } else {
                            // Fallback to user ID if email is missing
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
