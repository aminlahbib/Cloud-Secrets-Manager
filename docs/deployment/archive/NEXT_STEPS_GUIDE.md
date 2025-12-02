# Next Steps Implementation Guide

**Quick reference guide for implementing the recommended improvements**

**Version:** 1.0  
**Last Updated:** December 2024

---

## Overview

This guide provides concise explanations and actionable steps for each recommended improvement. All steps are designed to be implemented incrementally without disrupting current operations.

---

## Step 1: Review the Analysis Report

### What It Is
The comprehensive analysis report (`CI_CD_MONITORING_INFRASTRUCTURE_ANALYSIS.md`) contains:
- Complete assessment of your current CI/CD pipeline
- Detailed monitoring infrastructure analysis
- Infrastructure setup review
- Identified gaps and recommendations
- Cloud Build integration plan

### Why It Matters
- **Understanding:** Get a complete picture of your current setup
- **Prioritization:** Identify critical vs. nice-to-have improvements
- **Planning:** Use the roadmap to plan implementation phases
- **Reference:** Keep it as documentation for future decisions

### Action Items
1. ✅ Read the full report (15-20 minutes)
2. ✅ Review the "Gaps and Recommendations" section
3. ✅ Understand the Cloud Build integration strategy
4. ✅ Note any questions or concerns
5. ✅ Share with team for alignment

### Time Required
- **Reading:** 15-20 minutes
- **Team Review:** 30-60 minutes (if shared)

---

## Step 2: Set Up Cloud Build (Disabled for Now)

### What It Is
Google Cloud Build is a fully managed CI/CD service that runs builds on GCP infrastructure. We're setting it up but keeping it **disabled** until you're ready to use it.

### Why It Matters
- **Future-Ready:** Infrastructure is ready when you need it
- **No Impact:** Disabled triggers won't run automatically
- **Testing:** You can manually trigger builds to test
- **Security:** Better than GitHub Actions for GCP-native operations

### What Gets Set Up
1. **Service Account:** Cloud Build service account with proper IAM roles
2. **GitHub Connection:** Link between GitHub and Cloud Build
3. **Configuration Files:** Build configs for all environments
4. **Triggers:** Created but **disabled** (won't run automatically)

### Action Items

#### 2.1 Enable APIs (5 minutes)
```bash
PROJECT_ID="cloud-secrets-manager"

gcloud services enable \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  container.googleapis.com \
  iamcredentials.googleapis.com \
  --project=${PROJECT_ID}
```

#### 2.2 Grant IAM Roles (5 minutes)
```bash
CLOUD_BUILD_SA="cloud-build@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/cloudsql.client"
```

#### 2.3 Create GitHub Connection (10 minutes)
```bash
# Create connection (follow prompts to authorize)
gcloud builds connections create github \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# This will:
# 1. Open browser for GitHub authorization
# 2. Ask you to select GitHub account
# 3. Install GitHub App in your repository
```

#### 2.4 Create Triggers (DISABLED) (10 minutes)
```bash
# Dev trigger (DISABLED)
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

# Staging trigger (DISABLED)
gcloud builds triggers create github \
  --name="build-and-deploy-staging" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-staging.yaml" \
  --substitutions="_ENV=staging,_GKE_CLUSTER=cloud-secrets-cluster-staging,_DEPLOY=true" \
  --disabled \
  --project=${PROJECT_ID}

# Production trigger (DISABLED)
gcloud builds triggers create github \
  --name="build-and-deploy-production" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-production.yaml" \
  --substitutions="_ENV=production,_GKE_CLUSTER=cloud-secrets-cluster-prod,_DEPLOY=true" \
  --disabled \
  --project=${PROJECT_ID}
```

#### 2.5 Verify Setup (2 minutes)
```bash
# List triggers (all should show DISABLED)
gcloud builds triggers list \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Verify connection
gcloud builds connections list \
  --region=europe-west10 \
  --project=${PROJECT_ID}
```

### How to Enable Later
```bash
# Enable a trigger when ready
gcloud builds triggers update build-and-deploy-dev \
  --region=europe-west10 \
  --no-disabled \
  --project=${PROJECT_ID}
```

### Time Required
- **Total:** ~30-40 minutes
- **Setup:** 20 minutes
- **Verification:** 5 minutes
- **Documentation:** 5 minutes

### Cost Impact
- **Setup:** $0 (no builds running)
- **When Enabled:** ~$0.006/minute per build (only when builds run)

---

## Step 3: Test Builds in Dev Environment

### What It Is
Manually trigger a Cloud Build to verify everything works before enabling automatic triggers.

### Why It Matters
- **Validation:** Ensure configuration is correct
- **Testing:** Verify builds work end-to-end
- **Confidence:** Know it works before enabling automation
- **Debugging:** Catch issues early

### Action Items

#### 3.1 Manual Build Test (10 minutes)
```bash
# Trigger a manual build (no deployment)
gcloud builds submit \
  --config=cloudbuild-dev.yaml \
  --substitutions="_ENV=dev,_GKE_CLUSTER=cloud-secrets-cluster-dev,_DEPLOY=false" \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# This will:
# 1. Build both Docker images
# 2. Scan images for vulnerabilities
# 3. Push to Artifact Registry
# 4. Skip deployment (_DEPLOY=false)
```

#### 3.2 Verify Build Results (5 minutes)
```bash
# Check build status
gcloud builds list \
  --region=europe-west10 \
  --project=${PROJECT_ID} \
  --limit=5

# View build logs
gcloud builds log ${BUILD_ID} \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Verify images in Artifact Registry
gcloud artifacts docker images list \
  ${ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images \
  --include-tags \
  --project=${PROJECT_ID}
```

#### 3.3 Test with Deployment (Optional, 15 minutes)
```bash
# Trigger build with deployment (only if you want to test deployment)
gcloud builds submit \
  --config=cloudbuild-dev.yaml \
  --substitutions="_ENV=dev,_GKE_CLUSTER=cloud-secrets-cluster-dev,_DEPLOY=true" \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Monitor deployment
kubectl get pods -n cloud-secrets-manager --watch
```

### Expected Results
- ✅ Build completes successfully
- ✅ Images pushed to Artifact Registry
- ✅ No critical vulnerabilities found
- ✅ Images tagged correctly

### Time Required
- **Build Test:** 10-15 minutes (build time)
- **Verification:** 5 minutes
- **Deployment Test:** 15-20 minutes (optional)

---

## Step 4: Integrate with Existing GitHub Actions Workflow

### What It Is
Modify your GitHub Actions workflow to optionally trigger Cloud Build instead of (or in addition to) building Docker images locally.

### Why It Matters
- **Hybrid Approach:** Best of both worlds
- **Flexibility:** Can use either system
- **Gradual Migration:** Move to Cloud Build incrementally
- **Cost Optimization:** Use Cloud Build for GCP-native operations

### Current State
Your GitHub Actions workflow currently:
- Builds Docker images on GitHub runners
- Pushes to Artifact Registry
- Deploys to GKE

### Proposed Integration
Two options:

#### Option A: Hybrid (Recommended)
- **GitHub Actions:** Code quality, testing, security scanning
- **Cloud Build:** Docker builds and deployments (triggered by GitHub Actions)

#### Option B: Parallel
- Both systems run independently
- Use Cloud Build for production, GitHub Actions for dev

### Action Items

#### 4.1 Update GitHub Actions Workflow (15 minutes)

**File:** `.github/workflows/ci-cd.yml`

Add new job after `build-test`:

```yaml
  trigger-cloud-build:
    name: Trigger Cloud Build
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
          ENV=${{ github.ref_name == 'main' && 'staging' || 'dev' }}
          TRIGGER_NAME="build-and-deploy-${ENV}"
          
          # Enable trigger temporarily
          gcloud builds triggers update ${TRIGGER_NAME} \
            --region=europe-west10 \
            --no-disabled \
            --project=${{ env.GCP_PROJECT_ID }} || true
          
          # Trigger build
          gcloud builds triggers run ${TRIGGER_NAME} \
            --region=europe-west10 \
            --branch=${{ github.ref_name }} \
            --project=${{ env.GCP_PROJECT_ID }}
          
          # Disable trigger again (if you want to keep it disabled)
          # gcloud builds triggers update ${TRIGGER_NAME} \
          #   --region=europe-west10 \
          #   --disabled \
          #   --project=${{ env.GCP_PROJECT_ID }}
```

#### 4.2 Disable Old Build Steps (Optional, 5 minutes)

Comment out or remove the `build-and-push-images` job if using Cloud Build exclusively.

#### 4.3 Test Integration (10 minutes)
```bash
# Push a test commit to develop branch
git checkout develop
git commit --allow-empty -m "Test Cloud Build integration"
git push origin develop

# Monitor in GitHub Actions
# Monitor in Cloud Build console
```

### Time Required
- **Code Changes:** 15 minutes
- **Testing:** 10 minutes
- **Total:** ~25 minutes

### When to Do This
- After Step 3 (testing builds)
- When you're confident Cloud Build works
- Before enabling automatic triggers

---

## Step 5: Configure Alert Notifications

### What It Is
Set up AlertManager to send notifications (Slack, Email, PagerDuty) when Prometheus alerts fire.

### Why It Matters
- **Visibility:** Know when issues occur
- **Response Time:** Faster incident response
- **SLO Compliance:** Track error budgets
- **Team Awareness:** Keep everyone informed

### Current State
- ✅ Prometheus alerts are defined
- ✅ AlertManager is deployed
- ❌ No notification channels configured
- ❌ Alerts fire but no one is notified

### Action Items

#### 5.1 Create AlertManager Configuration (20 minutes)

**File:** `monitoring/alertmanager-config.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-prometheus-kube-prometheus-alertmanager
  namespace: monitoring
type: Opaque
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
      # Slack webhook URL (get from Slack workspace settings)
      slack_api_url: '${SLACK_WEBHOOK_URL}'
    
    route:
      group_by: ['alertname', 'cluster', 'service', 'severity']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      routes:
      # Critical alerts go to critical channel
      - match:
          severity: critical
        receiver: 'critical-alerts'
        continue: true
      # Warning alerts go to default channel
      - match:
          severity: warning
        receiver: 'default'
      # Info alerts can be grouped
      - match:
          severity: info
        receiver: 'default'
        group_wait: 30s
        repeat_interval: 24h
    
    receivers:
    - name: 'default'
      slack_configs:
      - channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: |
          *Alert:* {{ .GroupLabels.alertname }}
          *Severity:* {{ .GroupLabels.severity }}
          *Service:* {{ .GroupLabels.job }}
          *Description:* {{ .CommonAnnotations.description }}
          *Runbook:* {{ .CommonAnnotations.runbook_url }}
    
    - name: 'critical-alerts'
      slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: |
          *CRITICAL ALERT*
          *Alert:* {{ .GroupLabels.alertname }}
          *Service:* {{ .GroupLabels.job }}
          *Description:* {{ .CommonAnnotations.description }}
          *Runbook:* {{ .CommonAnnotations.runbook_url }}
      # Add PagerDuty for critical alerts (optional)
      # pagerduty_configs:
      # - service_key: '${PAGERDUTY_SERVICE_KEY}'
```

#### 5.2 Get Slack Webhook URL (5 minutes)
1. Go to Slack workspace settings
2. Apps → Incoming Webhooks
3. Add Configuration
4. Select channel (#alerts, #critical-alerts)
5. Copy webhook URL

#### 5.3 Apply Configuration (5 minutes)
```bash
# Replace ${SLACK_WEBHOOK_URL} with actual URL
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Create config file with webhook
envsubst < monitoring/alertmanager-config.yaml | kubectl apply -f -

# Restart AlertManager to load new config
kubectl rollout restart statefulset/alertmanager-prometheus-kube-prometheus-alertmanager -n monitoring

# Verify config
kubectl get secret alertmanager-prometheus-kube-prometheus-alertmanager -n monitoring -o jsonpath='{.data.alertmanager\.yaml}' | base64 -d
```

#### 5.4 Test Alerts (10 minutes)
```bash
# Trigger a test alert (delete a pod)
kubectl delete pod -n cloud-secrets-manager -l app=secret-service

# Wait 1-2 minutes
# Check Slack channel for alert

# Or use AlertManager UI
kubectl port-forward -n monitoring svc/alertmanager-prometheus-kube-prometheus-alertmanager 9093:9093
# Open http://localhost:9093
# Click "New Alert" to test
```

### Alternative: Email Notifications
```yaml
receivers:
- name: 'default'
  email_configs:
  - to: 'devops-team@example.com'
    from: 'alerts@example.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'alerts@example.com'
    auth_password: '${SMTP_PASSWORD}'
    headers:
      Subject: 'Alert: {{ .GroupLabels.alertname }}'
```

### Time Required
- **Configuration:** 20 minutes
- **Setup:** 10 minutes
- **Testing:** 10 minutes
- **Total:** ~40 minutes

### Cost Impact
- **Slack:** Free (webhook)
- **Email:** Free (SMTP)
- **PagerDuty:** Paid (if used)

---

## Step 6: Fix Tempo Storage Persistence

### What It Is
Configure Tempo (distributed tracing) to use persistent storage instead of temporary storage that gets lost when pods restart.

### Why It Matters
- **Data Retention:** Traces preserved across pod restarts
- **Debugging:** Access historical traces
- **Compliance:** Audit trail of requests
- **Performance:** Better query performance with persistent storage

### Current State
- ✅ Tempo is deployed
- ❌ Uses `emptyDir` (temporary storage)
- ❌ Traces lost on pod restart
- ❌ No long-term retention

### Action Items

#### 6.1 Option A: Persistent Volume (Recommended for Dev/Staging)

**File:** `monitoring/tracing/tempo-deployment.yaml`

Update the deployment:

```yaml
# Replace emptyDir with PersistentVolumeClaim
volumes:
- name: storage
  persistentVolumeClaim:
    claimName: tempo-storage
---
# Add PVC definition
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: tempo-storage
  namespace: tracing
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: standard  # Or your storage class
```

**Apply:**
```bash
kubectl apply -f monitoring/tracing/tempo-deployment.yaml
```

#### 6.2 Option B: Object Storage (Recommended for Production)

**File:** `monitoring/tracing/tempo-deployment.yaml`

Update Tempo config:

```yaml
storage:
  trace:
    backend: gcs  # or s3
    gcs:
      bucket_name: tempo-traces-${PROJECT_ID}
      # Service account with storage.objectAdmin role
    pool:
      max_workers: 100
      queue_depth: 10000
```

**Create GCS Bucket:**
```bash
# Create bucket
gsutil mb -p ${PROJECT_ID} -l europe-west10 gs://tempo-traces-${PROJECT_ID}

# Grant Tempo service account access
gsutil iam ch serviceAccount:tempo@${PROJECT_ID}.iam.gserviceaccount.com:objectAdmin \
  gs://tempo-traces-${PROJECT_ID}
```

#### 6.3 Verify Persistence (5 minutes)
```bash
# Check PVC is created
kubectl get pvc -n tracing

# Check Tempo pod is using PVC
kubectl describe pod -n tracing -l app=tempo | grep -A 5 "Mounts:"

# Generate some traces
# Restart Tempo pod
kubectl delete pod -n tracing -l app=tempo

# Wait for new pod
kubectl get pods -n tracing

# Verify traces still exist
kubectl port-forward -n tracing svc/tempo-query 16686:16686
# Open http://localhost:16686
# Traces should still be visible
```

### Time Required
- **Configuration:** 15 minutes
- **Application:** 5 minutes
- **Verification:** 10 minutes
- **Total:** ~30 minutes

### Cost Impact
- **Persistent Volume:** ~$0.17/GB/month (50GB = ~$8.50/month)
- **GCS Storage:** ~$0.020/GB/month (50GB = ~$1/month)
- **GCS Operations:** Minimal cost

### Recommendation
- **Dev/Staging:** Use PersistentVolume (simpler)
- **Production:** Use GCS (cheaper, scalable, better for HA)

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ **Review Analysis Report** - Understand current state
2. ✅ **Configure Alert Notifications** - Know when issues occur
3. ✅ **Fix Tempo Storage** - Preserve trace data

### Phase 2: Important (Week 2-3)
4. ✅ **Set Up Cloud Build (Disabled)** - Infrastructure ready
5. ✅ **Test Builds** - Validate configuration

### Phase 3: Enhancement (Week 4+)
6. ✅ **Integrate with GitHub Actions** - Hybrid approach
7. ✅ **Enable Cloud Build Triggers** - When ready

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Cloud Build
gcloud builds triggers list --region=europe-west10
gcloud builds triggers update TRIGGER_NAME --disabled
gcloud builds submit --config=cloudbuild-dev.yaml

# AlertManager
kubectl get secret alertmanager-prometheus-kube-prometheus-alertmanager -n monitoring
kubectl port-forward -n monitoring svc/alertmanager-prometheus-kube-prometheus-alertmanager 9093:9093

# Tempo
kubectl get pvc -n tracing
kubectl port-forward -n tracing svc/tempo-query 16686:16686

# Monitoring
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

---

## Support

- **Cloud Build Setup:** See `CLOUD_BUILD_SETUP.md`
- **Full Analysis:** See `CI_CD_MONITORING_INFRASTRUCTURE_ANALYSIS.md`
- **CI/CD Pipeline:** See `CI_CD_SETUP.md`
- **Monitoring:** See `MONITORING_SETUP.md`

---

**Last Updated:** December 2024

