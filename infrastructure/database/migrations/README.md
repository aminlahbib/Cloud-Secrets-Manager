# Database Migrations

This directory contains database migration scripts for the Cloud Secrets Manager project.

## Migration Files

### V1__add_expiration_fields_to_secrets.sql
Adds expiration support to the `secrets` table:
- `expires_at` (TIMESTAMP, nullable) - When the secret expires
- `expired` (BOOLEAN, default false) - Flag indicating if secret is expired
- Indexes for efficient expiration queries

### V2__add_shared_secrets_table.sql
Creates the `shared_secrets` table for tracking secret sharing:
- Tracks which secrets are shared with which users
- Stores permission levels (READ, WRITE, etc.)
- Includes indexes for efficient queries

### manual_migration.sql
Combined migration script for manual execution if not using Flyway/Liquibase.

## Using Migrations

### Option 1: Flyway (Recommended)

1. Add Flyway dependency to `pom.xml`:
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

2. Configure Flyway in `application.yml`:
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
```

3. Copy migration files to `src/main/resources/db/migration/`

### Option 2: Manual Execution

1. Connect to your database:
```bash
# Using Cloud SQL Proxy
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432

# Connect to database
psql -h localhost -U secrets_user -d secrets
```

2. Run the manual migration script:
```bash
psql -h localhost -U secrets_user -d secrets -f infrastructure/database/migrations/manual_migration.sql
```

### Option 3: Liquibase

If you prefer Liquibase, convert the SQL files to Liquibase changelog format.

## Verification

After running migrations, verify the changes:

```sql
-- Check expiration columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'secrets' 
  AND column_name IN ('expires_at', 'expired');

-- Check shared_secrets table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'shared_secrets';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('secrets', 'shared_secrets');
```

## Rollback

If you need to rollback these migrations:

```sql
BEGIN;

-- Remove shared_secrets table
DROP TABLE IF EXISTS shared_secrets CASCADE;

-- Remove expiration columns from secrets
ALTER TABLE secrets DROP COLUMN IF EXISTS expires_at;
ALTER TABLE secrets DROP COLUMN IF EXISTS expired;

-- Remove indexes
DROP INDEX IF EXISTS idx_secrets_expires_at;
DROP INDEX IF EXISTS idx_secrets_expired;

COMMIT;
```

## Notes

- Migrations are idempotent (use `IF NOT EXISTS` and `IF EXISTS` clauses)
- All migrations include proper indexes for performance
- Comments are added for documentation
- The `expired` flag defaults to `false` for existing secrets

