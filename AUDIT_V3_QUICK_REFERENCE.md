# Audit Service v3 - Quick Reference

## For Developers

### Logging Audit Events

**New Way (v3)**:
```java
// In ProjectSecretService or similar
auditClient.logSecretEvent(projectId, userId, "SECRET_CREATE", secretKey);
```

**Full Method Signature**:
```java
auditClient.logEvent(
    UUID projectId,      // Project context
    UUID userId,         // User performing action
    String action,       // e.g., "SECRET_CREATE"
    String resourceType, // e.g., "SECRET"
    String resourceId,   // e.g., secret key
    String resourceName, // Optional: display name
    Map<String, Object> metadata // Optional: additional context
);
```

### Querying Audit Logs

**Project-Scoped**:
```typescript
// Frontend
const logs = await auditService.getProjectAuditLogs(projectId, {
  page: 0,
  size: 20,
  action: 'SECRET_CREATE' // optional filter
});
```

**Backend API**:
```
GET /api/audit/project/{projectId}?page=0&size=20&action=SECRET_CREATE
```

### Resource Types

- `SECRET` - Secret operations
- `PROJECT` - Project operations
- `MEMBER` - Member operations
- `WORKFLOW` - Workflow operations
- `INVITATION` - Invitation operations

### Common Actions

- `SECRET_CREATE`, `SECRET_READ`, `SECRET_UPDATE`, `SECRET_DELETE`
- `SECRET_ROTATE`, `SECRET_MOVE`, `SECRET_COPY`, `SECRET_ROLLBACK`
- `PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_ARCHIVE`, `PROJECT_DELETE`
- `MEMBER_INVITE`, `MEMBER_JOIN`, `MEMBER_REMOVE`, `MEMBER_ROLE_CHANGE`

---

## For QA/Testing

### Test Scenarios

1. **Create Secret**:
   - Create a secret in a project
   - Go to Project → Activity tab
   - Verify "SECRET_CREATE" log appears

2. **Update Secret**:
   - Update a secret
   - Check Activity tab
   - Verify "SECRET_UPDATE" log appears

3. **Pagination**:
   - Create multiple secrets
   - Verify pagination works in Activity tab

4. **Empty State**:
   - New project with no activity
   - Verify empty state message appears

---

## For DevOps

### Database Migration

```bash
# Backup first!
pg_dump -h <host> -U <user> -d audit > backup.sql

# Apply migration
flyway migrate -locations=filesystem:database/migrations \
  -url=jdbc:postgresql://<host>:5432/audit \
  -user=<user> -password=<password>
```

### Health Checks

```bash
# Audit service
curl http://audit-service:8081/actuator/health

# Test endpoint
curl http://audit-service:8081/api/audit/project/{projectId}
```

### Monitoring

- Watch audit log write success rate
- Monitor query response times
- Check for 403/404 errors on project endpoints

---

## Troubleshooting

**Activity tab empty?**
1. Check database migration applied
2. Verify audit-service is running
3. Check browser console for errors
4. Verify project has activity

**Audit logs not created?**
1. Check audit-service health
2. Check secret-service logs for errors
3. Verify `audit.service.url` config
4. Check async executor is working

---

*See `AUDIT_V3_MIGRATION_GUIDE.md` for complete documentation*

