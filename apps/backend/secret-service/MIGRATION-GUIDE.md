# Database Migration Guide

## V4: Add NOT NULL Constraint to project_id

### Purpose
Complete the v2 to v3 migration by enforcing that all secrets must belong to a project.

### Prerequisites

**⚠️ CRITICAL**: Before running this migration, verify that all secrets have a `project_id`:

```sql
SELECT COUNT(*) FROM secrets WHERE project_id IS NULL;
```

**Expected result**: `0`

If you find orphaned secrets (count > 0), you must either:
1. Assign them to a project
2. Delete them
3. Create a default project for orphaned secrets

### Migration Steps

#### Option 1: Using Flyway (Recommended)

If your project uses Flyway for migrations:

```bash
cd apps/backend/secret-service
./mvnw flyway:migrate
```

The migration file `V4__add_project_id_not_null_constraint.sql` will be automatically applied.

#### Option 2: Manual Migration

1. **Connect to your database**:
   ```bash
   psql -h localhost -U your_user -d secrets_db
   ```

2. **Verify no orphaned secrets**:
   ```sql
   SELECT COUNT(*) FROM secrets WHERE project_id IS NULL;
   ```

3. **Apply the migration**:
   ```sql
   ALTER TABLE secrets ALTER COLUMN project_id SET NOT NULL;
   DROP INDEX IF EXISTS idx_secrets_key;
   ```

4. **Verify the constraint**:
   ```sql
   SELECT column_name, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'secrets' AND column_name = 'project_id';
   ```
   
   Expected: `is_nullable = 'NO'`

### Rollback (if needed)

If you need to rollback this migration:

```sql
ALTER TABLE secrets ALTER COLUMN project_id DROP NOT NULL;
```

### Impact

- **Breaking Change**: Cannot create secrets without a `project_id`
- **Performance**: Removes unused `idx_secrets_key` index
- **Compatibility**: Completes v3 migration, v2 API fully deprecated

### Testing After Migration

1. **Try to create a secret without project_id** (should fail):
   ```sql
   INSERT INTO secrets (id, secret_key, encrypted_value, created_by)
   VALUES (gen_random_uuid(), 'test', 'encrypted', 'user-id');
   -- Expected: ERROR: null value in column "project_id" violates not-null constraint
   ```

2. **Create a secret with project_id** (should succeed):
   ```sql
   INSERT INTO secrets (id, project_id, secret_key, encrypted_value, created_by)
   VALUES (gen_random_uuid(), 'valid-project-id', 'test', 'encrypted', 'user-id');
   -- Expected: INSERT 0 1
   ```

## Troubleshooting

### Error: "null value in column project_id violates not-null constraint"

**Cause**: There are secrets without a `project_id`.

**Solution**:
1. Find orphaned secrets:
   ```sql
   SELECT id, secret_key, created_by, created_at 
   FROM secrets 
   WHERE project_id IS NULL;
   ```

2. Create a default project or assign to existing projects:
   ```sql
   -- Option A: Create a default project
   INSERT INTO projects (id, name, description, owner_id)
   VALUES ('default-project-id', 'Migrated Secrets', 'Legacy secrets from v2', 'admin-user-id');
   
   -- Option B: Assign to default project
   UPDATE secrets 
   SET project_id = 'default-project-id' 
   WHERE project_id IS NULL;
   ```

3. Retry the migration.

### Error: "index idx_secrets_key does not exist"

**Cause**: The legacy index was never created or already removed.

**Solution**: This is safe to ignore. The migration script uses `IF EXISTS` to handle this gracefully.

## Next Steps

After successful migration:
1. ✅ Verify application starts without errors
2. ✅ Test secret creation via API
3. ✅ Run integration tests
4. ✅ Deploy to staging environment
5. ✅ Monitor for any issues
