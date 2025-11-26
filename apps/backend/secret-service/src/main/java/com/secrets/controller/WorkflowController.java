package com.secrets.controller;

import com.secrets.dto.workflow.WorkflowRequest;
import com.secrets.dto.workflow.WorkflowResponse;
import com.secrets.service.UserService;
import com.secrets.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflows")
@Tag(name = "Workflows", description = "Workflow management operations")
@SecurityRequirement(name = "bearerAuth")
public class WorkflowController {

    private static final Logger log = LoggerFactory.getLogger(WorkflowController.class);

    private final WorkflowService workflowService;
    private final UserService userService;

    public WorkflowController(WorkflowService workflowService, UserService userService) {
        this.workflowService = workflowService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List workflows", description = "Get all workflows for the current user")
    public ResponseEntity<List<WorkflowResponse>> listWorkflows(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        List<WorkflowResponse> workflows = workflowService.listWorkflows(userId);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get workflow", description = "Get workflow by ID")
    public ResponseEntity<WorkflowResponse> getWorkflow(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        WorkflowResponse workflow = workflowService.getWorkflow(id, userId);
        return ResponseEntity.ok(workflow);
    }

    @PostMapping
    @Operation(summary = "Create workflow", description = "Create a new workflow")
    public ResponseEntity<WorkflowResponse> createWorkflow(
            @Valid @RequestBody WorkflowRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        WorkflowResponse workflow = workflowService.createWorkflow(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(workflow);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update workflow", description = "Update an existing workflow")
    public ResponseEntity<WorkflowResponse> updateWorkflow(
            @PathVariable UUID id,
            @Valid @RequestBody WorkflowRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        WorkflowResponse workflow = workflowService.updateWorkflow(id, request, userId);
        return ResponseEntity.ok(workflow);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete workflow", description = "Delete a workflow (projects are not deleted)")
    public ResponseEntity<Void> deleteWorkflow(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        workflowService.deleteWorkflow(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    @Operation(summary = "Reorder workflows", description = "Update the display order of workflows")
    public ResponseEntity<Void> reorderWorkflows(
            @RequestBody List<UUID> workflowIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        workflowService.reorderWorkflows(workflowIds, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{workflowId}/projects/{projectId}")
    @Operation(summary = "Add project to workflow", description = "Add a project to a workflow")
    public ResponseEntity<Void> addProjectToWorkflow(
            @PathVariable UUID workflowId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        workflowService.addProjectToWorkflow(workflowId, projectId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{workflowId}/projects/{projectId}")
    @Operation(summary = "Remove project from workflow", description = "Remove a project from a workflow")
    public ResponseEntity<Void> removeProjectFromWorkflow(
            @PathVariable UUID workflowId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        workflowService.removeProjectFromWorkflow(workflowId, projectId, userId);
        return ResponseEntity.noContent().build();
    }
}

