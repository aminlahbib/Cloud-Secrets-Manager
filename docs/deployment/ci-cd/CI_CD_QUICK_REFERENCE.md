# CI/CD Pipeline Quick Reference

Quick reference guide for common CI/CD operations.

---

## Pipeline Triggers

| Event | Branch | Actions |
|-------|--------|---------|
| Pull Request | Any → `main` or `develop` | Build, Test, Security Scan |
| Push | `develop` | Build, Test, Scan, Push Images, Deploy to Dev |
| Push | `main` | Build, Test, Scan, Push Images, Deploy to Staging (approval), Deploy to Production (approval) |
| Manual | Any | Trigger via GitHub Actions UI |

---

## Quick Commands

### Check Pipeline Status

```bash
# Using GitHub CLI
gh run list --limit 10
gh run watch  # Watch latest run
gh run view --web  # Open in browser
```

### Trigger Manual Deployment

```bash
# Via GitHub CLI
gh workflow run ci-cd.yml --ref main

# Via GitHub UI
# Go to Actions → CI/CD Pipeline → Run workflow
```

### View Logs

```bash
# Pipeline logs
gh run view <run-id> --log

# Deployment logs
kubectl logs -l app=secret-service -n cloud-secrets-manager --tail=100
kubectl logs -l app=audit-service -n cloud-secrets-manager --tail=100
```

### Check Deployment Status

```bash
# Via kubectl
kubectl get pods -n cloud-secrets-manager
kubectl get deployments -n cloud-secrets-manager
kubectl rollout status deployment/secret-service -n cloud-secrets-manager

# Via Helm
helm status cloud-secrets-manager -n cloud-secrets-manager
helm history cloud-secrets-manager -n cloud-secrets-manager
```

---

## Environment URLs

| Environment | URL | Branch | Approval Required |
|-------------|-----|--------|-------------------|
| Dev | https://secrets-dev.yourdomain.com | `develop` | No |
| Staging | https://secrets-staging.yourdomain.com | `main` | 1 person |
| Production | https://secrets.yourdomain.com | `main` | 2 people + 10min wait |

---

## Approval Workflow

### Approving Staging Deployment

1. Go to Actions → Find workflow run
2. Click "Deploy to Staging Environment"
3. Click "Review deployments"
4. Select "staging" environment
5. Add comment (optional)
6. Click "Approve and deploy"

### Approving Production Deployment

1. **Ensure staging is verified first**
2. Go to Actions → Find workflow run
3. Click "Deploy to Production Environment"
4. Click "Review deployments"
5. Select "production" environment
6. Add comment (required for audit)
7. Click "Approve and deploy"
8. Wait 10 minutes (safety timer)
9. Monitor deployment

---

## Rollback Commands

### Quick Rollback (Previous Version)

```bash
# Authenticate
gcloud container clusters get-credentials <cluster-name> \
  --region europe-west10 --project cloud-secrets-manager

# Rollback
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Verify
kubectl rollout status deployment/secret-service -n cloud-secrets-manager
kubectl get pods -n cloud-secrets-manager
```

### Rollback to Specific Version

```bash
# View history
helm history cloud-secrets-manager -n cloud-secrets-manager

# Rollback to specific revision
helm rollback cloud-secrets-manager <revision-number> -n cloud-secrets-manager

# Verify
kubectl rollout status deployment/secret-service -n cloud-secrets-manager
kubectl rollout status deployment/audit-service -n cloud-secrets-manager
```

---

## Troubleshooting Quick Checks

### Pipeline Failing?

```bash
# Check build logs
gh run view --log

# Check test results
# Go to Actions → Click run → Download test-results artifact
```

### Deployment Failing?

```bash
# Check pods
kubectl get pods -n cloud-secrets-manager
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Check logs
kubectl logs <pod-name> -n cloud-secrets-manager --all-containers

# Check events
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp' | tail -20

# Check secrets
kubectl get secrets -n cloud-secrets-manager
kubectl get externalsecrets -n cloud-secrets-manager
```

### Image Not Found?

```bash
# List images in Artifact Registry
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images

# Check specific image
gcloud artifacts docker images describe \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:<tag>
```

### Security Scan Failing?

```bash
# View vulnerabilities
# Go to Security tab → Code scanning alerts

# Check specific image locally
docker pull <image>
trivy image <image>

# Update dependencies
cd apps/backend/secret-service
./mvnw versions:display-dependency-updates
```

---

## Smoke Test

### Run Manually

```bash
# Test dev
./scripts/smoke-test.sh dev

# Test staging
./scripts/smoke-test.sh staging

# Test production
./scripts/smoke-test.sh production
```

### Smoke Test Checks

- ✅ Secret Service health endpoint
- ✅ Audit Service health endpoint
- ✅ Authentication enforcement (401/403)
- ✅ Response time < 2 seconds
- ✅ Kubernetes deployments ready

---

## Common Workflows

### Feature Development

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes and test
./mvnw clean verify

# 3. Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# 4. Create PR to develop
# - Fill out PR template
# - Wait for CI checks
# - Get approval
# - Merge

# 5. Verify dev deployment
# - Check Actions tab
# - Verify pods: kubectl get pods -n cloud-secrets-manager
```

### Hotfix Production

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
# ... make changes ...

# 3. Test locally
./mvnw clean verify

# 4. Create PR to main
# - Mark as [HOTFIX] in title
# - Get expedited reviews
# - Merge after approvals

# 5. Approve deployments
# - Staging: 1 approval
# - Production: 2 approvals

# 6. Monitor deployment
# - Watch Actions tab
# - Check logs
# - Run smoke tests

# 7. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### Release to Production

```bash
# 1. Merge develop to main
git checkout main
git pull origin main
git merge develop
git push origin main

# 2. Monitor pipeline
gh run watch

# 3. Approve staging deployment
# - Review changes
# - Approve in GitHub UI
# - Verify staging

# 4. Run additional tests in staging
./scripts/smoke-test.sh staging

# 5. Approve production deployment
# - Get 2 approvals
# - Wait 10 minutes
# - Monitor deployment

# 6. Verify production
./scripts/smoke-test.sh production
kubectl get pods -n cloud-secrets-manager

# 7. Tag release (optional)
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## Image Tags

### Tag Format

| Branch | Tag Format | Examples |
|--------|-----------|----------|
| `develop` | `<git-sha>`, `dev-latest` | `abc1234`, `dev-latest` |
| `main` | `<git-sha>`, `prod-latest` | `def5678`, `prod-latest` |

### Full Image Path

```
europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:<tag>
europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:<tag>
```

---

## Status Check Requirements

### To Merge PR

- ✅ Build and Test
- ✅ Trivy Code Security Scan
- ✅ At least 1-2 approvals (depends on target branch)
- ✅ All conversations resolved
- ✅ Branch is up to date

### To Deploy to Staging

- ✅ All merge requirements met
- ✅ Images built and pushed successfully
- ✅ Trivy image scans passed
- ✅ 1 manual approval

### To Deploy to Production

- ✅ Staging deployment successful
- ✅ 2 manual approvals
- ✅ 10-minute wait timer
- ✅ All smoke tests passed

---

## Emergency Contacts

For critical issues:

1. **Pipeline Failures**: DevOps team (@devops-team)
2. **Security Issues**: Security team (@security-team)
3. **Deployment Issues**: Platform team (@platform-team)
4. **Production Incidents**: On-call engineer + Platform team

---

## Useful Links

- [Full CI/CD Setup Guide](./CI_CD_SETUP.md)
- [Branch Protection Setup](./BRANCH_PROTECTION_SETUP.md)
- [GitHub Actions Workflows](/.github/workflows/)
- [Smoke Test Script](/scripts/smoke-test.sh)
- [GitHub Actions Dashboard](https://github.com/<your-org>/<your-repo>/actions)
- [GitHub Security Tab](https://github.com/<your-org>/<your-repo>/security)

---

**Last Updated:** November 22, 2025

