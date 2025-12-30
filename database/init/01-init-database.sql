-- =============================================================================
-- Cloud Secrets Manager - Database Initialization Script
-- =============================================================================
-- This script initializes the database with the correct user and permissions.
-- It runs automatically when the PostgreSQL container is first created.
-- Note: This runs as the postgres superuser in the context of the 'secrets' database.
-- =============================================================================

-- Create the secret_user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'secret_user') THEN
        CREATE USER secret_user WITH PASSWORD 'secret_pw';
    END IF;
END
$$;

-- Grant all privileges on the current database (secrets) to secret_user
GRANT ALL PRIVILEGES ON DATABASE secrets TO secret_user;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO secret_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO secret_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO secret_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

