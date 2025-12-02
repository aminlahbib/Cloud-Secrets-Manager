-- =============================================================================
-- Migration: Add Two-Factor Authentication Support (TOTP)
-- =============================================================================
-- Adds TOTP-based 2FA fields to users table
-- =============================================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS two_factor_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
    ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[],
    ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS two_factor_last_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pending_two_factor_secret TEXT,
    ADD COLUMN IF NOT EXISTS pending_two_factor_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled
    ON users(two_factor_enabled)
    WHERE two_factor_enabled = TRUE;

ALTER TABLE users
    ADD CONSTRAINT IF NOT EXISTS chk_two_factor_type 
    CHECK (
        (two_factor_enabled = FALSE AND two_factor_type IS NULL)
        OR (two_factor_enabled = TRUE AND two_factor_type IS NOT NULL)
    );

ALTER TABLE users
    ADD CONSTRAINT IF NOT EXISTS chk_two_factor_secret 
    CHECK (
        (two_factor_enabled = FALSE AND two_factor_secret IS NULL)
        OR (two_factor_enabled = TRUE AND two_factor_secret IS NOT NULL)
    );


