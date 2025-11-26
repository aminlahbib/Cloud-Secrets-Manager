package com.secrets.controller;

import com.secrets.dto.project.ProjectRequest;
import com.secrets.dto.project.ProjectResponse;
import com.secrets.service.ProjectService;
import com.secrets.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Project management operations")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private static final Logger log = LoggerFactory.getLogger(ProjectController.class);

    private final ProjectService projectService;
    private final UserService userService;

    public ProjectController(ProjectService projectService, UserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List projects", description = "Get all accessible projects for the current user")
    public ResponseEntity<Page<ProjectResponse>> listProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ProjectResponse> projects = projectService.listProjects(userId, search, includeArchived, pageable);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project", description = "Get project by ID")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        ProjectResponse project = projectService.getProject(id, userId);
        return ResponseEntity.ok(project);
    }

    @PostMapping
    @Operation(summary = "Create project", description = "Create a new project")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        ProjectResponse project = projectService.createProject(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project", description = "Update an existing project")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        ProjectResponse project = projectService.updateProject(id, request, userId);
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Archive project", description = "Archive a project (soft delete)")
    public ResponseEntity<Void> archiveProject(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean permanent,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        
        if (permanent) {
            projectService.deleteProjectPermanently(id, userId);
        } else {
            projectService.archiveProject(id, userId);
        }
        
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore project", description = "Restore an archived project")
    public ResponseEntity<ProjectResponse> restoreProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        ProjectResponse project = projectService.restoreProject(id, userId);
        return ResponseEntity.ok(project);
    }

    @GetMapping("/archived")
    @Operation(summary = "List archived projects", description = "Get all archived projects")
    public ResponseEntity<Page<ProjectResponse>> listArchivedProjects(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "deletedAt"));
        Page<ProjectResponse> projects = projectService.listProjects(userId, null, true, pageable);
        return ResponseEntity.ok(projects);
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave project", description = "Leave a project (remove membership)")
    public ResponseEntity<Void> leaveProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        projectService.leaveProject(id, userId);
        return ResponseEntity.noContent().build();
    }
}

