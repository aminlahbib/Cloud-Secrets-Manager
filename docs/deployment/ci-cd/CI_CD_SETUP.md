# CI/CD Pipeline Setup Guide

**Complete guide for setting up and using the CI/CD pipeline with Google Cloud integration.**

---

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Prerequisites](#prerequisites)
4. [Pipeline Stages](#pipeline-stages)
5. [Environment Setup](#environment-setup)
6. [Branch Strategy](#branch-strategy)
7. [Usage Guide](#usage-guide)
8. [Security and Quality Gates](#security-and-quality-gates)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

The CI/CD pipeline automatically:
1. ✅ Builds and tests your code on every PR and push
2. ✅ Runs security scans (Trivy) on code and Docker images
3. ✅ Builds and tags Docker images with git SHA
4. ✅ Pushes images to Google Artifact Registry
5. ✅ Deploys to dev environment (from develop branch)
6. ✅ Deploys to staging with manual approval (from main branch)
7. ✅ Deploys to production with stricter approvals (from main branch)
8. ✅ Runs automated smoke tests after each deployment
9. ✅ Supports rollback with Helm

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Pull Request / Push                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Build and Test                             │
│  • Maven build (Secret Service & Audit Service)             │
│  • Unit tests                                                 │
│  • Integration tests                                          │
│  • Test report generation                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Trivy Code Security Scan                        │
│  • Filesystem vulnerability scanning                         │
│  • Fails on CRITICAL/HIGH vulnerabilities                    │
│  • Results uploaded to GitHub Security tab                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼ (if push to main/develop)
┌─────────────────────────────────────────────────────────────┐
│          Build, Scan and Push Docker Images                  │
│  • Build Docker images for both services                     │
│  • Trivy image vulnerability scanning                        │
│  • Tag with git SHA and environment prefix                   │
│  • Push to Google Artifact Registry                          │
│  • Cache layers for faster builds                            │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
            │ (develop)                  │ (main)
            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│ Deploy to Dev        │    │ Deploy to Staging             │
│ • Automated          │    │ • Manual approval (1 person)  │
│ • Helm upgrade       │    │ • Helm upgrade                │
│ • Smoke tests        │    │ • Smoke tests                 │
│ • No approval needed │    │ • Regression tests            │
└──────────────────────┘    └──────────┬───────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────────────┐
                            │ Deploy to Production          │
                            │ • Manual approval (2 people)  │
                            │ • 10-minute wait timer        │
                            │ • Helm upgrade                │
                            │ • Smoke tests                 │
                            │ • Auto-rollback on failure    │
                            └──────────────────────────────┘
```

---

## Prerequisites

### 1. Required GitHub Secrets

Configure these secrets in your GitHub repository:

| Secret Name | Description | Required Roles/Permissions |
|------------|-------------|---------------------------|
| `GCP_SA_KEY` | Google Cloud Service Account JSON key | `roles/artifactregistry.writer`<br>`roles/container.developer`<br>`roles/iam.serviceAccountUser` |

### 2. Creating GCP Service Account

**Option 1: Use Setup Script (Recommended)**

```bash
# Run the setup script
./scripts/setup-github-actions-service-account.sh

# Follow the prompts and add the key to GitHub Secrets
```

**Option 2: Manual Setup**

```bash
# Create service account
gcloud iam service-accounts create github-actions-ci \
  --display-name="GitHub Actions CI/CD" \
  --project=cloud-secrets-manager

# Grant required roles
gcloud projects add-iam-policy-binding cloud-secrets-manager \
  --member="serviceAccount:github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding cloud-secrets-manager \
  --member="serviceAccount:github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding cloud-secrets-manager \
  --member="serviceAccount:github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com

# Copy the JSON content and add to GitHub Secrets as GCP_SA_KEY
cat github-actions-key.json
```

### 3. Add Secret to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GCP_SA_KEY`
5. Value: Paste the entire JSON content from `github-actions-key.json`
6. Click **Add secret**

### 4. Configure GitHub Environments

Set up environments with protection rules:

#### Development Environment
- **Name:** `dev`
- **URL:** `https://secrets-dev.yourdomain.com`
- **Protection rules:** None (auto-deploy)
- **Branch:** Only `develop`

#### Staging Environment
- **Name:** `staging`
- **URL:** `https://secrets-staging.yourdomain.com`
- **Protection rules:** 
  - Required reviewers: 1 from DevOps team
  - Wait timer: 0 minutes
- **Branch:** Only `main`

#### Production Environment
- **Name:** `production`
- **URL:** `https://secrets.yourdomain.com`
- **Protection rules:**
  - Required reviewers: 2 from DevOps/Platform team
  - Wait timer: 10 minutes
- **Branch:** Only `main`

---

## Pipeline Stages

### Stage 1: Build and Test

**Trigger:** All PRs and pushes to main/develop

**Actions:**
- Checkout code
- Set up JDK 21
- Build Secret Service with Maven
- Build Audit Service with Maven
- Run all tests (unit + integration)
- Generate test reports
- Upload test results as artifacts

**Acceptance Criteria:**
- ✅ Maven build succeeds
- ✅ All tests pass
- ✅ Build fails on test failures

### Stage 2: Trivy Code Security Scan

**Trigger:** All PRs and pushes (runs in parallel with build)

**Actions:**
- Scan filesystem for vulnerabilities
- Check for CRITICAL and HIGH severity issues
- Upload results to GitHub Security tab
- Fail build on CRITICAL/HIGH vulnerabilities

**Acceptance Criteria:**
- ✅ Scan completes successfully
- ✅ No CRITICAL or HIGH vulnerabilities found
- ✅ Results visible in GitHub Security tab

### Stage 3: Build, Scan and Push Docker Images

**Trigger:** Push to `main` or `develop` branches only

**Actions:**
- Authenticate to GCP
- Set up Docker Buildx
- Build Secret Service image
- Scan Secret Service image with Trivy
- Push Secret Service image to Artifact Registry
- Build Audit Service image
- Scan Audit Service image with Trivy
- Push Audit Service image to Artifact Registry
- Tag images with git SHA and environment prefix

**Image Tags:**
- From `main`: `<git-sha>`, `prod-latest`
- From `develop`: `<git-sha>`, `dev-latest`

**Acceptance Criteria:**
- ✅ Images build successfully
- ✅ Images pass Trivy vulnerability scans
- ✅ Images pushed to Artifact Registry
- ✅ Images tagged correctly

### Stage 4: Deploy to Dev (from develop branch)

**Trigger:** Push to `develop` branch, after successful image push

**Actions:**
- Authenticate to GCP
- Configure kubectl for dev cluster
- Install Helm
- Create image pull secret
- Deploy with Helm using default values
- Wait for rollout to complete
- Run smoke tests

**Acceptance Criteria:**
- ✅ Deployment succeeds
- ✅ Pods are running and ready
- ✅ Smoke tests pass
- ✅ Helm history updated

### Stage 5: Deploy to Staging (from main branch)

**Trigger:** Push to `main` branch, after successful image push, **requires manual approval**

**Actions:**
- Wait for manual approval (1 reviewer)
- Authenticate to GCP
- Configure kubectl for staging cluster
- Deploy with Helm using `values-staging.yaml`
- Wait for rollout to complete
- Run smoke tests
- Run regression test suite

**Acceptance Criteria:**
- ✅ Manual approval granted
- ✅ Deployment succeeds
- ✅ Pods are running and ready
- ✅ Smoke tests pass
- ✅ Regression tests pass

### Stage 6: Deploy to Production (from main branch)

**Trigger:** After successful staging deployment, **requires manual approval from 2 reviewers**

**Actions:**
- Wait for manual approval (2 reviewers)
- Wait 10 minutes (safety timer)
- Backup current deployment
- Authenticate to GCP
- Configure kubectl for production cluster
- Deploy with Helm using `values-production.yaml`
- Wait for rollout to complete (15-minute timeout)
- Run smoke tests
- Auto-rollback on failure

**Acceptance Criteria:**
- ✅ Manual approvals granted (2 people)
- ✅ Wait timer completed
- ✅ Deployment succeeds
- ✅ Pods are running and ready
- ✅ Smoke tests pass
- ✅ Rollback works if deployment fails

---

## Environment Setup

### Environment Variables in Workflow

```yaml
env:
  GCP_PROJECT_ID: cloud-secrets-manager
  GCP_REGION: europe-west10
  ARTIFACT_REGISTRY: europe-west10-docker.pkg.dev
  GKE_CLUSTER_DEV: cloud-secrets-cluster-dev
  GKE_CLUSTER_STAGING: cloud-secrets-cluster-staging
  GKE_CLUSTER_PROD: cloud-secrets-cluster-prod
  GKE_NAMESPACE: cloud-secrets-manager
```

### Helm Values Files

- **`values.yaml`** - Default (dev environment)
- **`values-staging.yaml`** - Staging environment
- **`values-production.yaml`** - Production environment

Key differences:

| Setting | Dev | Staging | Production |
|---------|-----|---------|-----------|
| Replicas | 1 | 2 | 3 |
| Resources | Low | Medium | High |
| Image Pull Policy | IfNotPresent | Always | IfNotPresent |
| Setup Endpoint | Disabled | Enabled | Disabled |
| Autoscaling | Disabled | Disabled | Enabled (3-10) |
| PDB | Disabled | Disabled | Enabled (min 2) |

---

## Branch Strategy

### Branch Flow

```
feature/* → develop → main → production
     │         │        │
     │         │        └─→ staging deployment (approval)
     │         │            └─→ production deployment (approval)
     │         └─→ dev deployment (automatic)
     └─→ PR → build & test only
```

### Branch Protection Rules

See [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) for detailed configuration.

**Summary:**

#### `main` Branch (Solo Developer)
- ✅ Requires passing status checks (primary quality gate)
- ⬜ Requires approvals (optional for solo dev)
- ✅ No force pushes
- ⬜ No direct pushes (optional - can allow for solo dev convenience)

#### `develop` Branch (Solo Developer)
- ✅ Requires passing status checks
- ⬜ Requires approvals (optional for solo dev)
- ✅ No force pushes
- ⬜ No direct pushes (optional - can allow for solo dev)

---

## Usage Guide

### Development Workflow

#### 1. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature
```

#### 2. Make Changes and Test Locally

```bash
# Make your changes
# Test locally
cd apps/backend/secret-service
./mvnw clean verify

cd ../audit-service
./mvnw clean verify
```

#### 3. Push and Create PR

```bash
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature
```

- Go to GitHub and create a Pull Request to `develop`
- Fill out the PR template
- Wait for CI checks to pass
- Request reviews from Code Owners

#### 4. Merge to Develop (Auto-Deploy to Dev)

Once approved:
- Merge the PR to `develop`
- Pipeline automatically deploys to dev environment
- Monitor deployment in Actions tab

#### 5. Promote to Staging/Production

When ready for release:
```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

- Pipeline runs build and push
- **Manual approval required for staging**
- Approve staging deployment
- Verify staging deployment
- **Manual approval required for production** (2 people)
- Approve production deployment
- Monitor production deployment

### Manual Deployment Approval

1. Go to GitHub repository
2. Click **Actions** tab
3. Find the workflow run
4. Click on the deployment job (e.g., "Deploy to Production")
5. Click **Review deployments**
6. Select the environment
7. Click **Approve and deploy** or **Reject**

### Viewing Pipeline Status

```bash
# Using GitHub CLI
gh run list
gh run watch
gh run view <run-id>

# Or visit: https://github.com/<your-org>/<your-repo>/actions
```

---

## Security and Quality Gates

### Automated Checks (Block Merge)

1. **Build and Test** - Must pass
2. **Trivy Code Scan** - No CRITICAL/HIGH vulnerabilities
3. **Docker Image Scan** - No CRITICAL/HIGH vulnerabilities
4. **Code Owner Review** - Required for protected paths

### Manual Gates (Block Deployment)

1. **Staging Deployment** - 1 DevOps approval
2. **Production Deployment** - 2 DevOps/Platform approvals + 10min wait

### Security Scanning

**Trivy scans run at two stages:**

1. **Code Scan** - Scans source code and dependencies
2. **Image Scan** - Scans built Docker images

**Results are:**
- ❌ Fail pipeline on CRITICAL/HIGH severity
- ✅ Upload to GitHub Security tab
- 📊 Visible in PR status checks

### Test Coverage

- Unit tests for all business logic
- Integration tests with H2 database
- Smoke tests after deployment
- Regression tests in staging

---

## Troubleshooting

### Common Issues

#### 1. Pipeline Fails at Authentication

**Error:** `Error: google-github-actions/auth failed with: invalid credentials`

**Solution:**
```bash
# Verify secret is set correctly
gh secret list

# Check service account has required roles
gcloud projects get-iam-policy cloud-secrets-manager \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-ci@*"

# Regenerate key if needed
gcloud iam service-accounts keys create new-key.json \
  --iam-account=github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com

# Update GitHub secret
gh secret set GCP_SA_KEY < new-key.json
```

#### 2. Docker Push Fails

**Error:** `denied: Permission denied`

**Solution:**
```bash
# Verify Artifact Registry repository exists
gcloud artifacts repositories list \
  --project=cloud-secrets-manager \
  --location=europe-west10

# Grant necessary permissions
gcloud projects add-iam-policy-binding cloud-secrets-manager \
  --member="serviceAccount:github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

#### 3. Trivy Scan Failures

**Error:** `Trivy scan failed with vulnerabilities`

**Solution:**
1. View detailed results in GitHub Security tab
2. Update vulnerable dependencies:
   ```bash
   # Update Maven dependencies
   cd apps/backend/secret-service
   ./mvnw versions:display-dependency-updates
   ./mvnw versions:use-latest-releases
   ```
3. For base image vulnerabilities, update Dockerfile:
   ```dockerfile
   # Update base image version
   FROM eclipse-temurin:21-jre-alpine  # Use latest patch
   ```

#### 4. Deployment Timeout

**Error:** `Error: timed out waiting for the condition`

**Solution:**
```bash
# Check pod status
kubectl get pods -n cloud-secrets-manager
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Check logs
kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy

# Check events
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp'

# Common issues:
# - Image pull errors: Check image exists in Artifact Registry
# - Secrets missing: Check External Secrets are synced
# - Resource limits: Increase CPU/memory in values file
```

#### 5. Smoke Tests Fail

**Error:** `Smoke tests failed`

**Solution:**
```bash
# Run smoke tests manually
./scripts/smoke-test.sh staging

# Check if services are actually ready
kubectl get pods -n cloud-secrets-manager
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager

# Test endpoints manually
curl http://localhost:8080/actuator/health

# Check ingress
kubectl get ingress -n cloud-secrets-manager
kubectl describe ingress cloud-secrets-manager-ingress -n cloud-secrets-manager
```

### Rollback Procedures

#### Automatic Rollback (Production)

Production deployments have automatic rollback on failure built into the workflow.

#### Manual Rollback

```bash
# Authenticate to cluster
gcloud container clusters get-credentials cloud-secrets-cluster-prod \
  --region europe-west10 \
  --project cloud-secrets-manager

# View Helm history
helm history cloud-secrets-manager -n cloud-secrets-manager

# Rollback to previous revision
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Or rollback to specific revision
helm rollback cloud-secrets-manager <revision-number> -n cloud-secrets-manager

# Wait for rollout
kubectl rollout status deployment/secret-service -n cloud-secrets-manager
kubectl rollout status deployment/audit-service -n cloud-secrets-manager

# Verify
kubectl get pods -n cloud-secrets-manager
```

---

## Best Practices

### 1. Branch Management

- ✅ Use feature branches for all changes
- ✅ Keep feature branches short-lived
- ✅ Regularly sync with develop
- ✅ Delete feature branches after merge
- ❌ Never commit directly to main or develop

### 2. Pull Requests

- ✅ Fill out the PR template completely
- ✅ Link related issues
- ✅ Request reviews from Code Owners
- ✅ Ensure all CI checks pass
- ✅ Resolve all review comments
- ❌ Don't merge your own PRs (if possible)

### 3. Testing

- ✅ Run tests locally before pushing
- ✅ Add tests for new features
- ✅ Maintain test coverage
- ✅ Fix failing tests immediately
- ❌ Don't skip tests or disable checks

### 4. Deployments

- ✅ Always deploy to staging first
- ✅ Verify staging deployment thoroughly
- ✅ Run smoke tests and manual verification
- ✅ Have a rollback plan ready
- ✅ Monitor deployments closely
- ✅ Deploy during business hours when possible
- ❌ Don't approve production deploys without testing staging

### 5. Security

- ✅ Review security scan results
- ✅ Fix vulnerabilities promptly
- ✅ Keep dependencies up to date
- ✅ Never commit secrets to code
- ✅ Use External Secrets Operator for sensitive data
- ❌ Don't bypass security checks

### 6. Monitoring

- ✅ Watch pipeline execution
- ✅ Monitor deployment logs
- ✅ Check application metrics after deployment
- ✅ Set up alerts for failures
- ✅ Review failed deployments

---

## Pipeline Status Badge

Add to your README.md:

```markdown
[![CI/CD Pipeline](https://github.com/<your-org>/<your-repo>/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/<your-org>/<your-repo>/actions)
```

---

## Additional Resources

### Related Documentation

- [Branch Protection Setup](./BRANCH_PROTECTION_SETUP.md) - Configure GitHub branch protection
- [Helm Deployment Guide](../helm/HELM_DEPLOYMENT_GUIDE.md) - Helm chart usage
- [Operations Guide](../OPERATIONS_GUIDE.md) - Production operations
- [Artifact Registry Setup](../../current/ARTIFACT_REGISTRY_SETUP.md) - Artifact Registry configuration

### External Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Helm Documentation](https://helm.sh/docs/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Google Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)

---

## Summary

✅ **Pipeline Configured:**
- Automated build and test on all PRs
- Security scanning (code and images)
- Multi-environment deployment (dev, staging, production)
- Manual approval gates for staging and production
- Automated smoke tests
- Rollback capability

✅ **Quality Gates:**
- Code review required (1-2 approvals)
- All tests must pass
- Security scans must pass
- Code Owner approval required
- Deployment approvals required

✅ **Best Practices Enforced:**
- Branch protection
- Code owners
- Status checks
- Security scanning
- Automated testing
- Smoke tests

**Next Steps:**
1. ✅ Configure `GCP_SA_KEY` secret in GitHub
2. ✅ Set up GitHub Environments (dev, staging, production)
3. ✅ Configure branch protection rules
4. ✅ Update CODEOWNERS with actual team names
5. ✅ Test pipeline with a sample PR
6. ✅ Verify deployments to all environments

---

**Last Updated:** November 22, 2025
**Version:** 2.0 - Multi-environment with approval gates
