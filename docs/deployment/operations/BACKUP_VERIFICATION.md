# Backup Verification and Restore Procedures

This document outlines the backup and restore procedures for Cloud Secrets Manager, including verification steps and recovery objectives.

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Automated Backups](#automated-backups)
3. [Manual Backup Procedures](#manual-backup-procedures)
4. [Backup Verification](#backup-verification)
5. [Restore Procedures](#restore-procedures)
6. [Recovery Objectives](#recovery-objectives)
7. [Testing and Drills](#testing-and-drills)

---

## Backup Strategy

### Cloud SQL Backups

Cloud SQL provides automated backups with the following features:
- **Automated daily backups** (configurable time window)
- **Point-in-time recovery** (PITR) for up to 7 days
- **On-demand backups** for manual snapshots
- **Backup retention** (configurable, default 7 days)

### Backup Components

1. **Database Backups**
   - `secrets` database (contains all secret data)
   - `audit` database (contains audit logs)

2. **Configuration Backups**
   - Kubernetes secrets (synced from Google Secret Manager)
   - Helm values and configurations
   - Terraform state files

3. **Application State**
   - Docker images in Artifact Registry
   - Helm chart versions

---

## Automated Backups

### Cloud SQL Automated Backups

Automated backups are configured via Terraform in the PostgreSQL module:

```hcl
# In infrastructure/terraform/modules/postgresql/main.tf
backup_configuration {
  enabled                        = true
  start_time                     = "03:00"  # UTC time
  point_in_time_recovery_enabled = true
  transaction_log_retention_days = 7
  backup_retention_settings {
    retained_backups = 7
    retention_unit   = "COUNT"
  }
}
```

### Verify Automated Backups

```bash
# List all backups
gcloud sql backups list --instance=secrets-manager-db-dev-3631da18

# Get backup details
gcloud sql backups describe BACKUP_ID --instance=secrets-manager-db-dev-3631da18

# Check backup status
gcloud sql instances describe secrets-manager-db-dev-3631da18 \
  --format="value(settings.backupConfiguration)"
```

---

## Manual Backup Procedures

### Create On-Demand Backup

```bash
# Create manual backup
gcloud sql backups create \
  --instance=secrets-manager-db-dev-3631da18 \
  --description="Manual backup before deployment"

# Verify backup was created
gcloud sql backups list --instance=secrets-manager-db-dev-3631da18
```

### Export Database to Cloud Storage

```bash
# Export secrets database
gcloud sql export sql secrets-manager-db-dev-3631da18 \
  gs://cloud-secrets-manager-backups/secrets-$(date +%Y%m%d-%H%M%S).sql \
  --database=secrets

# Export audit database
gcloud sql export sql secrets-manager-db-dev-3631da18 \
  gs://cloud-secrets-manager-backups/audit-$(date +%Y%m%d-%H%M%S).sql \
  --database=audit
```

### Backup Kubernetes Secrets

```bash
# Export all secrets from namespace
kubectl get secrets -n cloud-secrets-manager -o yaml > \
  backups/k8s-secrets-$(date +%Y%m%d-%H%M%S).yaml

# Export ExternalSecrets
kubectl get externalsecrets -n cloud-secrets-manager -o yaml > \
  backups/external-secrets-$(date +%Y%m%d-%H%M%S).yaml
```

### Backup Helm Configuration

```bash
# Get current Helm values
helm get values cloud-secrets-manager -n cloud-secrets-manager > \
  backups/helm-values-$(date +%Y%m%d-%H%M%S).yaml

# Export Helm release
helm get all cloud-secrets-manager -n cloud-secrets-manager > \
  backups/helm-release-$(date +%Y%m%d-%H%M%S).yaml
```

---

## Backup Verification

### Daily Verification Checklist

1. **Check Backup Status**
   ```bash
   # Verify latest backup exists and is successful
   gcloud sql backups list --instance=secrets-manager-db-dev-3631da18 \
     --limit=1 --format="table(id,windowStartTime,status,type)"
   ```

2. **Verify Backup Size**
   ```bash
   # Check backup size (should be reasonable)
   gcloud sql backups describe BACKUP_ID --instance=secrets-manager-db-dev-3631da18 \
     --format="value(sizeBytes)"
   ```

3. **Verify Point-in-Time Recovery**
   ```bash
   # Check PITR is enabled
   gcloud sql instances describe secrets-manager-db-dev-3631da18 \
     --format="value(settings.backupConfiguration.pointInTimeRecoveryEnabled)"
   ```

### Weekly Verification

1. **Test Backup Restore** (see [Restore Procedures](#restore-procedures))
2. **Verify Backup Retention**
   ```bash
   # Count retained backups
   gcloud sql backups list --instance=secrets-manager-db-dev-3631da18 \
     --format="value(id)" | wc -l
   ```
3. **Check Backup Storage Usage**
   ```bash
   # Monitor Cloud Storage bucket size
   gsutil du -sh gs://cloud-secrets-manager-backups
   ```

---

## Restore Procedures

### Restore from Automated Backup

```bash
# List available backups
gcloud sql backups list --instance=secrets-manager-db-dev-3631da18

# Restore to a new instance (recommended for testing)
gcloud sql backups restore BACKUP_ID \
  --backup-instance=secrets-manager-db-dev-3631da18 \
  --restore-instance=secrets-manager-db-restore-test

# Or restore to existing instance (DESTRUCTIVE - use with caution)
gcloud sql backups restore BACKUP_ID \
  --backup-instance=secrets-manager-db-dev-3631da18 \
  --restore-instance=secrets-manager-db-dev-3631da18
```

### Point-in-Time Recovery (PITR)

```bash
# Restore to a specific point in time
gcloud sql instances clone secrets-manager-db-dev-3631da18 \
  secrets-manager-db-pitr-restore \
  --point-in-time="2025-11-22T10:30:00Z"
```

### Restore from Cloud Storage Export

```bash
# Import secrets database
gcloud sql import sql secrets-manager-db-dev-3631da18 \
  gs://cloud-secrets-manager-backups/secrets-20251122-103000.sql \
  --database=secrets

# Import audit database
gcloud sql import sql secrets-manager-db-dev-3631da18 \
  gs://cloud-secrets-manager-backups/audit-20251122-103000.sql \
  --database=audit
```

### Restore Kubernetes Secrets

```bash
# Restore secrets from backup
kubectl apply -f backups/k8s-secrets-20251122-103000.yaml

# Restore ExternalSecrets
kubectl apply -f backups/external-secrets-20251122-103000.yaml
```

### Complete Disaster Recovery Procedure

1. **Restore Database**
   ```bash
   # Create new instance from backup
   gcloud sql backups restore BACKUP_ID \
     --backup-instance=secrets-manager-db-dev-3631da18 \
     --restore-instance=secrets-manager-db-restored
   ```

2. **Update Connection String**
   ```bash
   # Update Helm values with new connection string
   helm upgrade cloud-secrets-manager \
     ./infrastructure/helm/cloud-secrets-manager \
     --namespace=cloud-secrets-manager \
     --set cloudSql.connectionName="cloud-secrets-manager:europe-west10:secrets-manager-db-restored"
   ```

3. **Restore Application Secrets**
   ```bash
   # Restore Kubernetes secrets
   kubectl apply -f backups/k8s-secrets-YYYYMMDD-HHMMSS.yaml
   ```

4. **Restart Applications**
   ```bash
   # Restart deployments to pick up new database
   kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
   kubectl rollout restart deployment/audit-service -n cloud-secrets-manager
   ```

5. **Verify Restore**
   ```bash
   # Check pod status
   kubectl get pods -n cloud-secrets-manager
   
   # Check application logs
   kubectl logs -n cloud-secrets-manager -l app=secret-service --tail=50
   
   # Test API endpoints
   curl http://localhost:8080/actuator/health
   ```

---

## Recovery Objectives

### Recovery Time Objective (RTO)

- **Target RTO**: 1 hour
- **Components**:
  - Database restore: 15-30 minutes
  - Application redeployment: 10-15 minutes
  - Verification and testing: 15-30 minutes

### Recovery Point Objective (RPO)

- **Target RPO**: 15 minutes (with PITR enabled)
- **Maximum Data Loss**: 15 minutes of transactions
- **Backup Frequency**: Daily automated + on-demand before major changes

---

## Testing and Drills

### Monthly Backup Verification Drill

1. **Schedule**: First Friday of each month
2. **Procedure**:
   ```bash
   # 1. Create test restore instance
   gcloud sql backups restore LATEST_BACKUP_ID \
     --backup-instance=secrets-manager-db-dev-3631da18 \
     --restore-instance=secrets-manager-db-drill-$(date +%Y%m%d)
   
   # 2. Verify data integrity
   gcloud sql connect secrets-manager-db-drill-$(date +%Y%m%d) \
     --user=secrets_user --database=secrets
   
   # Run verification queries
   SELECT COUNT(*) FROM secrets;
   SELECT MAX(created_at) FROM secrets;
   
   # 3. Clean up test instance
   gcloud sql instances delete secrets-manager-db-drill-$(date +%Y%m%d) --quiet
   ```

### Quarterly Disaster Recovery Drill

1. **Schedule**: Quarterly
2. **Scope**: Full disaster recovery simulation
3. **Procedure**:
   - Simulate complete cluster failure
   - Restore from backups
   - Verify all services are operational
   - Document lessons learned

### Backup Verification Script

Create a script to automate backup verification:

```bash
#!/bin/bash
# scripts/verify-backups.sh

INSTANCE="secrets-manager-db-dev-3631da18"
PROJECT="cloud-secrets-manager"

echo "=== Backup Verification Report ==="
echo "Date: $(date)"
echo ""

# Check latest backup
LATEST_BACKUP=$(gcloud sql backups list \
  --instance=$INSTANCE \
  --limit=1 \
  --format="value(id)")

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ ERROR: No backups found!"
  exit 1
fi

echo "✅ Latest backup: $LATEST_BACKUP"

# Check backup status
STATUS=$(gcloud sql backups describe $LATEST_BACKUP \
  --instance=$INSTANCE \
  --format="value(status)")

if [ "$STATUS" != "SUCCESSFUL" ]; then
  echo "❌ ERROR: Latest backup status: $STATUS"
  exit 1
fi

echo "✅ Backup status: $STATUS"

# Check backup age (should be less than 24 hours)
BACKUP_TIME=$(gcloud sql backups describe $LATEST_BACKUP \
  --instance=$INSTANCE \
  --format="value(windowStartTime)")

echo "✅ Backup time: $BACKUP_TIME"

# Check PITR status
PITR_ENABLED=$(gcloud sql instances describe $INSTANCE \
  --format="value(settings.backupConfiguration.pointInTimeRecoveryEnabled)")

if [ "$PITR_ENABLED" != "True" ]; then
  echo "⚠️  WARNING: Point-in-time recovery is not enabled"
else
  echo "✅ Point-in-time recovery: Enabled"
fi

echo ""
echo "=== Verification Complete ==="
```

---

## Backup Retention Policy

### Automated Backups
- **Retention**: 7 days (configurable)
- **Type**: Daily automated backups
- **PITR Window**: 7 days

### Manual Backups
- **Retention**: 30 days in Cloud Storage
- **Location**: `gs://cloud-secrets-manager-backups/`
- **Lifecycle Policy**: Automatically delete after 30 days

### Configuration Backups
- **Retention**: 90 days
- **Location**: Version control (Git) + Cloud Storage
- **Frequency**: Before each deployment

---

## Monitoring and Alerts

### Backup Failure Alerts

Set up alerts for backup failures:

```bash
# Create alert policy for backup failures
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Cloud SQL Backup Failure" \
  --condition-display-name="Backup failed" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=300s
```

### Backup Age Monitoring

Monitor backup age to ensure backups are being created:

```bash
# Check if latest backup is older than 24 hours
LATEST_BACKUP_TIME=$(gcloud sql backups list \
  --instance=secrets-manager-db-dev-3631da18 \
  --limit=1 \
  --format="value(windowStartTime)")

# Compare with current time and alert if > 24 hours
```

---

## Related Documentation

- [Cloud SQL Backup Documentation](https://cloud.google.com/sql/docs/postgres/backup-recovery/backing-up)
- [Point-in-Time Recovery](https://cloud.google.com/sql/docs/postgres/backup-recovery/pitr)
- [Operations Guide](./OPERATIONS_GUIDE.md)

---

**Last Updated**: November 22, 2025  
**Maintained by**: Cloud Secrets Manager Team

