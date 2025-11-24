# Google Cloud Build Setup Guide

**Complete guide for setting up and using Google Cloud Build with Cloud Secrets Manager**

**Version:** 1.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Creating Triggers](#creating-triggers)
5. [Integration with GitHub Actions](#integration-with-github-actions)
6. [Advanced Configuration](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Google Cloud Build provides a fully managed CI/CD service that runs builds on Google Cloud Platform infrastructure. This guide covers integrating Cloud Build with the Cloud Secrets Manager project.

### Benefits

- ✅ **GCP-Native:** Seamless integration with GCP services
- ✅ **Security:** Workload Identity, no long-lived credentials
- ✅ **Performance:** Fast builds with GCP network
- ✅ **Cost-Effective:** Pay-per-use pricing
- ✅ **Scalable:** Automatic scaling

---

## Prerequisites

### Required

- ✅ Google Cloud Project with billing enabled
- ✅ Cloud Build API enabled
- ✅ Artifact Registry repository created
- ✅ GKE cluster(s) created
- ✅ GitHub repository access

### Enable APIs

```bash
# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  container.googleapis.com \
  iamcredentials.googleapis.com \
  --project=${PROJECT_ID}
```

---

## Initial Setup

### Step 1: Create Service Account

```bash
# Cloud Build service account is created automatically
# Verify it exists
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:cloud-build@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Step 2: Grant Required Roles

```bash
PROJECT_ID="cloud-secrets-manager"
CLOUD_BUILD_SA="cloud-build@${PROJECT_ID}.iam.gserviceaccount.com"

# Artifact Registry Writer
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer"

# GKE Developer (for deployments)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/container.developer"

# Service Account User (for Workload Identity)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

# Secret Manager Accessor (for deployment secrets)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"

# Cloud SQL Client (for migrations)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/cloudsql.client"
```

### Step 3: Set Up GitHub Connection

```bash
# Create GitHub connection
gcloud builds connections create github \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Follow the prompts to:
# 1. Authorize Google Cloud to access GitHub
# 2. Select your GitHub account
# 3. Install the GitHub App in your repository
```

### Step 4: Verify Configuration Files

Ensure these files exist in your repository:
- `cloudbuild.yaml` (base configuration)
- `cloudbuild-dev.yaml` (dev environment)
- `cloudbuild-staging.yaml` (staging environment)
- `cloudbuild-production.yaml` (production environment)

---

## Creating Triggers

### Trigger 1: Dev Environment (DISABLED by Default)

```bash
# Create trigger but keep it DISABLED
gcloud builds triggers create github \
  --name="build-and-deploy-dev" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^develop$" \
  --build-config="cloudbuild-dev.yaml" \
  --substitutions="_ENV=dev,_GKE_CLUSTER=cloud-secrets-cluster-dev,_DEPLOY=true" \
  --disabled \
  --project=${PROJECT_ID}
```

### Trigger 2: Staging Environment (DISABLED by Default)

```bash
# Create trigger but keep it DISABLED
gcloud builds triggers create github \
  --name="build-and-deploy-staging" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-staging.yaml" \
  --substitutions="_ENV=staging,_GKE_CLUSTER=cloud-secrets-cluster-staging,_DEPLOY=true" \
  --require-approval \
  --disabled \
  --project=${PROJECT_ID}
```

### Trigger 3: Production Environment (DISABLED by Default)

```bash
# Get approver emails
APPROVER_EMAILS="devops-team@example.com,platform-team@example.com"

# Create trigger but keep it DISABLED
gcloud builds triggers create github \
  --name="build-and-deploy-production" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-production.yaml" \
  --substitutions="_ENV=production,_GKE_CLUSTER=cloud-secrets-cluster-prod,_DEPLOY=true" \
  --require-approval \
  --approval-config="count=2,approver-identities=${APPROVER_EMAILS}" \
  --disabled \
  --project=${PROJECT_ID}
```

**Note:** All triggers are created with `--disabled` flag. They won't run automatically until you enable them.

### Trigger 4: Tag-Based Release (DISABLED by Default)

```bash
# Create trigger but keep it DISABLED
gcloud builds triggers create github \
  --name="release-build" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --tag-pattern="^v[0-9]+\\.[0-9]+\\.[0-9]+$" \
  --build-config="cloudbuild-production.yaml" \
  --substitutions="_ENV=production,_GKE_CLUSTER=cloud-secrets-cluster-prod,_DEPLOY=true" \
  --require-approval \
  --disabled \
  --project=${PROJECT_ID}
```

### Enabling Triggers Later

When you're ready to enable triggers:

```bash
# Enable a specific trigger
gcloud builds triggers update build-and-deploy-dev \
  --region=europe-west10 \
  --no-disabled \
  --project=${PROJECT_ID}

# Verify trigger is enabled
gcloud builds triggers describe build-and-deploy-dev \
  --region=europe-west10 \
  --project=${PROJECT_ID} \
  --format="value(disabled)"
# Should return: False
```

---

## Integration with GitHub Actions

### Option 1: Hybrid Approach (Recommended)

Keep GitHub Actions for code quality, use Cloud Build for deployments.

**Update `.github/workflows/ci-cd.yml`:**

```yaml
jobs:
  build-test:
    # ... existing build and test steps ...
  
  trigger-cloud-build:
    needs: build-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Trigger Cloud Build
        run: |
          ENV=${{ github.ref_name == 'main' && 'production' || 'dev' }}
          TRIGGER_NAME="build-and-deploy-${ENV}"
          
          gcloud builds triggers run ${TRIGGER_NAME} \
            --region=europe-west10 \
            --branch=${{ github.ref_name }} \
            --project=${{ env.GCP_PROJECT_ID }}
```

### Option 2: Cloud Build Only

Use Cloud Build for everything, GitHub Actions only for PR checks.

---

## Advanced Configuration

### Private Pools (VPC-Native Builds)

```bash
# Create private pool
gcloud builds worker-pools create private-pool \
  --region=europe-west10 \
  --peered-network=projects/${PROJECT_ID}/global/networks/${VPC_NAME} \
  --worker-machine-type=e2-highcpu-8 \
  --project=${PROJECT_ID}

# Update cloudbuild.yaml
options:
  pool:
    name: 'projects/${PROJECT_ID}/locations/europe-west10/workerPools/private-pool'
```

### Build Notifications

```bash
# Create Pub/Sub topic
gcloud pubsub topics create cloud-builds \
  --project=${PROJECT_ID}

# Create subscription
gcloud pubsub subscriptions create cloud-builds-sub \
  --topic=cloud-builds \
  --project=${PROJECT_ID}

# Update trigger with notification
gcloud builds triggers update build-and-deploy-dev \
  --pubsub-config=topic=projects/${PROJECT_ID}/topics/cloud-builds \
  --region=europe-west10 \
  --project=${PROJECT_ID}
```

### Build Caching

Cloud Build automatically caches layers when using `--cache-from`. Ensure your Dockerfiles use multi-stage builds for optimal caching.

### Image Signing (Optional)

```bash
# Create KMS key
gcloud kms keyrings create build-signing \
  --location=europe-west10 \
  --project=${PROJECT_ID}

gcloud kms keys create build-key \
  --keyring=build-signing \
  --location=europe-west10 \
  --purpose=asymmetric-signing \
  --default-algorithm=ec-sign-p256-sha256 \
  --project=${PROJECT_ID}

# Grant Cloud Build access
gcloud kms keys add-iam-policy-binding build-key \
  --keyring=build-signing \
  --location=europe-west10 \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/cloudkms.signerVerifier" \
  --project=${PROJECT_ID}
```

---

## Troubleshooting

### Issue 1: Build Fails with Permission Denied

**Error:** `Permission denied` when pushing to Artifact Registry

**Solution:**
```bash
# Verify service account has correct roles
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:cloud-build@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant missing role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:cloud-build@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### Issue 2: Deployment Fails

**Error:** `Error: unable to connect to server`

**Solution:**
```bash
# Verify GKE cluster access
gcloud container clusters get-credentials ${GKE_CLUSTER} \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Test kubectl access
kubectl get nodes

# Verify Cloud Build service account has container.developer role
```

### Issue 3: GitHub Connection Fails

**Error:** `Failed to create GitHub connection`

**Solution:**
```bash
# Re-authenticate GitHub connection
gcloud builds connections delete github \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Recreate connection
gcloud builds connections create github \
  --region=europe-west10 \
  --project=${PROJECT_ID}
```

### Issue 4: Build Timeout

**Error:** `Build timed out`

**Solution:**
```yaml
# Increase timeout in cloudbuild.yaml
timeout: '3600s'  # 1 hour

# Or use faster machine type
options:
  machineType: 'E2_HIGHCPU_16'
```

### Issue 5: Image Scan Fails

**Error:** `Container Analysis API not enabled`

**Solution:**
```bash
# Enable Container Analysis API
gcloud services enable containeranalysis.googleapis.com \
  --project=${PROJECT_ID}

# Grant Cloud Build access
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:cloud-build@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/containeranalysis.occurrences.editor"
```

---

## Monitoring Builds

### View Build History

```bash
# List recent builds
gcloud builds list \
  --region=europe-west10 \
  --project=${PROJECT_ID} \
  --limit=10

# View build details
gcloud builds describe ${BUILD_ID} \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# View build logs
gcloud builds log ${BUILD_ID} \
  --region=europe-west10 \
  --project=${PROJECT_ID}
```

### Cloud Monitoring Dashboards

Create custom dashboards in Cloud Monitoring to track:
- Build duration
- Build success rate
- Build frequency
- Resource utilization

---

## Best Practices

1. **Use Substitutions:** Leverage substitutions for environment-specific values
2. **Enable Caching:** Use `--cache-from` for faster builds
3. **Parallel Builds:** Build multiple images simultaneously
4. **Approval Gates:** Require approvals for production deployments
5. **Monitor Costs:** Track build costs and optimize machine types
6. **Security:** Use Workload Identity, sign images, enable Binary Authorization
7. **Documentation:** Keep build configurations documented and version-controlled

---

## Next Steps

1. ✅ Complete initial setup
2. ✅ Create triggers for all environments
3. ✅ Test builds in dev environment
4. ✅ Integrate with GitHub Actions (optional)
5. ✅ Configure notifications
6. ✅ Set up monitoring dashboards
7. ✅ Train team on new workflow

---

## Related Documentation

- [Comprehensive Analysis Report](../CI_CD_MONITORING_INFRASTRUCTURE_ANALYSIS.md)
- [CI/CD Pipeline Setup](./CI_CD_SETUP.md)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)

---

**Last Updated:** December 2024

