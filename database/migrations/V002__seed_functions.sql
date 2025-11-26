-- =============================================================================
-- Cloud Secrets Manager - Helper Functions
-- =============================================================================
-- Utility functions for common operations.
-- =============================================================================

-- =============================================================================
-- Function: Create user with default workflow
-- =============================================================================
-- Called when a new user signs up. Creates the user record and their
-- default "My Workflow" workflow.
-- =============================================================================
CREATE OR REPLACE FUNCTION create_user_with_default_workflow(
    p_firebase_uid VARCHAR(128),
    p_email VARCHAR(255),
    p_display_name VARCHAR(255) DEFAULT NULL,
    p_avatar_url VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Create user
    INSERT INTO users (firebase_uid, email, display_name, avatar_url)
    VALUES (p_firebase_uid, p_email, p_display_name, p_avatar_url)
    RETURNING id INTO v_user_id;
    
    -- Create default workflow
    INSERT INTO workflows (user_id, name, is_default, display_order)
    VALUES (v_user_id, 'My Workflow', TRUE, 0);
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Create project with owner
-- =============================================================================
-- Creates a project and adds the creator as OWNER.
-- Optionally adds the project to a workflow.
-- =============================================================================
CREATE OR REPLACE FUNCTION create_project_with_owner(
    p_name VARCHAR(100),
    p_description TEXT,
    p_owner_id UUID,
    p_workflow_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_project_id UUID;
    v_default_workflow_id UUID;
BEGIN
    -- Create project
    INSERT INTO projects (name, description, created_by)
    VALUES (p_name, p_description, p_owner_id)
    RETURNING id INTO v_project_id;
    
    -- Add owner membership
    INSERT INTO project_memberships (project_id, user_id, role)
    VALUES (v_project_id, p_owner_id, 'OWNER');
    
    -- Add to workflow
    IF p_workflow_id IS NOT NULL THEN
        INSERT INTO workflow_projects (workflow_id, project_id)
        VALUES (p_workflow_id, v_project_id);
    ELSE
        -- Add to default workflow if no workflow specified
        SELECT id INTO v_default_workflow_id
        FROM workflows
        WHERE user_id = p_owner_id AND is_default = TRUE
        LIMIT 1;
        
        IF v_default_workflow_id IS NOT NULL THEN
            INSERT INTO workflow_projects (workflow_id, project_id)
            VALUES (v_default_workflow_id, v_project_id);
        END IF;
    END IF;
    
    RETURN v_project_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Accept pending invitations for user
-- =============================================================================
-- Called after user creation to auto-accept any pending invitations.
-- =============================================================================
CREATE OR REPLACE FUNCTION accept_pending_invitations(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_user_email VARCHAR(255);
    v_invitation RECORD;
    v_default_workflow_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
    
    -- Get default workflow
    SELECT id INTO v_default_workflow_id
    FROM workflows
    WHERE user_id = p_user_id AND is_default = TRUE
    LIMIT 1;
    
    -- Process each pending invitation
    FOR v_invitation IN
        SELECT id, project_id, role
        FROM project_invitations
        WHERE email = v_user_email
          AND status = 'PENDING'
          AND expires_at > CURRENT_TIMESTAMP
    LOOP
        -- Create membership
        INSERT INTO project_memberships (project_id, user_id, role, invited_by)
        SELECT v_invitation.project_id, p_user_id, v_invitation.role, invited_by
        FROM project_invitations
        WHERE id = v_invitation.id
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
        -- Add to default workflow
        IF v_default_workflow_id IS NOT NULL THEN
            INSERT INTO workflow_projects (workflow_id, project_id)
            VALUES (v_default_workflow_id, v_invitation.project_id)
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Mark invitation as accepted
        UPDATE project_invitations
        SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP
        WHERE id = v_invitation.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Check if user can perform action on project
-- =============================================================================
-- Returns TRUE if user has sufficient role for the action.
-- =============================================================================
CREATE OR REPLACE FUNCTION user_can_perform_action(
    p_user_id UUID,
    p_project_id UUID,
    p_action VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(20);
    v_is_platform_admin BOOLEAN;
BEGIN
    -- Check if platform admin
    SELECT platform_role = 'PLATFORM_ADMIN' INTO v_is_platform_admin
    FROM users WHERE id = p_user_id;
    
    -- Platform admins can only do platform-level actions, not secret operations
    -- (They need explicit project membership to access secrets)
    
    -- Get user's role in project
    SELECT role INTO v_role
    FROM project_memberships
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check permission based on action
    CASE p_action
        -- View actions (all roles)
        WHEN 'VIEW_PROJECT', 'VIEW_SECRETS' THEN
            RETURN TRUE;
        
        -- Create/Update secrets (MEMBER and above)
        WHEN 'CREATE_SECRET', 'UPDATE_SECRET' THEN
            RETURN v_role IN ('OWNER', 'ADMIN', 'MEMBER');
        
        -- Delete/Rotate/Move secrets (ADMIN and above)
        WHEN 'DELETE_SECRET', 'ROTATE_SECRET', 'MOVE_SECRET' THEN
            RETURN v_role IN ('OWNER', 'ADMIN');
        
        -- Invite members (ADMIN and above, with restrictions)
        WHEN 'INVITE_VIEWER', 'INVITE_MEMBER' THEN
            RETURN v_role IN ('OWNER', 'ADMIN');
        
        WHEN 'INVITE_ADMIN', 'INVITE_OWNER' THEN
            RETURN v_role = 'OWNER';
        
        -- Remove members (with restrictions)
        WHEN 'REMOVE_VIEWER', 'REMOVE_MEMBER' THEN
            RETURN v_role IN ('OWNER', 'ADMIN');
        
        WHEN 'REMOVE_ADMIN', 'REMOVE_OWNER' THEN
            RETURN v_role = 'OWNER';
        
        -- Project management
        WHEN 'EDIT_PROJECT' THEN
            RETURN v_role IN ('OWNER', 'ADMIN');
        
        WHEN 'ARCHIVE_PROJECT', 'DELETE_PROJECT' THEN
            RETURN v_role = 'OWNER';
        
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Get project member count by role
-- =============================================================================
CREATE OR REPLACE FUNCTION get_project_role_counts(p_project_id UUID)
RETURNS TABLE (
    owners INTEGER,
    admins INTEGER,
    members INTEGER,
    viewers INTEGER,
    total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE role = 'OWNER')::INTEGER as owners,
        COUNT(*) FILTER (WHERE role = 'ADMIN')::INTEGER as admins,
        COUNT(*) FILTER (WHERE role = 'MEMBER')::INTEGER as members,
        COUNT(*) FILTER (WHERE role = 'VIEWER')::INTEGER as viewers,
        COUNT(*)::INTEGER as total
    FROM project_memberships
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Archive project (soft delete)
-- =============================================================================
CREATE OR REPLACE FUNCTION archive_project(
    p_project_id UUID,
    p_deleted_by UUID,
    p_grace_period_days INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE projects
    SET 
        is_archived = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = p_deleted_by,
        scheduled_permanent_delete_at = CURRENT_TIMESTAMP + (p_grace_period_days || ' days')::INTERVAL
    WHERE id = p_project_id
      AND is_archived = FALSE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Restore archived project
-- =============================================================================
CREATE OR REPLACE FUNCTION restore_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE projects
    SET 
        is_archived = FALSE,
        deleted_at = NULL,
        deleted_by = NULL,
        scheduled_permanent_delete_at = NULL
    WHERE id = p_project_id
      AND is_archived = TRUE
      AND scheduled_permanent_delete_at > CURRENT_TIMESTAMP;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Permanently delete expired archived projects
-- =============================================================================
-- Should be called by a scheduled job (cron)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_projects()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM projects
        WHERE is_archived = TRUE
          AND scheduled_permanent_delete_at <= CURRENT_TIMESTAMP
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON FUNCTION create_user_with_default_workflow IS 'Creates a new user with their default workflow';
COMMENT ON FUNCTION create_project_with_owner IS 'Creates a project and adds creator as owner';
COMMENT ON FUNCTION accept_pending_invitations IS 'Auto-accepts pending invitations for a user';
COMMENT ON FUNCTION user_can_perform_action IS 'Checks if user has permission for an action on a project';
COMMENT ON FUNCTION archive_project IS 'Soft-deletes a project with grace period';
COMMENT ON FUNCTION restore_project IS 'Restores an archived project';
COMMENT ON FUNCTION cleanup_expired_projects IS 'Permanently deletes projects past their grace period';

