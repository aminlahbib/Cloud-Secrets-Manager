# Audit Service Diagnostic Report
**Date**: 2025-11-27  
**Issue**: Analytics tab not working in ProjectDetail page  
**Severity**: Critical - Architectural Mismatch

---

## Executive Summary

The analytics/activity tab in the ProjectDetail page is non-functional due to a **critical architectural mismatch** between the database schema (v3) and the audit-service implementation (v2). The audit-service entity, DTOs, and API endpoints do not align with the v3 database schema, and there is no endpoint to retrieve project-scoped audit logs.

---

## 1. Problem Analysis

### 1.1 Frontend Issue
**Location**: `apps/frontend/src/pages/ProjectDetail.tsx:576-584`

The "Activity" tab in ProjectDetail shows only an empty placeholder:
```tsx
{activeTab === 'activity' && (
  <Card className="p-6">
    <EmptyState
      icon={<Activity className="h-16 w-16 text-gray-400" />}
      title="Activity Log"
      description="Recent activity for this project will appear here"
    />
  </Card>
)}
```

**Issues**:
- No data fetching logic
- No API call to audit-service
- No integration with audit service

### 1.2 Database Schema (v3) vs Entity Mismatch

**Database Schema** (`database/migrations/V001__initial_schema_v3.sql:214-228`):
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Audit Service Entity** (`apps/backend/audit-service/src/main/java/com/audit/entity/AuditLog.java`):
```java
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // ❌ Should be UUID
    private Long id;  // ❌ Should be UUID
    
    @Column(nullable = false, length = 50)
    private String username;  // ❌ Should be user_id (UUID)
    
    @Column(nullable = false, length = 20)
    private String action;  // ✅ Correct
    
    @Column(length = 255)
    private String secretKey;  // ❌ Should be resource_id + resource_type
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;  // ❌ Should be created_at
    
    // ❌ Missing: project_id, resource_type, resource_name, old_value, new_value, metadata
}
```

**Critical Mismatches**:
1. ❌ `id` type: `Long` (IDENTITY) vs `UUID` (gen_random_uuid())
2. ❌ `username` (String) vs `user_id` (UUID with FK to users)
3. ❌ `secretKey` (String) vs `resource_id` + `resource_type` (normalized)
4. ❌ `timestamp` vs `created_at`
5. ❌ Missing `project_id` (critical for project-scoped queries)
6. ❌ Missing `resource_type`, `resource_name`
7. ❌ Missing `old_value`, `new_value` (JSONB for change tracking)
8. ❌ Missing `metadata` (JSONB for extensibility)

### 1.3 Missing API Endpoints

**Current Endpoints** (`AuditController.java`):
- ✅ `GET /api/audit` - Get all logs (paginated)
- ✅ `GET /api/audit/username/{username}` - Get by username
- ✅ `GET /api/audit/secret/{secretKey}` - Get by secret key
- ✅ `GET /api/audit/date-range` - Get by date range
- ❌ **Missing**: `GET /api/audit/project/{projectId}` - Get by project ID
- ❌ **Missing**: `GET /api/audit/project/{projectId}/summary` - Analytics/aggregations

### 1.4 DTO Mismatch

**AuditLogRequest** (`AuditLogRequest.java`):
```java
public class AuditLogRequest {
    private String action;
    private String secretKey;  // ❌ Should be resource_id + resource_type
    private String username;   // ❌ Should be user_id (UUID)
    // ❌ Missing: project_id, resource_name, old_value, new_value, metadata
}
```

**AuditLogResponse** (`AuditLogResponse.java`):
- Same issues as entity - missing v3 fields

### 1.5 Audit Client Integration

**Current Implementation** (`AuditClient.java:29`):
```java
@Async
public void logEvent(String action, String secretKey, String username) {
    // Only sends: action, secretKey, username
    // ❌ Missing: projectId, userId, resourceType, resourceName, metadata
}
```

**Usage in ProjectSecretService**:
- All calls use old v2 signature: `auditClient.logEvent("SECRET_CREATE", secretKey, username)`
- No project context is passed
- No resource type normalization

---

## 2. Impact Assessment

### 2.1 Functional Impact
- ❌ **Analytics tab completely non-functional** - shows empty state
- ❌ **No project-scoped activity tracking** - cannot see what happened in a project
- ❌ **Data integrity risk** - entity doesn't match database schema
- ❌ **Migration risk** - if database was migrated to v3, entity will fail
- ⚠️ **Partial functionality** - global activity page works but uses wrong data model

### 2.2 Data Integrity Risks
1. **Type Mismatch**: `Long` ID vs `UUID` will cause runtime errors if database uses UUID
2. **Missing Foreign Keys**: No FK to `users` or `projects` tables
3. **Data Loss**: `project_id` not captured, making project-scoped queries impossible
4. **Schema Drift**: Entity and database are out of sync

### 2.3 Performance Impact
- Missing indexes on `project_id` (though index exists in DB schema)
- Repository queries cannot use project_id filtering
- No efficient way to query project activity

---

## 3. Root Cause Analysis

### 3.1 Historical Context
The audit-service appears to have been built for a **v2 architecture** where:
- Secrets were global (not project-scoped)
- User identification was by username (not UUID)
- Audit logs tracked only secret operations

The database was migrated to **v3 architecture** with:
- Project-scoped resources
- UUID-based user references
- Normalized resource tracking (resource_type + resource_id)

However, the audit-service was **never updated** to match the v3 schema.

### 3.2 Why This Wasn't Caught
1. **Separate Database**: Audit-service uses its own database (`audit` vs `secrets`)
2. **No Integration Tests**: No tests verify audit-service writes match schema
3. **Silent Failures**: If database uses UUID, JPA will fail silently or throw runtime errors
4. **Frontend Not Implemented**: Analytics tab was never fully implemented, so issue wasn't visible

---

## 4. Recommended Solutions

### 4.1 Immediate Fix (Quick Win)
**Priority**: High | **Effort**: Medium | **Risk**: Low

1. **Add Project-Scoped Endpoint** (without schema migration):
   ```java
   @GetMapping("/project/{projectId}")
   public ResponseEntity<Page<AuditLogResponse>> getLogsByProjectId(
       @PathVariable UUID projectId,
       @RequestParam(defaultValue = "0") int page,
       @RequestParam(defaultValue = "20") int size) {
       // Query by secretKey pattern or add project_id column if possible
   }
   ```
   - **Limitation**: Only works if `secretKey` contains project context (it doesn't currently)

2. **Frontend Integration**:
   - Add query in ProjectDetail to fetch project activity
   - Display activity logs in the activity tab

**Note**: This is a **workaround** that won't fully solve the problem.

### 4.2 Proper Fix (Recommended)
**Priority**: Critical | **Effort**: High | **Risk**: Medium

**Phase 1: Entity & DTO Migration**
1. Update `AuditLog` entity to match v3 schema:
   - Change `id` to `UUID`
   - Replace `username` with `user_id` (UUID, FK to users)
   - Replace `secretKey` with `resource_id` + `resource_type`
   - Add `project_id` (UUID, FK to projects, nullable)
   - Add `resource_name`, `old_value`, `new_value`, `metadata`
   - Rename `timestamp` to `created_at`

2. Update DTOs (`AuditLogRequest`, `AuditLogResponse`):
   - Match new entity structure
   - Add project context
   - Support resource type normalization

3. Update Repository:
   - Add `findByProjectId` method
   - Add `findByProjectIdAndDateRange` method
   - Update existing queries to use new fields

**Phase 2: Service Layer Updates**
1. Update `AuditService`:
   - Modify `logEvent` to accept v3 structure
   - Add project-scoped query methods
   - Add analytics/aggregation methods

2. Update `AuditController`:
   - Add `GET /api/audit/project/{projectId}` endpoint
   - Add filtering by resource_type
   - Add analytics endpoints (counts, trends)

**Phase 3: Client Integration**
1. Update `AuditClient`:
   - Change signature to: `logEvent(String action, UUID projectId, UUID userId, ResourceType resourceType, String resourceId, ...)`
   - Update all call sites in `ProjectSecretService`

2. Update all audit log calls:
   - Pass project context
   - Normalize resource types (SECRET, PROJECT, MEMBER, etc.)

**Phase 4: Database Migration**
1. Create migration script:
   - If audit database still uses old schema, migrate it
   - If already on v3 schema, verify entity matches

2. Data migration (if needed):
   - Migrate existing audit logs to new structure
   - Map `username` → `user_id` via users table
   - Extract project context from secret operations

**Phase 5: Frontend Integration**
1. Implement activity tab in ProjectDetail:
   - Fetch project-scoped logs
   - Display in timeline format
   - Add filtering by action type, user, date range

2. Add analytics visualizations:
   - Activity trends over time
   - Top users by activity
   - Action type distribution

---

## 5. Implementation Plan

### 5.1 Step-by-Step Migration

**Step 1: Audit Current State** (1-2 hours)
- [ ] Verify actual database schema in audit database
- [ ] Check if any data exists in audit_logs table
- [ ] Document current vs expected schema differences

**Step 2: Create Migration Branch** (1 hour)
- [ ] Create feature branch: `feature/audit-service-v3-migration`
- [ ] Set up test database with v3 schema

**Step 3: Entity & Repository Updates** (4-6 hours)
- [ ] Update `AuditLog` entity
- [ ] Update `AuditLogRepository` with new queries
- [ ] Write unit tests for repository methods

**Step 4: DTO & Service Updates** (3-4 hours)
- [ ] Update `AuditLogRequest` and `AuditLogResponse`
- [ ] Update `AuditService` methods
- [ ] Add project-scoped query methods
- [ ] Write service tests

**Step 5: Controller Updates** (2-3 hours)
- [ ] Add project-scoped endpoints
- [ ] Update existing endpoints
- [ ] Add request validation
- [ ] Write controller tests

**Step 6: Client Integration** (3-4 hours)
- [ ] Update `AuditClient` interface
- [ ] Update all call sites in secret-service
- [ ] Test end-to-end audit logging

**Step 7: Database Migration** (2-4 hours)
- [ ] Create Flyway migration script
- [ ] Test migration on staging
- [ ] Plan rollback strategy

**Step 8: Frontend Integration** (4-6 hours)
- [ ] Implement activity tab in ProjectDetail
- [ ] Add API service methods
- [ ] Create activity log components
- [ ] Add loading/error states

**Step 9: Testing & Validation** (4-6 hours)
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Performance testing
- [ ] User acceptance testing

**Total Estimated Effort**: 24-36 hours (3-5 days)

### 5.2 Risk Mitigation

**Risk 1: Data Loss During Migration**
- **Mitigation**: Backup audit database before migration
- **Mitigation**: Write data migration script to preserve existing logs
- **Mitigation**: Test migration on copy of production data

**Risk 2: Breaking Changes**
- **Mitigation**: Version API endpoints (`/api/v3/audit`)
- **Mitigation**: Support both old and new formats during transition
- **Mitigation**: Gradual rollout with feature flags

**Risk 3: Performance Impact**
- **Mitigation**: Add database indexes on new fields
- **Mitigation**: Test query performance with realistic data volumes
- **Mitigation**: Add pagination to all list endpoints

---

## 6. Alternative Approaches

### 6.1 Quick Fix: Add Project Context to Existing Schema
**Effort**: Low (2-4 hours) | **Quality**: Low

Add `project_id` column to existing schema without full migration:
- Modify entity to add optional `project_id`
- Update audit client to pass project context
- Add project-scoped endpoint
- **Downside**: Still doesn't solve other schema mismatches

### 6.2 Hybrid Approach: Dual Write
**Effort**: Medium (8-12 hours) | **Quality**: Medium

Write to both old and new schema during transition:
- Keep old entity for backward compatibility
- Add new entity for v3 data
- Migrate gradually
- **Downside**: Data duplication, complexity

### 6.3 Full Rewrite
**Effort**: High (40+ hours) | **Quality**: High

Complete rewrite of audit-service to match v3:
- New entity model
- New API design
- New client integration
- **Downside**: High effort, high risk

---

## 7. Testing Strategy

### 7.1 Unit Tests
- [ ] Entity mapping tests
- [ ] Repository query tests
- [ ] Service method tests
- [ ] DTO serialization tests

### 7.2 Integration Tests
- [ ] End-to-end audit logging flow
- [ ] Project-scoped query tests
- [ ] API endpoint tests
- [ ] Database migration tests

### 7.3 Performance Tests
- [ ] Query performance with large datasets
- [ ] Concurrent write performance
- [ ] Pagination performance

### 7.4 User Acceptance Tests
- [ ] Analytics tab displays project activity
- [ ] Activity logs are accurate
- [ ] Filtering works correctly
- [ ] Performance is acceptable

---

## 8. Monitoring & Observability

### 8.1 Metrics to Track
- Audit log write success/failure rate
- Query response times
- Database connection pool usage
- Error rates by endpoint

### 8.2 Alerts to Configure
- Audit log write failures
- Query timeouts
- Database connection issues
- High error rates

---

## 9. Documentation Updates Needed

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture documentation
- [ ] Migration guide
- [ ] Developer guide for audit logging
- [ ] User guide for analytics tab

---

## 10. Conclusion

The analytics tab is non-functional due to a **fundamental architectural mismatch** between the audit-service implementation (v2) and the database schema (v3). This is a **critical issue** that requires a comprehensive migration to align the service with the v3 architecture.

**Recommended Action**: Proceed with **Proper Fix (Section 4.2)** to ensure long-term maintainability and data integrity. The quick fix (Section 4.1) can be used as an interim solution if immediate functionality is required, but it will not solve the underlying architectural issues.

**Priority**: **Critical** - This affects core functionality and data integrity.

**Estimated Timeline**: 3-5 days for full migration, 1 day for quick fix.

---

## Appendix A: Code References

### Files Requiring Updates
1. `apps/backend/audit-service/src/main/java/com/audit/entity/AuditLog.java`
2. `apps/backend/audit-service/src/main/java/com/audit/dto/AuditLogRequest.java`
3. `apps/backend/audit-service/src/main/java/com/audit/dto/AuditLogResponse.java`
4. `apps/backend/audit-service/src/main/java/com/audit/repository/AuditLogRepository.java`
5. `apps/backend/audit-service/src/main/java/com/audit/service/AuditService.java`
6. `apps/backend/audit-service/src/main/java/com/audit/controller/AuditController.java`
7. `apps/backend/secret-service/src/main/java/com/secrets/client/AuditClient.java`
8. `apps/backend/secret-service/src/main/java/com/secrets/service/ProjectSecretService.java`
9. `apps/frontend/src/pages/ProjectDetail.tsx`
10. `apps/frontend/src/services/audit.ts`

### Database Files
1. `database/migrations/V001__initial_schema_v3.sql` (reference schema)
2. New migration script needed for audit database

---

**Report Generated By**: Senior Developer Analysis  
**Next Review Date**: After migration completion

