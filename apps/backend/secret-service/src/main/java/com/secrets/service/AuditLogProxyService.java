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
                    
                    // Personalize description: replace current user's name/email with "you"
                    if (currentUserId != null && log.getUserId().equals(currentUserId) && log.getDescription() != null) {
                        String description = log.getDescription();
                        // Replace user's display name with "you" (at the start of description)
                        if (user.getDisplayName() != null && !user.getDisplayName().isEmpty()) {
                            String displayName = user.getDisplayName();
                            // Check if description starts with the display name
                            if (description.startsWith(displayName + " ")) {
                                description = "you" + description.substring(displayName.length());
                            } else {
                                // Fallback: use regex for word boundary matching
                                description = description.replaceFirst("\\b" + java.util.regex.Pattern.quote(displayName) + "\\b", "you");
                            }
                        }
                        // Replace user's email with "you" (if display name wasn't found or used)
                        if (user.getEmail() != null && !user.getEmail().isEmpty() && !description.startsWith("you ")) {
                            String email = user.getEmail();
                            // Check if description starts with the email
                            if (description.startsWith(email + " ")) {
                                description = "you" + description.substring(email.length());
                            } else {
                                // Fallback: use regex for word boundary matching
                                description = description.replaceFirst("\\b" + java.util.regex.Pattern.quote(email) + "\\b", "you");
                            }
                        }
                        log.setDescription(description);
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
