# Contest Submission Checklist

Complete checklist for preparing Cloud Secrets Manager for contest submission.

## Pre-Submission Verification

### 1. Deployment Status

- [ ] All services deployed to Cloud Run
- [ ] Services are accessible and responding
- [ ] Frontend URL is accessible
- [ ] Backend APIs are responding correctly
- [ ] Database connection is working

**Verify:**
```bash
# Check service status
gcloud run services list --region=europe-west10 --project=cloud-secrets-manager

# Test frontend
curl -I $(gcloud run services describe frontend --region=europe-west10 --format='value(status.url)')

# Test backend health
curl $(gcloud run services describe secret-service --region=europe-west10 --format='value(status.url)')/actuator/health
```

### 2. Resource Optimization

- [ ] Secret Service: 512Mi memory, min-instances=1
- [ ] Audit Service: 512Mi memory, min-instances=0
- [ ] Notification Service: 512Mi memory, min-instances=0
- [ ] Frontend: 256Mi memory, min-instances=0
- [ ] JVM options optimized (MaxRAMPercentage=50.0)

**Verify:**
```bash
# Check resource allocation
gcloud run services describe secret-service --region=europe-west10 --format='yaml(spec.template.spec.containers[0].resources)'
gcloud run services describe audit-service --region=europe-west10 --format='yaml(spec.template.spec.containers[0].resources)'
gcloud run services describe notification-service --region=europe-west10 --format='yaml(spec.template.spec.containers[0].resources)'
gcloud run services describe frontend --region=europe-west10 --format='yaml(spec.template.spec.containers[0].resources)'
```

### 3. Monitoring Setup

- [ ] Cloud Monitoring enabled
- [ ] Cloud Logging configured
- [ ] Service health checks passing
- [ ] Metrics visible in Cloud Console

**Verify:**
```bash
# Check monitoring
gcloud monitoring dashboards list --project=cloud-secrets-manager
gcloud logging read "resource.type=cloud_run_revision" --limit=10 --project=cloud-secrets-manager
```

### 4. Security Configuration

- [ ] All secrets stored in Google Secret Manager
- [ ] Service accounts have correct IAM roles
- [ ] Firebase authorized domains configured
- [ ] CORS properly configured
- [ ] No hardcoded credentials in code

**Verify:**
```bash
# List secrets
gcloud secrets list --project=cloud-secrets-manager

# Check service account permissions
gcloud projects get-iam-policy cloud-secrets-manager --flatten="bindings[].members" --filter="bindings.members:serviceAccount:*"
```

### 5. Cost Optimization

- [ ] Services scale to zero when idle (except secret-service)
- [ ] Cloud SQL can be stopped when not in use
- [ ] No unnecessary resources running
- [ ] Estimated monthly cost: ~$15-25/month

**Verify:**
```bash
# Check min-instances
gcloud run services list --region=europe-west10 --format="table(metadata.name,spec.template.metadata.annotations.autoscaling\.knative\.dev/minScale)"

# Estimate costs
gcloud billing accounts list
```

### 6. Documentation

- [ ] README.md updated (Cloud Run as primary)
- [ ] Deployment guide accurate
- [ ] API documentation accessible (Swagger)
- [ ] Architecture diagrams current
- [ ] Troubleshooting guide available

**Verify:**
- [ ] README.md mentions Cloud Run first
- [ ] GKE marked as optional/advanced
- [ ] All links work
- [ ] Code examples are correct

### 7. Code Quality

- [ ] No deprecated code in active use
- [ ] TODO comments resolved or documented
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] Logging configured appropriately

**Verify:**
```bash
# Check for TODOs
grep -r "TODO\|FIXME\|XXX\|HACK" apps/ --exclude-dir=node_modules

# Check for deprecated code
grep -r "DEPRECATED\|@deprecated" apps/ infrastructure/
```

### 8. Functionality Testing

- [ ] User registration works
- [ ] User login works
- [ ] Project creation works
- [ ] Secret CRUD operations work
- [ ] Team management works
- [ ] Audit logs are recorded
- [ ] Notifications are sent
- [ ] Analytics display correctly

**Test Checklist:**
1. Create account / Sign in
2. Create a project
3. Add secrets to project
4. Create a team
5. Add members to team
6. Share project with team
7. View audit logs
8. View analytics
9. Test notifications

### 9. Performance

- [ ] Services respond within acceptable time (<2s for API calls)
- [ ] Frontend loads quickly (<3s initial load)
- [ ] No memory leaks
- [ ] Database queries optimized

**Verify:**
```bash
# Check service latency
gcloud run services describe secret-service --region=europe-west10 --format='value(status.conditions)'
```

### 10. Cleanup

- [ ] No test data in production
- [ ] No debug endpoints exposed
- [ ] Logging levels appropriate (INFO/WARN, not DEBUG)
- [ ] No sensitive data in logs

## Submission Package

### Required Files

- [ ] README.md (updated)
- [ ] LICENSE file
- [ ] Architecture documentation
- [ ] Deployment guide
- [ ] API documentation (Swagger)
- [ ] Screenshots/demo video (if required)

### Optional but Recommended

- [ ] Cost breakdown document
- [ ] Monitoring dashboard screenshots
- [ ] Performance benchmarks
- [ ] Security audit summary

## Final Steps

1. **Review all documentation** - Ensure accuracy and completeness
2. **Test deployment from scratch** - Verify deployment script works
3. **Cost verification** - Confirm optimized costs
4. **Security review** - Ensure no exposed secrets
5. **Performance check** - Verify acceptable response times
6. **Backup plan** - Document how to restore from backup

## Quick Commands

### Check Everything
```bash
# Service status
gcloud run services list --region=europe-west10

# Resource usage
gcloud run services describe secret-service --region=europe-west10 --format='yaml(spec.template.spec.containers[0].resources)'

# Health checks
curl $(gcloud run services describe secret-service --region=europe-west10 --format='value(status.url)')/actuator/health

# Cost estimate
gcloud billing accounts list
```

### Shutdown (to save costs)
```bash
./infrastructure/scripts/shutdown.sh
```

### Restart
```bash
./infrastructure/scripts/restart.sh
```

---

**Last Updated:** January 2026
**Project:** Cloud Secrets Manager
**Primary Deployment:** Google Cloud Run
