-- =============================================================================
-- Repair Flyway Checksum for Migration V1
-- =============================================================================
-- This script updates the Flyway schema history to fix checksum mismatch
-- Run this if you modified a migration file after it was already applied
-- Usage: psql -h localhost -U audit_user -d audit -f scripts/repair-flyway-checksum.sql
-- =============================================================================

-- Update the checksum for version 1 to match the current file
-- The checksum changes when the migration file is modified
-- Current checksum (after INET -> VARCHAR change): 1855800724
UPDATE flyway_schema_history 
SET checksum = 1855800724 
WHERE version = '1' AND description LIKE '%create audit logs v3%';

-- Verify the update
SELECT version, description, checksum, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank;

SELECT 'Flyway checksum repaired successfully! You can now restart the audit-service.' AS status;

