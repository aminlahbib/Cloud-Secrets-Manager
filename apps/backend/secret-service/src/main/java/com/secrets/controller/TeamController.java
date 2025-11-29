package com.secrets.controller;

import com.secrets.dto.team.TeamRequest;
import com.secrets.dto.team.TeamResponse;
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
}

