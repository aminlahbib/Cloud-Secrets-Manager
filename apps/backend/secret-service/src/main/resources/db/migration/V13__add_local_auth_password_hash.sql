-- BCrypt password for local (non-Firebase) accounts; NULL for Firebase-only users.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

COMMENT ON COLUMN users.password_hash IS 'BCrypt hash for local auth when Google Identity is disabled; NULL when user signs in only via Firebase';
