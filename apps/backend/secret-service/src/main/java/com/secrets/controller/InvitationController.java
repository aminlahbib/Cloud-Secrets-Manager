package com.secrets.controller;

import com.secrets.dto.invitation.InvitationResponse;
import com.secrets.service.InvitationService;
import com.secrets.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@Tag(name = "Invitations", description = "Project invitation management")
@SecurityRequirement(name = "bearerAuth")
public class InvitationController {

    private final InvitationService invitationService;
    private final UserService userService;

    public InvitationController(InvitationService invitationService, UserService userService) {
        this.invitationService = invitationService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List my invitations", description = "Get all pending invitations for the current user")
    public ResponseEntity<List<InvitationResponse>> listMyInvitations(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        List<InvitationResponse> invitations = invitationService.listPendingInvitations(email);
        return ResponseEntity.ok(invitations);
    }

    @PostMapping("/{token}/accept")
    @Operation(summary = "Accept invitation", description = "Accept a project invitation by token")
    public ResponseEntity<Void> acceptInvitation(
            @PathVariable String token,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        invitationService.acceptInvitation(token, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{token}/decline")
    @Operation(summary = "Decline invitation", description = "Decline a project invitation by token")
    public ResponseEntity<Void> declineInvitation(@PathVariable String token) {
        invitationService.declineInvitation(token);
        return ResponseEntity.ok().build();
    }
}

