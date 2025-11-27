# Audit Service v3 Migration Guide

**Date**: 2025-11-27  
**Status**: ✅ Migration Complete - Ready for Testing

---

## Overview

This guide documents the complete migration of the audit-service from v2 to v3 architecture, aligning it with the project-scoped v3 schema and enabling the analytics tab functionality.

---

## Migration Summary

### ✅ Completed Phases

1. **Phase 1: Entity & DTO Migration** (`feature/audit-v3-phase1-entity-dto`)
   - Updated `AuditLog` entity to v3 schema
   - Updated DTOs (`AuditLogRequest`, `AuditLogResponse`)
   - Updated repository with project-scoped queries

2. **Phase 2: Service & Controller Updates** (`feature/audit-v3-phase2-service-controller`)
   - Updated `AuditService` with new query methods
   - Added project-scoped endpoints in `AuditController`

3. **Phase 3: Client Integration** (`feature/audit-v3-phase3-client-integration`)
   - Updated `AuditClient` to use v3 structure
   - Updated all 8 audit log calls in `ProjectSecretService`

4. **Phase 4: Database Migration** (`feature/audit-v3-phase4-database-migration`)
   - Created migration script `V004__migrate_audit_logs_to_v3.sql`

5. **Phase 5: Frontend Integration** (`feature/audit-v3-phase5-frontend-integration`)
   - Implemented activity tab in `ProjectDetail` page
   - Added project-scoped audit log fetching

---

## Key Changes

### Database Schema Changes

**Before (v2)**:
- `id`: BIGSERIAL (Long)
- `username`: VARCHAR(50)
- `secretKey`: VARCHAR(255)
- `timestamp`: TIMESTAMP

**After (v3)**:
- `id`: UUID
- `project_id`: UUID (nullable)
- `user_id`: UUID (NOT NULL)
- `resource_type`: VARCHAR(50)
- `resource_id`: VARCHAR(255)
- `resource_name`: VARCHAR(255)
- `old_value`: JSONB
- `new_value`: JSONB
- `metadata`: JSONB
- `created_at`: TIMESTAMP WITH TIME ZONE

### API Changes

**New Endpoints**:
- `GET /api/audit/project/{projectId}` - Get project-scoped logs
- `GET /api/audit/project/{projectId}/action/{action}` - Filter by action
- `GET /api/audit/project/{projectId}/resource-type/{resourceType}` - Filter by resource type
- `GET /api/audit/project/{projectId}/date-range` - Filter by date range
- `GET /api/audit/user/{userId}` - Get user-scoped logs
- `GET /api/audit/resource/{resourceType}/{resourceId}` - Get resource-scoped logs

**Legacy Endpoints** (maintained for backward compatibility):
- `GET /api/audit/username/{username}` - Deprecated, returns empty
- `GET /api/audit/secret/{secretKey}` - Still works via resource lookup

### Client Changes

**Before**:
```java
auditClient.logEvent("SECRET_CREATE", secretKey, username);
```

**After**:
```java
auditClient.logSecretEvent(projectId, userId, "SECRET_CREATE", secretKey);
```

---

## Testing & Verification Plan

### 1. Pre-Deployment Verification

#### ✅ Compilation Check
- [x] Audit-service compiles successfully
- [x] Secret-service compiles successfully
- [x] No linting errors

#### Database Migration Testing
- [ ] Test migration script on staging database
- [ ] Verify data migration preserves existing logs
- [ ] Verify indexes are created correctly
- [ ] Test rollback procedure

### 2. Backend Testing

#### Unit Tests
- [ ] Test `AuditLog` entity mapping
- [ ] Test repository queries (project-scoped, user-scoped, resource-scoped)
- [ ] Test `AuditService` methods
- [ ] Test `AuditController` endpoints
- [ ] Test `AuditClient` integration

#### Integration Tests
- [ ] Test end-to-end audit logging flow
- [ ] Test project-scoped query endpoint
- [ ] Test filtering by action, resourceType, date range
- [ ] Test pagination
- [ ] Test error handling (403, 404, etc.)

#### Manual Testing Checklist
- [ ] Create a secret → Verify audit log created with project context
- [ ] Update a secret → Verify audit log created
- [ ] Delete a secret → Verify audit log created
- [ ] Rotate a secret → Verify audit log created
- [ ] Query project activity → Verify logs returned correctly
- [ ] Test pagination → Verify page navigation works
- [ ] Test filtering → Verify filters work correctly

### 3. Frontend Testing

#### Component Testing
- [ ] Test activity tab renders correctly
- [ ] Test loading states
- [ ] Test empty states
- [ ] Test error states
- [ ] Test pagination controls

#### Integration Testing
- [ ] Navigate to project → Click Activity tab
- [ ] Verify activity logs load
- [ ] Verify logs display correctly (action, user, timestamp)
- [ ] Test pagination
- [ ] Test with no activity (empty state)
- [ ] Test with permission denied (403 handling)

### 4. End-to-End Testing

#### User Flow Testing
1. **Create Secret Flow**:
   - [ ] Create a secret in a project
   - [ ] Navigate to project Activity tab
   - [ ] Verify "SECRET_CREATE" log appears
   - [ ] Verify correct project, user, and resource info

2. **Update Secret Flow**:
   - [ ] Update a secret
   - [ ] Check Activity tab
   - [ ] Verify "SECRET_UPDATE" log appears

3. **Delete Secret Flow**:
   - [ ] Delete a secret
   - [ ] Check Activity tab
   - [ ] Verify "SECRET_DELETE" log appears

4. **Multiple Projects**:
   - [ ] Create secrets in different projects
   - [ ] Verify each project's Activity tab shows only its logs

### 5. Performance Testing

- [ ] Test query performance with large datasets (1000+ logs)
- [ ] Test pagination performance
- [ ] Test concurrent audit log writes
- [ ] Monitor database query execution times
- [ ] Verify indexes are being used

### 6. Security Testing

- [ ] Verify users can only see activity for projects they have access to
- [ ] Test 403 handling for unauthorized access
- [ ] Verify audit logs cannot be modified
- [ ] Test SQL injection prevention in queries

---

## Deployment Steps

### Step 1: Backup Database
```bash
# Backup audit database before migration
pg_dump -h <host> -U <user> -d audit > audit_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply Database Migration
```bash
# Run Flyway migration (or apply manually)
flyway migrate -locations=filesystem:database/migrations -url=jdbc:postgresql://<host>:5432/audit -user=<user> -password=<password>
```

### Step 3: Deploy Backend Services
```bash
# Deploy audit-service first
cd apps/backend/audit-service
./mvnw clean package -DskipTests
# Deploy to staging/production

# Deploy secret-service
cd apps/backend/secret-service
./mvnw clean package -DskipTests
# Deploy to staging/production
```

### Step 4: Deploy Frontend
```bash
cd apps/frontend
npm run build
# Deploy to staging/production
```

### Step 5: Verify Deployment
- [ ] Check audit-service health endpoint
- [ ] Check secret-service health endpoint
- [ ] Test audit logging end-to-end
- [ ] Verify activity tab works in frontend

---

## Rollback Plan

### If Issues Occur

1. **Database Rollback**:
   ```sql
   -- Restore from backup
   psql -h <host> -U <user> -d audit < audit_backup_<timestamp>.sql
   ```

2. **Code Rollback**:
   - Revert to previous version of services
   - Frontend will gracefully handle missing endpoints (returns empty)

3. **Partial Rollback**:
   - Keep new code but use legacy endpoints temporarily
   - Update `AuditClient` to use legacy format if needed

---

## Monitoring & Observability

### Metrics to Monitor

- **Audit Log Write Success Rate**: Should be > 99%
- **Query Response Times**: Should be < 200ms for paginated queries
- **Error Rates**: Monitor 4xx/5xx errors on audit endpoints
- **Database Connection Pool**: Monitor pool usage

### Logs to Watch

- Audit log write failures
- Query timeouts
- Database connection issues
- 403/404 errors on project-scoped queries

### Alerts to Configure

- Alert if audit log write failures > 1% in 5 minutes
- Alert if query response time > 1 second
- Alert if database connection pool exhausted
- Alert on migration script failures

---

## Known Issues & Limitations

### Current Limitations

1. **Legacy Data Migration**:
   - Old audit logs will have `project_id = NULL`
   - Old logs will have generated UUIDs for `user_id` (not mapped to actual users)
   - Legacy entries marked with `metadata.migrated_from_v2 = true`

2. **User ID Mapping**:
   - If audit database doesn't have access to users table, legacy username → user_id mapping is not possible
   - Manual mapping may be required for historical data

3. **Backward Compatibility**:
   - Legacy endpoints still exist but may return limited data
   - Frontend gracefully handles missing data

### Future Improvements

- [ ] Add user lookup service to map usernames to user_ids for legacy data
- [ ] Add analytics/aggregation endpoints (counts, trends)
- [ ] Add export functionality for audit logs
- [ ] Add real-time activity feed (WebSocket)
- [ ] Add activity filtering UI in frontend

---

## Troubleshooting

### Issue: Activity Tab Shows Empty

**Possible Causes**:
1. Database migration not applied
2. No audit logs created yet
3. Permission issue (403)
4. Frontend not calling correct endpoint

**Solutions**:
1. Verify migration was applied: `SELECT COUNT(*) FROM audit_logs;`
2. Create a test secret and verify log is created
3. Check browser console for errors
4. Verify API endpoint is correct: `/api/audit/project/{projectId}`

### Issue: Audit Logs Not Being Created

**Possible Causes**:
1. Audit-service not running
2. Network connectivity issue
3. Audit-service URL misconfigured
4. Async method not executing

**Solutions**:
1. Check audit-service health: `GET /actuator/health`
2. Check secret-service logs for audit client errors
3. Verify `audit.service.url` configuration
4. Check async executor is configured

### Issue: Migration Script Fails

**Possible Causes**:
1. Existing data conflicts
2. Permission issues
3. Database version incompatibility

**Solutions**:
1. Review migration script output
2. Check database user permissions
3. Verify PostgreSQL version (should be 12+)
4. Test migration on copy of production data first

---

## Support & Documentation

### Related Documents
- `AUDIT_SERVICE_DIAGNOSTIC_REPORT.md` - Original diagnostic report
- `database/migrations/V004__migrate_audit_logs_to_v3.sql` - Migration script
- API Documentation: `/swagger-ui.html` (when services are running)

### Contact
For issues or questions, refer to the development team or create an issue in the project repository.

---

## Checklist for Production Deployment

- [ ] All tests passing
- [ ] Database backup created
- [ ] Migration tested on staging
- [ ] Rollback plan documented and tested
- [ ] Monitoring and alerts configured
- [ ] Team notified of deployment
- [ ] Deployment scheduled during low-traffic period
- [ ] Post-deployment verification plan ready

---

**Migration Status**: ✅ Complete - Ready for Testing  
**Next Action**: Execute testing plan and deploy to staging environment

