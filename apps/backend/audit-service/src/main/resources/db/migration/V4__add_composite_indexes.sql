-- =============================================================================
-- Add Composite Indexes for Performance Optimization
-- =============================================================================
-- This migration adds composite indexes to optimize common query patterns
-- for audit log queries, especially for project-scoped and date-range queries.
--
-- Indexes added:
-- 1. (project_id, created_at DESC) - For project queries with date sorting
-- 2. (user_id, created_at DESC) - For user queries with date sorting
-- 3. (project_id, action) - For filtered queries by project and action
-- =============================================================================

-- Composite index for project queries with date sorting (most common pattern)
-- This index optimizes queries like: WHERE project_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_audit_project_created_at 
ON audit_logs(project_id, created_at DESC)
WHERE project_id IS NOT NULL;

-- Composite index for user queries with date sorting
-- This index optimizes queries like: WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_audit_user_created_at 
ON audit_logs(user_id, created_at DESC);

-- Partial composite index for project and action filtering
-- This index optimizes queries like: WHERE project_id = ? AND action = ?
CREATE INDEX IF NOT EXISTS idx_audit_project_action 
ON audit_logs(project_id, action)
WHERE project_id IS NOT NULL;

-- Composite index for date range queries on project
-- This index optimizes queries like: WHERE project_id = ? AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_audit_project_date_range 
ON audit_logs(project_id, created_at)
WHERE project_id IS NOT NULL;

-- Note: PostgreSQL will automatically use the most appropriate index based on
-- the query pattern. The existing single-column indexes (idx_audit_project,
-- idx_audit_user, idx_audit_created_at) are kept for queries that don't
-- use composite conditions.

