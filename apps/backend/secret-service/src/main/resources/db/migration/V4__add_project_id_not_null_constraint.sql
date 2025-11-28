-- Migration: Add NOT NULL constraint to project_id column
-- Purpose: Complete v2 to v3 migration by enforcing project-scoped secrets
-- Date: 2025-11-27
-- IMPORTANT: Run this ONLY after verifying all secrets have project_id populated

-- Step 1: Verify no orphaned secrets exist
-- Run this query first to check:
-- SELECT COUNT(*) FROM secrets WHERE project_id IS NULL;
-- Expected result: 0

-- Step 2: Add NOT NULL constraint
ALTER TABLE secrets ALTER COLUMN project_id SET NOT NULL;

-- Step 3: Verify constraint was added
-- Run this query to confirm:
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'secrets' AND column_name = 'project_id';
-- Expected: is_nullable = 'NO'

-- Step 4: Drop legacy indexes (if they exist)
-- Check for legacy indexes first:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'secrets';

-- Drop legacy single-column index on secretKey if it exists
DROP INDEX IF EXISTS idx_secrets_key;

-- Note: Keep the composite index idx_secrets_project_key (projectId, secretKey)
-- This index is used by v3 API for project-scoped queries