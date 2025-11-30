package com.secrets.controller;

import com.secrets.dto.team.*;
import com.secrets.service.TeamService;
import com.secrets.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
@Tag(name = "Teams", description = "Team management operations")
@SecurityRequirement(name = "bearerAuth")
public class TeamController {

    private final TeamService teamService;
    private final UserService userService;

    public TeamController(TeamService teamService, UserService userService) {
        this.teamService = teamService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List teams", description = "Get all teams the current user is a member of")
    public ResponseEntity<List<TeamResponse>> listTeams(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        List<TeamResponse> teams = teamService.listTeams(userId);
        return ResponseEntity.ok(teams);
    }

    @PostMapping
    @Operation(summary = "Create team", description = "Create a new team (creator becomes TEAM_OWNER)")
    public ResponseEntity<TeamResponse> createTeam(
            @Valid @RequestBody TeamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        TeamResponse team = teamService.createTeam(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(team);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get team", description = "Get team details by ID (user must be a member)")
    public ResponseEntity<TeamResponse> getTeam(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        TeamResponse team = teamService.getTeam(id, userId);
        return ResponseEntity.ok(team);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update team", description = "Update team details (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable UUID id,
            @Valid @RequestBody TeamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        TeamResponse team = teamService.updateTeam(id, request, userId);
        return ResponseEntity.ok(team);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete team", description = "Delete a team (soft delete, TEAM_OWNER only)")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        teamService.deleteTeam(id, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Member Management Endpoints
    // =========================================================================

    @GetMapping("/{id}/members")
    @Operation(summary = "List team members", description = "Get all members of a team")
    public ResponseEntity<List<TeamMemberResponse>> listTeamMembers(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        List<TeamMemberResponse> members = teamService.listTeamMembers(id, userId);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add team member", description = "Add a member to a team by email (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<TeamMemberResponse> addTeamMember(
            @PathVariable UUID id,
            @Valid @RequestBody TeamMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        TeamMemberResponse member = teamService.addTeamMember(id, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @Operation(summary = "Remove team member", description = "Remove a member from a team (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<Void> removeTeamMember(
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        teamService.removeTeamMember(id, memberId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/members/{memberId}/role")
    @Operation(summary = "Update member role", description = "Update a team member's role (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<TeamMemberResponse> updateMemberRole(
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        TeamMemberResponse member = teamService.updateMemberRole(id, memberId, request, userId);
        return ResponseEntity.ok(member);
    }

    @PostMapping("/{id}/members/bulk-invite")
    @Operation(summary = "Bulk invite members", description = "Invite multiple members to a team at once (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<List<TeamMemberResponse>> bulkInviteMembers(
            @PathVariable UUID id,
            @Valid @RequestBody BulkInviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        List<TeamMemberResponse> members = teamService.bulkInviteMembers(id, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(members);
    }

    // =========================================================================
    // Project Management Endpoints
    // =========================================================================

    @GetMapping("/{id}/projects")
    @Operation(summary = "List team projects", description = "Get all projects in a team")
    public ResponseEntity<List<com.secrets.dto.team.TeamProjectResponse>> listTeamProjects(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        List<com.secrets.dto.team.TeamProjectResponse> projects = teamService.listTeamProjects(id, userId);
        return ResponseEntity.ok(projects);
    }

    @PostMapping("/{id}/projects/{projectId}")
    @Operation(summary = "Add project to team", description = "Add a project to a team (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<com.secrets.dto.team.TeamProjectResponse> addProjectToTeam(
            @PathVariable UUID id,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        com.secrets.dto.team.TeamProjectResponse project = teamService.addProjectToTeam(id, projectId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @DeleteMapping("/{id}/projects/{projectId}")
    @Operation(summary = "Remove project from team", description = "Remove a project from a team (TEAM_OWNER or TEAM_ADMIN only)")
    public ResponseEntity<Void> removeProjectFromTeam(
            @PathVariable UUID id,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        teamService.removeProjectFromTeam(id, projectId, userId);
        return ResponseEntity.noContent().build();
    }
}

