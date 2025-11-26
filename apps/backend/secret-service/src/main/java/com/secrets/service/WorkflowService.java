package com.secrets.service;

import com.secrets.dto.workflow.WorkflowRequest;
import com.secrets.dto.workflow.WorkflowResponse;
import com.secrets.entity.Workflow;
import com.secrets.entity.WorkflowProject;
import com.secrets.repository.WorkflowProjectRepository;
import com.secrets.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing workflows (personal organization containers)
 */
@Service
@Transactional
public class WorkflowService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);
    
    private final WorkflowRepository workflowRepository;
    private final WorkflowProjectRepository workflowProjectRepository;
    private final UserService userService;

    public WorkflowService(WorkflowRepository workflowRepository,
                          WorkflowProjectRepository workflowProjectRepository,
                          UserService userService) {
        this.workflowRepository = workflowRepository;
        this.workflowProjectRepository = workflowProjectRepository;
        this.userService = userService;
    }

    /**
     * List all workflows for a user
     */
    @Transactional(readOnly = true)
    public List<WorkflowResponse> listWorkflows(UUID userId) {
        List<Workflow> workflows = workflowRepository.findByUserIdOrderByDisplayOrderAsc(userId);
        return workflows.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get workflow by ID
     */
    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflow(UUID workflowId, UUID userId) {
        Workflow workflow = workflowRepository.findByIdAndUserId(workflowId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));
        return toResponse(workflow);
    }

    /**
     * Create new workflow
     */
    public WorkflowResponse createWorkflow(WorkflowRequest request, UUID userId) {
        // Check if name already exists for this user
        if (workflowRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new IllegalArgumentException("Workflow with this name already exists");
        }

        // Get max display order
        Integer maxOrder = workflowRepository.findMaxDisplayOrderByUserId(userId);
        int newOrder = (maxOrder != null ? maxOrder : 0) + 1;

        Workflow workflow = new Workflow();
        workflow.setUserId(userId);
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setIcon(request.getIcon());
        workflow.setColor(request.getColor());
        workflow.setIsDefault(false);
        workflow.setDisplayOrder(newOrder);

        Workflow saved = workflowRepository.save(workflow);
        log.info("Created workflow: {} for user: {}", saved.getName(), userId);
        
        return toResponse(saved);
    }

    /**
     * Update workflow
     */
    public WorkflowResponse updateWorkflow(UUID workflowId, WorkflowRequest request, UUID userId) {
        Workflow workflow = workflowRepository.findByIdAndUserId(workflowId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));

        // Check name uniqueness if changed
        if (!workflow.getName().equals(request.getName()) && 
            workflowRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new IllegalArgumentException("Workflow with this name already exists");
        }

        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setIcon(request.getIcon());
        workflow.setColor(request.getColor());

        Workflow saved = workflowRepository.save(workflow);
        return toResponse(saved);
    }

    /**
     * Delete workflow (projects are NOT deleted, just unlinked)
     */
    public void deleteWorkflow(UUID workflowId, UUID userId) {
        Workflow workflow = workflowRepository.findByIdAndUserId(workflowId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));

        if (workflow.getIsDefault()) {
            throw new IllegalArgumentException("Cannot delete default workflow");
        }

        // Delete all workflow-project associations
        List<com.secrets.entity.WorkflowProject> associations = workflowProjectRepository.findByWorkflowIdOrderByDisplayOrderAsc(workflowId);
        workflowProjectRepository.deleteAll(associations);
        
        workflowRepository.delete(workflow);
        log.info("Deleted workflow: {} for user: {}", workflowId, userId);
    }

    /**
     * Reorder workflows
     */
    public void reorderWorkflows(List<UUID> workflowIds, UUID userId) {
        for (int i = 0; i < workflowIds.size(); i++) {
            UUID workflowId = workflowIds.get(i);
            Workflow workflow = workflowRepository.findByIdAndUserId(workflowId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
            workflow.setDisplayOrder(i);
            workflowRepository.save(workflow);
        }
    }

    /**
     * Add project to workflow
     */
    public void addProjectToWorkflow(UUID workflowId, UUID projectId, UUID userId) {
        Workflow workflow = workflowRepository.findByIdAndUserId(workflowId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));

        if (workflowProjectRepository.existsByWorkflowIdAndProjectId(workflowId, projectId)) {
            throw new IllegalArgumentException("Project already in this workflow");
        }

        Integer maxOrder = workflowProjectRepository.findMaxDisplayOrderByWorkflowId(workflowId);
        int newOrder = (maxOrder != null ? maxOrder : 0) + 1;

        WorkflowProject wp = new WorkflowProject();
        wp.setWorkflowId(workflowId);
        wp.setProjectId(projectId);
        wp.setDisplayOrder(newOrder);

        workflowProjectRepository.save(wp);
    }

    /**
     * Remove project from workflow
     */
    public void removeProjectFromWorkflow(UUID workflowId, UUID projectId, UUID userId) {
        Workflow workflow = workflowRepository.findByIdAndUserId(workflowId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));

        WorkflowProject wp = workflowProjectRepository.findByWorkflowIdAndProjectId(workflowId, projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not in this workflow"));

        workflowProjectRepository.delete(wp);
    }

    /**
     * Ensure user has a default workflow (called on signup)
     */
    public Workflow ensureDefaultWorkflow(UUID userId) {
        return workflowRepository.findByUserIdAndIsDefaultTrue(userId)
            .orElseGet(() -> {
                Workflow defaultWorkflow = new Workflow();
                defaultWorkflow.setUserId(userId);
                defaultWorkflow.setName("My Workflow");
                defaultWorkflow.setIsDefault(true);
                defaultWorkflow.setDisplayOrder(0);
                return workflowRepository.save(defaultWorkflow);
            });
    }

    private WorkflowResponse toResponse(Workflow workflow) {
        WorkflowResponse response = WorkflowResponse.from(workflow);
        // Load projects if needed
        List<WorkflowProject> projects = workflowProjectRepository.findByWorkflowIdOrderByDisplayOrderAsc(workflow.getId());
        // Note: Project details would need to be loaded separately if needed
        return response;
    }
}

