package com.secrets.service;

import com.secrets.dto.team.*;
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

import java.util.ArrayList;
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

    // =========================================================================
    // Member Management Methods
    // =========================================================================

    /**
     * List all members of a team
     */
    @Transactional(readOnly = true)
    public List<TeamMemberResponse> listTeamMembers(UUID teamId, UUID userId) {
        // Verify team exists and user is a member
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        if (!membershipRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new SecurityException("Access denied: You are not a member of this team");
        }

        List<TeamMembership> memberships = membershipRepository.findByTeamId(teamId);
        return memberships.stream()
                .map(this::toMemberResponse)
                .collect(Collectors.toList());
    }

    /**
     * Add a member to a team by email
     * User must exist in the system
     */
    public TeamMemberResponse addTeamMember(UUID teamId, TeamMemberRequest request, UUID userId) {
        // Verify team exists
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check permission (TEAM_OWNER or TEAM_ADMIN can add members)
        TeamMembership requesterMembership = membershipRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new SecurityException("Access denied: You are not a member of this team"));

        if (requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_ADMIN) {
            throw new SecurityException("Access denied: Only team owners and admins can add members");
        }

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + request.getEmail()));

        // Check if user is already a member
        if (membershipRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
            throw new IllegalStateException("User is already a member of this team");
        }

        // Create membership
        TeamMembership membership = new TeamMembership();
        membership.setTeamId(teamId);
        membership.setUserId(user.getId());
        membership.setRole(TeamMembership.TeamRole.valueOf(request.getRole()));

        // Prevent non-owners from creating owners
        if (membership.getRole() == TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER) {
            throw new SecurityException("Access denied: Only team owners can assign TEAM_OWNER role");
        }

        TeamMembership saved = membershipRepository.save(membership);
        log.info("Added user {} to team {} with role {}", user.getEmail(), team.getName(), request.getRole());
        return toMemberResponse(saved);
    }

    /**
     * Remove a member from a team
     */
    public void removeTeamMember(UUID teamId, UUID memberId, UUID userId) {
        // Verify team exists
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check permission (TEAM_OWNER or TEAM_ADMIN can remove members)
        TeamMembership requesterMembership = membershipRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new SecurityException("Access denied: You are not a member of this team"));

        if (requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_ADMIN) {
            throw new SecurityException("Access denied: Only team owners and admins can remove members");
        }

        // Find membership to remove
        TeamMembership membership = membershipRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this team"));

        // Prevent removing owners (unless requester is owner)
        if (membership.getRole() == TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER) {
            throw new SecurityException("Access denied: Only team owners can remove other owners");
        }

        // Prevent removing yourself if you're the only owner
        if (membership.getUserId().equals(userId) && membership.getRole() == TeamMembership.TeamRole.TEAM_OWNER) {
            long ownerCount = membershipRepository.countTeamOwners(teamId);
            if (ownerCount <= 1) {
                throw new IllegalStateException("Cannot remove yourself: You are the only team owner. Transfer ownership first or delete the team.");
            }
        }

        membershipRepository.delete(membership);
        log.info("Removed user {} from team {}", memberId, team.getName());
    }

    /**
     * Update a member's role
     */
    public TeamMemberResponse updateMemberRole(UUID teamId, UUID memberId, UpdateMemberRoleRequest request, UUID userId) {
        // Verify team exists
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check permission (TEAM_OWNER can change any role, TEAM_ADMIN can change to TEAM_MEMBER or TEAM_ADMIN)
        TeamMembership requesterMembership = membershipRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new SecurityException("Access denied: You are not a member of this team"));

        // Find membership to update
        TeamMembership membership = membershipRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this team"));

        TeamMembership.TeamRole newRole = TeamMembership.TeamRole.valueOf(request.getRole());

        // Only owners can assign owner role
        if (newRole == TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER) {
            throw new SecurityException("Access denied: Only team owners can assign TEAM_OWNER role");
        }

        // Only owners can change owner roles
        if (membership.getRole() == TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER) {
            throw new SecurityException("Access denied: Only team owners can change owner roles");
        }

        // Prevent removing last owner
        if (membership.getRole() == TeamMembership.TeamRole.TEAM_OWNER &&
            newRole != TeamMembership.TeamRole.TEAM_OWNER) {
            long ownerCount = membershipRepository.countTeamOwners(teamId);
            if (ownerCount <= 1) {
                throw new IllegalStateException("Cannot change role: This is the only team owner. Transfer ownership first.");
            }
        }

        membership.setRole(newRole);
        TeamMembership updated = membershipRepository.save(membership);
        log.info("Updated role of user {} in team {} to {}", memberId, team.getName(), request.getRole());
        return toMemberResponse(updated);
    }

    /**
     * Bulk invite members to a team
     */
    public List<TeamMemberResponse> bulkInviteMembers(UUID teamId, BulkInviteRequest request, UUID userId) {
        // Verify team exists
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        // Check permission (TEAM_OWNER or TEAM_ADMIN can invite)
        TeamMembership requesterMembership = membershipRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new SecurityException("Access denied: You are not a member of this team"));

        if (requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER &&
            requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_ADMIN) {
            throw new SecurityException("Access denied: Only team owners and admins can invite members");
        }

        List<TeamMemberResponse> addedMembers = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (TeamMemberRequest memberRequest : request.getMembers()) {
            try {
                // Find user by email
                Optional<User> userOpt = userRepository.findByEmail(memberRequest.getEmail());
                if (userOpt.isEmpty()) {
                    errors.add("User not found: " + memberRequest.getEmail());
                    continue;
                }

                User user = userOpt.get();

                // Check if already a member
                if (membershipRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
                    errors.add("Already a member: " + memberRequest.getEmail());
                    continue;
                }

                // Create membership
                TeamMembership membership = new TeamMembership();
                membership.setTeamId(teamId);
                membership.setUserId(user.getId());
                TeamMembership.TeamRole role = TeamMembership.TeamRole.valueOf(memberRequest.getRole());

                // Prevent non-owners from creating owners
                if (role == TeamMembership.TeamRole.TEAM_OWNER &&
                    requesterMembership.getRole() != TeamMembership.TeamRole.TEAM_OWNER) {
                    errors.add("Cannot assign TEAM_OWNER role: " + memberRequest.getEmail());
                    continue;
                }

                membership.setRole(role);
                TeamMembership saved = membershipRepository.save(membership);
                addedMembers.add(toMemberResponse(saved));
            } catch (Exception e) {
                errors.add("Error adding " + memberRequest.getEmail() + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty() && addedMembers.isEmpty()) {
            throw new IllegalStateException("Failed to add any members: " + String.join(", ", errors));
        }

        log.info("Bulk invited {} members to team {} ({} successful, {} errors)", 
                request.getMembers().size(), team.getName(), addedMembers.size(), errors.size());
        return addedMembers;
    }

    /**
     * Convert TeamMembership entity to TeamMemberResponse DTO
     */
    private TeamMemberResponse toMemberResponse(TeamMembership membership) {
        TeamMemberResponse response = new TeamMemberResponse();
        response.setId(membership.getId());
        response.setUserId(membership.getUserId());
        response.setRole(membership.getRole().name());
        response.setJoinedAt(membership.getJoinedAt());

        // Get user info
        Optional<User> user = userRepository.findById(membership.getUserId());
        if (user.isPresent()) {
            response.setEmail(user.get().getEmail());
            response.setDisplayName(user.get().getDisplayName());
        }

        return response;
    }
}

