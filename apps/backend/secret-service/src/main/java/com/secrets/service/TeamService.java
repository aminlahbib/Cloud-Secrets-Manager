package com.secrets.service;

import com.secrets.dto.team.TeamRequest;
import com.secrets.dto.team.TeamResponse;
import com.secrets.entity.Team;
import com.secrets.entity.TeamMembership;
import com.secrets.entity.User;
import com.secrets.repository.TeamMembershipRepository;
import com.secrets.repository.TeamProjectRepository;
import com.secrets.repository.TeamRepository;
import com.secrets.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeamService {

    private static final Logger log = LoggerFactory.getLogger(TeamService.class);

    private final TeamRepository teamRepository;
    private final TeamMembershipRepository membershipRepository;
    private final TeamProjectRepository teamProjectRepository;
    private final UserRepository userRepository;

    public TeamService(
            TeamRepository teamRepository,
            TeamMembershipRepository membershipRepository,
            TeamProjectRepository teamProjectRepository,
            UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.membershipRepository = membershipRepository;
        this.teamProjectRepository = teamProjectRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new team
     * The creator automatically becomes TEAM_OWNER
     */
    public TeamResponse createTeam(TeamRequest request, UUID userId) {
        Team team = new Team();
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setCreatedBy(userId);
        team.setIsActive(true);

        Team saved = teamRepository.save(team);

        // Add creator as TEAM_OWNER
        TeamMembership ownerMembership = new TeamMembership();
        ownerMembership.setTeamId(saved.getId());
        ownerMembership.setUserId(userId);
        ownerMembership.setRole(TeamMembership.TeamRole.TEAM_OWNER);
        membershipRepository.save(ownerMembership);

        log.info("Created team {} by user {}", saved.getName(), userId);
        return toResponse(saved, userId);
    }

    /**
     * List all teams the user is a member of
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> listTeams(UUID userId) {
        List<Team> teams = teamRepository.findTeamsByMemberUserId(userId);
        return teams.stream()
                .map(team -> toResponse(team, userId))
                .collect(Collectors.toList());
    }

    /**
     * Get team by ID (user must be a member)
     */
    @Transactional(readOnly = true)
    public TeamResponse getTeam(UUID teamId, UUID userId) {
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check if user is a member
        if (!membershipRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new SecurityException("Access denied: You are not a member of this team");
        }

        return toResponse(team, userId);
    }

    /**
     * Update team (only TEAM_OWNER or TEAM_ADMIN can update)
     */
    public TeamResponse updateTeam(UUID teamId, TeamRequest request, UUID userId) {
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check permission
        TeamMembership membership = membershipRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new SecurityException("Access denied: You are not a member of this team"));

        if (membership.getRole() != TeamMembership.TeamRole.TEAM_OWNER &&
            membership.getRole() != TeamMembership.TeamRole.TEAM_ADMIN) {
            throw new SecurityException("Access denied: Only team owners and admins can update team");
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        Team updated = teamRepository.save(team);

        log.info("Updated team {} by user {}", updated.getName(), userId);
        return toResponse(updated, userId);
    }

    /**
     * Delete team (soft delete - only TEAM_OWNER can delete)
     */
    public void deleteTeam(UUID teamId, UUID userId) {
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check if user is TEAM_OWNER
        TeamMembership membership = membershipRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new SecurityException("Access denied: You are not a member of this team"));

        if (membership.getRole() != TeamMembership.TeamRole.TEAM_OWNER) {
            throw new SecurityException("Access denied: Only team owners can delete teams");
        }

        // Check if there are other owners
        long ownerCount = membershipRepository.countTeamOwners(teamId);
        if (ownerCount <= 1) {
            // Soft delete
            team.setIsActive(false);
            teamRepository.save(team);
            log.info("Deleted team {} by user {}", team.getName(), userId);
        } else {
            throw new IllegalStateException("Cannot delete team: There are other team owners. Transfer ownership first.");
        }
    }

    /**
     * Convert Team entity to TeamResponse DTO
     */
    private TeamResponse toResponse(Team team, UUID currentUserId) {
        TeamResponse response = new TeamResponse();
        response.setId(team.getId());
        response.setName(team.getName());
        response.setDescription(team.getDescription());
        response.setCreatedBy(team.getCreatedBy());
        response.setCreatedAt(team.getCreatedAt());
        response.setUpdatedAt(team.getUpdatedAt());
        response.setIsActive(team.getIsActive());

        // Get creator info
        Optional<User> creator = userRepository.findById(team.getCreatedBy());
        if (creator.isPresent()) {
            response.setCreatorName(creator.get().getDisplayName());
            response.setCreatorEmail(creator.get().getEmail());
        }

        // Get member count
        response.setMemberCount(membershipRepository.countByTeamId(team.getId()));

        // Get project count
        response.setProjectCount(teamProjectRepository.countByTeamId(team.getId()));

        // Get current user's role
        Optional<TeamMembership> membership = membershipRepository.findByTeamIdAndUserId(team.getId(), currentUserId);
        if (membership.isPresent()) {
            response.setCurrentUserRole(membership.get().getRole().name());
        }

        return response;
    }
}

