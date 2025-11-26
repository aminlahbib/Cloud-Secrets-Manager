package com.secrets.controller;

import com.secrets.dto.member.MemberRequest;
import com.secrets.dto.member.MemberResponse;
import com.secrets.dto.member.TransferOwnershipRequest;
import com.secrets.dto.member.UpdateMemberRoleRequest;
import com.secrets.service.MemberService;
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
@RequestMapping("/api/projects/{projectId}/members")
@Tag(name = "Project Members", description = "Project membership management")
@SecurityRequirement(name = "bearerAuth")
public class MemberController {

    private final MemberService memberService;
    private final UserService userService;

    public MemberController(MemberService memberService, UserService userService) {
        this.memberService = memberService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List members", description = "Get all members of a project")
    public ResponseEntity<List<MemberResponse>> listMembers(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        List<MemberResponse> members = memberService.listMembers(projectId, userId);
        return ResponseEntity.ok(members);
    }

    @PostMapping
    @Operation(summary = "Invite member", description = "Invite a member to the project (direct add or email invitation)")
    public ResponseEntity<?> inviteMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody MemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Object result = memberService.inviteMember(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{memberUserId}")
    @Operation(summary = "Update member role", description = "Update a member's role in the project")
    public ResponseEntity<MemberResponse> updateMemberRole(
            @PathVariable UUID projectId,
            @PathVariable UUID memberUserId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        MemberResponse member = memberService.updateMemberRole(projectId, memberUserId, request.getRole(), userId);
        return ResponseEntity.ok(member);
    }

    @DeleteMapping("/{memberUserId}")
    @Operation(summary = "Remove member", description = "Remove a member from the project")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID memberUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        memberService.removeMember(projectId, memberUserId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/transfer-ownership")
    @Operation(summary = "Transfer ownership", description = "Transfer project ownership to another member")
    public ResponseEntity<Void> transferOwnership(
            @PathVariable UUID projectId,
            @Valid @RequestBody TransferOwnershipRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        memberService.transferOwnership(projectId, request.getNewOwnerUserId(), userId);
        return ResponseEntity.ok().build();
    }
}

