package com.secrets.controller;

import com.secrets.dto.invitation.InvitationResponse;
import com.secrets.service.InvitationService;
import com.secrets.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/invitations")
@Tag(name = "Project Invitations", description = "Manage project invitations")
@SecurityRequirement(name = "bearerAuth")
public class ProjectInvitationController {

    private static final Logger log = LoggerFactory.getLogger(ProjectInvitationController.class);

    private final InvitationService invitationService;
    private final UserService userService;

    public ProjectInvitationController(InvitationService invitationService, UserService userService) {
        this.invitationService = invitationService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List project invitations", description = "Get all pending invitations for a project")
    public ResponseEntity<List<InvitationResponse>> listProjectInvitations(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        // Permission check would be done in service
        List<InvitationResponse> invitations = invitationService.listProjectInvitations(projectId);
        return ResponseEntity.ok(invitations);
    }

    @DeleteMapping("/{invitationId}")
    @Operation(summary = "Revoke invitation", description = "Revoke a pending invitation")
    public ResponseEntity<Void> revokeInvitation(
            @PathVariable UUID projectId,
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        invitationService.revokeInvitation(projectId, invitationId, userId);
        return ResponseEntity.noContent().build();
    }
}

