# CI/CD Pipeline Setup Guide

**Complete guide for setting up and using the CI/CD pipeline with Google Cloud integration.**

---

## Overview

The CI/CD pipeline automatically:
1. Builds and tests your code
2. Builds Docker images
3. Pushes to Google Artifact Registry
4. Scans for security vulnerabilities
5. Deploys to GKE using Helm

---

## Prerequisites

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

1. **GCP_SA_KEY** (Required for GCP deployment)
   - Google Cloud Service Account JSON key
   - Needs these roles:
     - `roles/artifactregistry.writer` - Push images to Artifact Registry
     - `roles/container.developer` - Deploy to GKE
     - `roles/iam.serviceAccountUser` - Use service accounts

2. **DOCKERHUB_USERNAME** (Optional - for Docker Hub)
   - Docker Hub username (if using Docker Hub)

3. **DOCKERHUB_TOKEN** (Optional - for Docker Hub)
   - Docker Hub access token (if using Docker Hub)

### How to Create GCP Service Account

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

### Add Secret to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GCP_SA_KEY`
5. Value: Paste the entire JSON content from `github-actions-key.json`
6. Click **Add secret**

---

## Pipeline Workflow

### Trigger Events

The pipeline runs on:
- **Push to `main` branch**: Full pipeline (build, test, push, deploy)
- **Push to `develop` branch**: Build and test only
- **Pull Requests**: Build and test only

### Jobs Overview

1. **build-test** (Always runs)
   - Builds both services
   - Runs unit tests
   - Generates test reports

2. **docker-build-push** (Main branch only)
   - Builds Docker images
   - Pushes to Docker Hub (if credentials configured)

3. **deploy-to-gcp** (Main branch only)
   - Builds Docker images
   - Pushes to Google Artifact Registry
   - Tags with `latest` and commit SHA

4. **security-scan** (Main branch only)
   - Scans codebase for vulnerabilities
   - Uploads results to GitHub Security tab

5. **deploy-to-gke** (Main branch only, requires approval)
   - Authenticates to GCP
   - Configures kubectl
   - Deploys using Helm
   - Waits for rollout
   - Verifies deployment

---

## Using the Pipeline

### Automatic Deployment

When you push to `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The pipeline will:
1. ✅ Build and test
2. ✅ Push images to Artifact Registry
3. ✅ Security scan
4. ⏸️ Wait for approval (if environment protection enabled)
5. ✅ Deploy to GKE

### Manual Deployment Approval

If you've enabled environment protection:

1. Go to GitHub repository
2. Click **Actions** tab
3. Find the workflow run
4. Click on **deploy-to-gke** job
5. Click **Review deployments**
6. Approve or reject

### Viewing Pipeline Status

```bash
# Check GitHub Actions
# Go to: https://github.com/YOUR_REPO/actions

# Or use GitHub CLI
gh run list
gh run watch
```

---

## Configuration

### Environment Variables

The pipeline uses these environment variables (defined in workflow):

- `GCP_PROJECT_ID`: `cloud-secrets-manager`
- `GCP_REGION`: `europe-west10`
- `ARTIFACT_REGISTRY`: `europe-west10-docker.pkg.dev`
- `GKE_CLUSTER`: `cloud-secrets-cluster-dev`
- `GKE_NAMESPACE`: `cloud-secrets-manager`

### Customizing Deployment

Edit `.github/workflows/ci-cd.yml` to customize:

- Image tags
- Helm values
- Deployment strategy
- Rollout timeout

---

## Troubleshooting

### Pipeline Fails at Authentication

**Error:** `Error: google-github-actions/auth failed with: invalid credentials`

**Solution:**
- Verify `GCP_SA_KEY` secret is set correctly
- Check service account has required roles
- Verify JSON key is valid

### Pipeline Fails at Docker Push

**Error:** `denied: Permission denied`

**Solution:**
- Verify service account has `roles/artifactregistry.writer`
- Check Artifact Registry repository exists
- Verify Docker authentication configured

### Pipeline Fails at GKE Deployment

**Error:** `Error: UPGRADE FAILED: timed out waiting for the condition`

**Solution:**
- Check pods are starting: `kubectl get pods -n cloud-secrets-manager`
- Check pod logs for errors
- Verify Helm chart values are correct
- Check resource limits (CPU/memory)

### Deployment Stuck

**Solution:**
```bash
# Check deployment status
kubectl get deployments -n cloud-secrets-manager

# Check pod status
kubectl get pods -n cloud-secrets-manager

# Check events
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp'

# View logs
kubectl logs -l app=secret-service -n cloud-secrets-manager
```

---

## Rollback

If deployment fails or you need to rollback:

### Manual Rollback

```bash
# Rollback Helm release
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Or rollback to specific revision
helm rollback cloud-secrets-manager <revision-number> -n cloud-secrets-manager

# View revision history
helm history cloud-secrets-manager -n cloud-secrets-manager
```

### Automatic Rollback

The pipeline doesn't automatically rollback. You can add a rollback step:

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    helm rollback cloud-secrets-manager -n ${{ env.GKE_NAMESPACE }}
```

---

## Best Practices

1. **Use Feature Branches**
   - Create feature branches for changes
   - Open PRs to test before merging to main
   - Main branch triggers deployment

2. **Test Before Deploy**
   - All tests must pass before deployment
   - Security scans must pass
   - Review changes in PR

3. **Use Deployment Approvals**
   - Enable environment protection for production
   - Require manual approval for deployments
   - Review changes before approving

4. **Monitor Deployments**
   - Watch pipeline execution
   - Verify deployment status
   - Check application logs after deployment

5. **Tag Releases**
   - Tag releases for version tracking
   - Use semantic versioning
   - Tag triggers can be added for release deployments

---

## Advanced Configuration

### Deploy to Different Environments

Add environment-specific jobs:

```yaml
deploy-to-staging:
  name: Deploy to Staging
  needs: deploy-to-gcp
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/develop'
  environment: staging
  # ... staging deployment steps

deploy-to-production:
  name: Deploy to Production
  needs: deploy-to-gcp
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  environment: production
  # ... production deployment steps
```

### Custom Image Tags

Use semantic versioning or branch names:

```yaml
tags: |
  ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/docker-images/secret-service:${{ github.ref_name }}
  ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/docker-images/secret-service:${{ github.sha }}
```

### Notifications

Add Slack or email notifications:

```yaml
- name: Notify on deployment
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to GKE completed'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Verification

After deployment, verify everything works:

```bash
# Check pods
kubectl get pods -n cloud-secrets-manager

# Check services
kubectl get svc -n cloud-secrets-manager

# Check deployments
kubectl get deployments -n cloud-secrets-manager

# View logs
kubectl logs -l app=secret-service -n cloud-secrets-manager -f

# Test health endpoint
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager
curl http://localhost:8080/actuator/health
```

---

## Summary

✅ **Pipeline configured** with:
- Build and test automation
- Google Artifact Registry integration
- Automated GKE deployment
- Security scanning
- Deployment verification

**Next Steps:**
1. Configure `GCP_SA_KEY` secret in GitHub
2. Push to `main` branch to trigger deployment
3. Monitor pipeline execution
4. Verify deployment in GKE

---

**Last Updated:** November 22, 2025

