-- =============================================================================
-- Cloud Secrets Manager - Development Seed Data
-- =============================================================================
-- Sample data for local development and testing.
-- Run this AFTER migrations to populate test data.
-- =============================================================================

-- =============================================================================
-- SAMPLE USERS
-- =============================================================================
-- Note: In real usage, users are created via Firebase auth.
-- These are for testing without Firebase.
-- =============================================================================

-- Create test users
INSERT INTO users (id, firebase_uid, email, display_name, platform_role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'firebase_uid_alice', 'alice@example.com', 'Alice Admin', 'PLATFORM_ADMIN'),
    ('22222222-2222-2222-2222-222222222222', 'firebase_uid_bob', 'bob@example.com', 'Bob Owner', 'USER'),
    ('33333333-3333-3333-3333-333333333333', 'firebase_uid_charlie', 'charlie@example.com', 'Charlie Member', 'USER'),
    ('44444444-4444-4444-4444-444444444444', 'firebase_uid_diana', 'diana@example.com', 'Diana Viewer', 'USER')
ON CONFLICT (firebase_uid) DO NOTHING;

-- =============================================================================
-- SAMPLE WORKFLOWS
-- =============================================================================

-- Alice's workflows
INSERT INTO workflows (id, user_id, name, is_default, display_order) VALUES
    ('aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'My Workflow', TRUE, 0),
    ('aaaa1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Platform Admin', FALSE, 1)
ON CONFLICT (user_id, name) DO NOTHING;

-- Bob's workflows
INSERT INTO workflows (id, user_id, name, is_default, display_order) VALUES
    ('bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'My Workflow', TRUE, 0),
    ('bbbb2222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Work Projects', FALSE, 1),
    ('bbbb2222-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Personal', FALSE, 2)
ON CONFLICT (user_id, name) DO NOTHING;

-- Charlie's workflows
INSERT INTO workflows (id, user_id, name, is_default, display_order) VALUES
    ('cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'My Workflow', TRUE, 0)
ON CONFLICT (user_id, name) DO NOTHING;

-- Diana's workflows
INSERT INTO workflows (id, user_id, name, is_default, display_order) VALUES
    ('dddd4444-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'My Workflow', TRUE, 0)
ON CONFLICT (user_id, name) DO NOTHING;

-- =============================================================================
-- SAMPLE PROJECTS
-- =============================================================================

INSERT INTO projects (id, name, description, created_by) VALUES
    ('eeee0001-0000-0000-0000-000000000001', 'Backend Services', 'API keys and database credentials for backend', '22222222-2222-2222-2222-222222222222'),
    ('eeee0002-0000-0000-0000-000000000002', 'Frontend Config', 'Environment variables for frontend apps', '22222222-2222-2222-2222-222222222222'),
    ('eeee0003-0000-0000-0000-000000000003', 'Bob Personal', 'Personal API keys and tokens', '22222222-2222-2222-2222-222222222222'),
    ('eeee0004-0000-0000-0000-000000000004', 'Shared Demo', 'Demo project for testing sharing', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PROJECT MEMBERSHIPS
-- =============================================================================

-- Backend Services: Bob (Owner), Charlie (Member), Diana (Viewer)
INSERT INTO project_memberships (project_id, user_id, role, invited_by) VALUES
    ('eeee0001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'OWNER', NULL),
    ('eeee0001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'MEMBER', '22222222-2222-2222-2222-222222222222'),
    ('eeee0001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'VIEWER', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Frontend Config: Bob (Owner), Charlie (Admin)
INSERT INTO project_memberships (project_id, user_id, role, invited_by) VALUES
    ('eeee0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'OWNER', NULL),
    ('eeee0002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'ADMIN', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Bob Personal: Bob (Owner) only
INSERT INTO project_memberships (project_id, user_id, role) VALUES
    ('eeee0003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'OWNER')
ON CONFLICT DO NOTHING;

-- Shared Demo: Bob (Owner), Alice (Admin)
INSERT INTO project_memberships (project_id, user_id, role, invited_by) VALUES
    ('eeee0004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'OWNER', NULL),
    ('eeee0004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'ADMIN', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- WORKFLOW-PROJECT MAPPINGS
-- =============================================================================

-- Bob's organization
INSERT INTO workflow_projects (workflow_id, project_id, display_order) VALUES
    ('bbbb2222-0000-0000-0000-000000000002', 'eeee0001-0000-0000-0000-000000000001', 0),  -- Backend in Work
    ('bbbb2222-0000-0000-0000-000000000002', 'eeee0002-0000-0000-0000-000000000002', 1),  -- Frontend in Work
    ('bbbb2222-0000-0000-0000-000000000003', 'eeee0003-0000-0000-0000-000000000003', 0),  -- Personal
    ('bbbb2222-0000-0000-0000-000000000001', 'eeee0004-0000-0000-0000-000000000004', 0)   -- Shared Demo in My Workflow
ON CONFLICT DO NOTHING;

-- Charlie's organization (same projects, different workflows)
INSERT INTO workflow_projects (workflow_id, project_id, display_order) VALUES
    ('cccc3333-0000-0000-0000-000000000001', 'eeee0001-0000-0000-0000-000000000001', 0),
    ('cccc3333-0000-0000-0000-000000000001', 'eeee0002-0000-0000-0000-000000000002', 1)
ON CONFLICT DO NOTHING;

-- Diana's organization
INSERT INTO workflow_projects (workflow_id, project_id, display_order) VALUES
    ('dddd4444-0000-0000-0000-000000000001', 'eeee0001-0000-0000-0000-000000000001', 0)
ON CONFLICT DO NOTHING;

-- Alice's organization
INSERT INTO workflow_projects (workflow_id, project_id, display_order) VALUES
    ('aaaa1111-0000-0000-0000-000000000002', 'eeee0004-0000-0000-0000-000000000004', 0)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE SECRETS
-- =============================================================================
-- Note: Values are NOT actually encrypted here for readability.
-- In production, these would be encrypted by the application.
-- =============================================================================

-- Backend Services secrets
INSERT INTO secrets (id, project_id, secret_key, encrypted_value, description, created_by) VALUES
    ('ffff0001-0000-0000-0000-000000000001', 'eeee0001-0000-0000-0000-000000000001', 'DATABASE_URL', 'ENCRYPTED:postgresql://user:pass@localhost:5432/db', 'PostgreSQL connection string', '22222222-2222-2222-2222-222222222222'),
    ('ffff0002-0000-0000-0000-000000000002', 'eeee0001-0000-0000-0000-000000000001', 'REDIS_URL', 'ENCRYPTED:redis://localhost:6379', 'Redis cache connection', '22222222-2222-2222-2222-222222222222'),
    ('ffff0003-0000-0000-0000-000000000003', 'eeee0001-0000-0000-0000-000000000001', 'JWT_SECRET', 'ENCRYPTED:super-secret-jwt-key-12345', 'JWT signing key', '22222222-2222-2222-2222-222222222222'),
    ('ffff0004-0000-0000-0000-000000000004', 'eeee0001-0000-0000-0000-000000000001', 'STRIPE_API_KEY', 'ENCRYPTED:sk_test_123456789', 'Stripe API key', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Frontend Config secrets
INSERT INTO secrets (id, project_id, secret_key, encrypted_value, description, created_by) VALUES
    ('ffff0005-0000-0000-0000-000000000005', 'eeee0002-0000-0000-0000-000000000002', 'VITE_API_URL', 'ENCRYPTED:https://api.example.com', 'API base URL', '22222222-2222-2222-2222-222222222222'),
    ('ffff0006-0000-0000-0000-000000000006', 'eeee0002-0000-0000-0000-000000000002', 'VITE_ANALYTICS_ID', 'ENCRYPTED:UA-123456789-1', 'Google Analytics ID', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Bob Personal secrets
INSERT INTO secrets (id, project_id, secret_key, encrypted_value, description, created_by) VALUES
    ('ffff0007-0000-0000-0000-000000000007', 'eeee0003-0000-0000-0000-000000000003', 'GITHUB_TOKEN', 'ENCRYPTED:ghp_xxxxxxxxxxxx', 'Personal GitHub token', '22222222-2222-2222-2222-222222222222'),
    ('ffff0008-0000-0000-0000-000000000008', 'eeee0003-0000-0000-0000-000000000003', 'NPM_TOKEN', 'ENCRYPTED:npm_xxxxxxxxxxxx', 'NPM publish token', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE SECRET VERSIONS
-- =============================================================================

INSERT INTO secret_versions (secret_id, version_number, encrypted_value, created_by, change_note) VALUES
    ('ffff0001-0000-0000-0000-000000000001', 1, 'ENCRYPTED:postgresql://user:pass@localhost:5432/db', '22222222-2222-2222-2222-222222222222', 'Initial version'),
    ('ffff0003-0000-0000-0000-000000000003', 1, 'ENCRYPTED:old-jwt-key', '22222222-2222-2222-2222-222222222222', 'Initial version'),
    ('ffff0003-0000-0000-0000-000000000003', 2, 'ENCRYPTED:super-secret-jwt-key-12345', '22222222-2222-2222-2222-222222222222', 'Rotated for security')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE AUDIT LOGS
-- =============================================================================

INSERT INTO audit_logs (project_id, user_id, action, resource_type, resource_id, resource_name, metadata) VALUES
    ('eeee0001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'PROJECT_CREATE', 'PROJECT', 'eeee0001-0000-0000-0000-000000000001', 'Backend Services', '{"source": "seed_data"}'),
    ('eeee0001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'SECRET_CREATE', 'SECRET', 'ffff0001-0000-0000-0000-000000000001', 'DATABASE_URL', '{"source": "seed_data"}'),
    ('eeee0001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'MEMBER_INVITE', 'MEMBERSHIP', NULL, 'charlie@example.com', '{"role": "MEMBER", "source": "seed_data"}'),
    ('eeee0001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'SECRET_CREATE', 'SECRET', 'ffff0004-0000-0000-0000-000000000004', 'STRIPE_API_KEY', '{"source": "seed_data"}')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SAMPLE PENDING INVITATION
-- =============================================================================

INSERT INTO project_invitations (project_id, email, role, invited_by, token, expires_at, status) VALUES
    ('eeee0001-0000-0000-0000-000000000001', 'newuser@example.com', 'MEMBER', '22222222-2222-2222-2222-222222222222', 'invite_token_123456', CURRENT_TIMESTAMP + INTERVAL '7 days', 'PENDING')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Summary
-- =============================================================================
-- Users: 4 (Alice=Platform Admin, Bob=Owner, Charlie=Member, Diana=Viewer)
-- Projects: 4
-- Secrets: 8
-- 
-- Test scenarios:
--   - Bob can manage all his projects
--   - Charlie can edit secrets in Backend Services, admin Frontend Config
--   - Diana can only view Backend Services
--   - Alice is platform admin but needs project membership to access secrets
-- =============================================================================

