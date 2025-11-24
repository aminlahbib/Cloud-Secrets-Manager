# Comprehensive CI/CD, Monitoring & Infrastructure Analysis Report

**Project:** Cloud Secrets Manager  
**Date:** December 2024  
**Author:** DevOps Engineering Analysis  
**Version:** 1.0

---

## Executive Summary

This report provides a comprehensive analysis of the Cloud Secrets Manager project's current CI/CD pipeline, monitoring infrastructure, and overall infrastructure setup. Additionally, it includes a detailed integration plan for Google Cloud Build to complement the existing GitHub Actions-based CI/CD pipeline.

### Key Findings

- ✅ **CI/CD Pipeline:** Well-structured GitHub Actions workflow with multi-environment support
- ✅ **Monitoring:** Comprehensive Prometheus/Grafana stack with SLO-based alerting
- ✅ **Infrastructure:** Terraform-managed GCP resources with best practices
- ⚠️ **Gaps:** Limited Cloud Build integration, manual deployment approvals could be enhanced
- 💡 **Opportunity:** Cloud Build integration for GCP-native builds and enhanced security

---

## Table of Contents

1. [Current CI/CD Pipeline Analysis](#1-current-cicd-pipeline-analysis)
2. [Monitoring Infrastructure Analysis](#2-monitoring-infrastructure-analysis)
3. [Infrastructure Analysis](#3-infrastructure-analysis)
4. [Gaps and Recommendations](#4-gaps-and-recommendations)
5. [Google Cloud Build Integration Plan](#5-google-cloud-build-integration-plan)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## 1. Current CI/CD Pipeline Analysis

### 1.1 Pipeline Architecture

**Location:** `.github/workflows/ci-cd.yml`

**Current Status:** ⚠️ **Manually Triggered Only** (workflow_dispatch)

The pipeline is currently disabled for automatic runs to prevent costs. It can only be triggered manually.

### 1.2 Pipeline Stages

#### Stage 1: Build and Test
- **Trigger:** All PRs and pushes (when enabled)
- **Runner:** `ubuntu-latest`
- **Actions:**
  - ✅ Checkout code
  - ✅ Set up JDK 21 (Temurin distribution)
  - ✅ Build Secret Service (Maven)
  - ✅ Build Audit Service (Maven)
  - ✅ Generate test reports (Surefire)
  - ✅ Generate coverage reports (JaCoCo)
  - ✅ Upload artifacts (test results, coverage)

**Strengths:**
- Comprehensive test coverage reporting
- Artifact retention (30 days)
- Coverage summary in GitHub Actions UI

**Weaknesses:**
- No parallel test execution optimization
- No test result aggregation across services
- Coverage thresholds not enforced

#### Stage 2: Security Scanning (Trivy)
- **Trigger:** After build-test (depends on)
- **Actions:**
  - ✅ Filesystem vulnerability scanning
  - ✅ CRITICAL/HIGH severity blocking
  - ✅ SARIF upload to GitHub Security tab

**Strengths:**
- Security-first approach
- Integration with GitHub Security features
- Fails pipeline on critical vulnerabilities

**Weaknesses:**
- Only scans filesystem, not dependencies in detail
- No dependency update suggestions
- No license compliance checking

#### Stage 3: Docker Build and Push
- **Trigger:** Push to `main` or `develop` branches only
- **Actions:**
  - ✅ GCP authentication
  - ✅ Docker Buildx setup with caching
  - ✅ Build both service images
  - ✅ Image vulnerability scanning (Trivy)
  - ✅ Push to Google Artifact Registry
  - ✅ Tag with git SHA and environment prefix

**Image Tagging Strategy:**
- From `main`: `<git-sha>`, `prod-latest`
- From `develop`: `<git-sha>`, `dev-latest`

**Strengths:**
- Multi-stage builds with caching
- Image scanning before push
- Proper tagging strategy
- Artifact Registry integration

**Weaknesses:**
- Build happens on GitHub runners (not GCP-native)
- No build artifact signing
- No multi-architecture builds (only linux/amd64)
- Build cache could be optimized

#### Stage 4: Deployment to Dev
- **Trigger:** Push to `develop` branch
- **Actions:**
  - ✅ GKE cluster authentication
  - ✅ Helm deployment
  - ✅ Image pull secret creation
  - ✅ Rollout verification
  - ✅ Smoke tests

**Strengths:**
- Automated deployment
- Health checks
- Smoke test validation

**Weaknesses:**
- No blue-green or canary deployments
- No deployment metrics collection
- Limited rollback automation

#### Stage 5: Deployment to Staging
- **Trigger:** Push to `main` branch
- **Actions:**
  - ✅ Manual approval required (1 reviewer)
  - ✅ Helm deployment with staging values
  - ✅ Smoke tests
  - ✅ Regression tests (placeholder)

**Strengths:**
- Manual approval gate
- Environment-specific configuration

**Weaknesses:**
- Regression tests not implemented
- No performance testing
- No database migration verification

#### Stage 6: Deployment to Production
- **Trigger:** After staging deployment
- **Actions:**
  - ✅ Manual approval required (2 reviewers)
  - ✅ 10-minute wait timer
  - ✅ Deployment backup
  - ✅ Helm deployment
  - ✅ Auto-rollback on failure

**Strengths:**
- Multiple approval gates
- Safety timer
- Automatic rollback
- Backup before deployment

**Weaknesses:**
- No canary deployments
- No gradual rollout
- Limited post-deployment validation

### 1.3 Environment Configuration

**Environments:**
- **Dev:** `cloud-secrets-cluster-dev` (europe-west10)
- **Staging:** `cloud-secrets-cluster-staging` (europe-west10)
- **Production:** `cloud-secrets-cluster-prod` (europe-west10)

**Registry:**
- **Artifact Registry:** `europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images`

### 1.4 Security Configuration

**Service Account:** `github-actions-ci@cloud-secrets-manager.iam.gserviceaccount.com`

**Required Roles:**
- `roles/artifactregistry.writer`
- `roles/container.developer`
- `roles/iam.serviceAccountUser`

**Secrets Management:**
- ✅ GCP service account key stored in GitHub Secrets
- ✅ Workload Identity not used (could be improved)

### 1.5 Pipeline Metrics

**Current Limitations:**
- ⚠️ Pipeline disabled for automatic runs
- ⚠️ No build time tracking
- ⚠️ No deployment frequency metrics
- ⚠️ No mean time to recovery (MTTR) tracking

---

## 2. Monitoring Infrastructure Analysis

### 2.1 Monitoring Stack Overview

**Components:**
- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Tempo** - Distributed tracing
- **AlertManager** - Alert routing and notifications
- **ServiceMonitors** - Prometheus scraping configuration

### 2.2 Prometheus Configuration

**Deployment Method:** Prometheus Operator (kube-prometheus-stack)

**Configuration:**
- Retention: 30 days
- Storage: 50Gi persistent volume
- Service discovery: Kubernetes-native via ServiceMonitors

**ServiceMonitors:**
1. **secret-service-monitor**
   - Scrapes: `/actuator/prometheus`
   - Interval: 30s
   - Timeout: 10s
   - Labels: pod, namespace, service, job

2. **audit-service-monitor**
   - Same configuration as secret-service

**Strengths:**
- Kubernetes-native service discovery
- Automatic target management
- Proper labeling for multi-tenancy

**Weaknesses:**
- No federation setup for multi-cluster
- No remote write configuration
- No long-term storage integration

### 2.3 Alerting Rules

**Location:** `monitoring/alerts/prometheus-rules.yaml`

**Alert Categories:**

#### 2.3.1 Service Availability
- **ServiceDown:** Service unavailable for >1 minute
- **HighPodRestartRate:** >0.1 restarts/sec for 5 minutes

#### 2.3.2 SLO-Based Alerts (Error Rate)
- **SLO:** 99% success rate (1% error budget)
- **HighErrorRate:** Error rate >1% for 5 minutes
- **ErrorBudgetBurn:** Error rate >0.5% over 1 hour

#### 2.3.3 SLO-Based Alerts (Latency)
- **SLO:** P95 <500ms, P99 <1s
- **HighLatencyP95:** P95 >500ms for 10 minutes
- **HighLatencyP99:** P99 >1s for 10 minutes

#### 2.3.4 Secret-Specific Alerts
- **SecretRotationFailed:** Rotation failures detected
- **SecretEncryptionFailure:** Encryption errors
- **HighSecretAccessRate:** >100 accesses/sec for 10 minutes

#### 2.3.5 Database Alerts
- **HighDatabaseConnectionUsage:** >80% pool usage
- **DatabaseConnectionPoolExhausted:** Pending connections >0
- **SlowDatabaseQueries:** P95 query time >1s

#### 2.3.6 Resource Utilization
- **HighMemoryUsage:** >85% for 10 minutes
- **HighCPUUsage:** >85% for 15 minutes
- **PodNearOOMKilled:** >95% memory usage

#### 2.3.7 Audit Service Alerts
- **AuditEventProcessingLag:** Queue size >1000
- **AuditStorageFailure:** Storage errors detected

#### 2.3.8 JVM Health
- **HighGCTime:** Average GC pause >0.1s
- **HighThreadCount:** >200 live threads

**Strengths:**
- Comprehensive alert coverage
- SLO-based alerting with error budgets
- Proper severity classification
- Runbook URLs included

**Weaknesses:**
- AlertManager notification channels not configured
- No alert routing based on severity
- No alert grouping/firing rules
- No on-call integration

### 2.4 Grafana Dashboards

**Dashboards:**
1. **Cloud Secrets Manager - Overview & SLOs**
   - Application metrics
   - SLO compliance
   - Error rates
   - Latency percentiles

2. **Cloud Secrets Manager - JVM & Database**
   - JVM metrics
   - Database connection pool
   - GC metrics
   - Thread metrics

**Strengths:**
- SLO-focused dashboards
- Business and technical metrics
- Proper visualization

**Weaknesses:**
- Dashboards not version-controlled in detail
- No automated dashboard provisioning
- No dashboard templating for multi-environment

### 2.5 Distributed Tracing (Tempo)

**Configuration:**
- **Storage:** Local (emptyDir) - 30-day retention
- **Protocols:** OTLP (HTTP/gRPC), Jaeger
- **Query UI:** Tempo Query (Jaeger-compatible)

**Strengths:**
- Multiple protocol support
- Jaeger UI compatibility
- Proper resource allocation

**Weaknesses:**
- No persistent storage (data lost on pod restart)
- No object storage backend (S3/GCS)
- Single replica (no HA)
- No sampling configuration

### 2.6 Application Instrumentation

**Spring Boot Actuator:**
- Prometheus metrics endpoint: `/actuator/prometheus`
- Health checks: `/actuator/health`
- Observability profile enabled

**Metrics Exposed:**
- HTTP request metrics
- JVM metrics
- Database connection pool metrics
- Custom business metrics (secret operations, audit events)

**Strengths:**
- Standard Spring Boot instrumentation
- Custom business metrics
- Proper labeling

**Weaknesses:**
- No OpenTelemetry SDK integration
- Limited distributed tracing instrumentation
- No custom metric aggregation

---

## 3. Infrastructure Analysis

### 3.1 Infrastructure as Code (Terraform)

**Structure:**
```
infrastructure/terraform/
├── modules/
│   ├── artifact-registry/
│   ├── gke-cluster/
│   ├── postgresql/
│   ├── iam/
│   └── billing-budget/
└── environments/
    └── dev/
```

**State Management:**
- Backend: GCS bucket (`cloud-secrets-manager-tfstate-dev`)
- Prefix: `terraform/state/dev`
- Versioning: Enabled (via GCS)

### 3.2 GKE Cluster Configuration

**Module:** `modules/gke-cluster`

**Features:**
- ✅ Workload Identity enabled
- ✅ Network Policy (Calico)
- ✅ Private cluster support
- ✅ Release channel (REGULAR/STABLE)
- ✅ Auto-repair and auto-upgrade
- ✅ Shielded GKE nodes
- ✅ Binary Authorization support

**Node Pool Configuration (Dev):**
- Machine type: `e2-medium`
- Node count: 1 (min: 1, max: 3)
- Disk size: 30GB
- Autoscaling: Enabled

**Strengths:**
- Security best practices
- Auto-scaling configured
- Proper node management
- Workload Identity for secure pod-to-GCP authentication

**Weaknesses:**
- No multi-zone configuration
- No node pool diversity
- Limited resource quotas
- No pod disruption budgets in Terraform

### 3.3 Database Infrastructure (Cloud SQL)

**Module:** `modules/postgresql`

**Configuration (Dev):**
- Instance: `secrets-manager-db-dev`
- Tier: `db-g1-small`
- Disk: 20GB (auto-resize to 50GB)
- HA: Disabled
- Backup: Enabled
- PITR: Disabled
- Databases: `secrets`, `audit`

**Strengths:**
- Managed database service
- Automated backups
- Proper database separation

**Weaknesses:**
- No read replicas
- No connection pooling (PgBouncer)
- No database migration automation
- Limited monitoring integration

### 3.4 IAM and Security

**Module:** `modules/iam`

**Service Accounts:**
1. **secret-service-dev**
   - Roles: Cloud SQL Client, Secret Manager Accessor, Artifact Registry Reader

2. **audit-service-dev**
   - Roles: Cloud SQL Client, Logging Writer, Artifact Registry Reader

3. **external-secrets-sa**
   - Roles: Secret Manager Accessor

**Workload Identity Bindings:**
- Kubernetes Service Accounts → GCP Service Accounts
- Proper namespace isolation

**Strengths:**
- Least privilege principle
- Workload Identity for secure authentication
- Proper role separation

**Weaknesses:**
- No IAM condition policies
- No time-bound access
- No audit logging configuration

### 3.5 Artifact Registry

**Module:** `modules/artifact-registry`

**Configuration:**
- Repository: `docker-images`
- Location: `europe-west10`
- Cleanup policy: Keep 5 latest images
- Format: Docker

**Strengths:**
- Automated cleanup
- Proper access control
- GCP-native registry

**Weaknesses:**
- No vulnerability scanning integration
- No image signing
- No retention policies for different tags

### 3.6 External Secrets Operator

**Deployment:** Helm chart via Terraform

**Configuration:**
- ClusterSecretStore: GCP Secret Manager
- Automatic secret synchronization
- Workload Identity integration

**Strengths:**
- GitOps-friendly secret management
- Automatic sync
- No secrets in Git

**Weaknesses:**
- No secret rotation automation
- No secret versioning strategy
- Limited audit logging

### 3.7 Helm Charts

**Location:** `infrastructure/helm/cloud-secrets-manager`

**Structure:**
- Base values: `values.yaml`
- Environment-specific: `values-staging.yaml`, `values-production.yaml`

**Features:**
- Multi-service deployment
- Cloud SQL Proxy sidecar
- Service accounts with Workload Identity
- Ingress configuration
- Resource limits and requests

**Strengths:**
- Environment-specific configurations
- Proper resource management
- Cloud SQL integration

**Weaknesses:**
- No Helm chart testing
- Limited value validation
- No chart versioning strategy

---

## 4. Gaps and Recommendations

### 4.1 CI/CD Pipeline Gaps

#### Critical
1. **Pipeline Disabled**
   - **Issue:** Automatic triggers disabled
   - **Impact:** No automated quality gates
   - **Recommendation:** Re-enable with cost controls

2. **No Multi-Architecture Builds**
   - **Issue:** Only linux/amd64 builds
   - **Impact:** Limited deployment flexibility
   - **Recommendation:** Add ARM64 builds for cost optimization

3. **No Build Artifact Signing**
   - **Issue:** Images not signed
   - **Impact:** Supply chain security risk
   - **Recommendation:** Implement cosign or GCP Binary Authorization

#### High Priority
4. **Limited Deployment Strategies**
   - **Issue:** Only rolling updates
   - **Impact:** Higher risk deployments
   - **Recommendation:** Implement canary/blue-green deployments

5. **No Performance Testing**
   - **Issue:** No load testing in pipeline
   - **Impact:** Performance regressions not caught
   - **Recommendation:** Add k6 or Artillery tests

6. **No Database Migration Verification**
   - **Issue:** Migrations not tested in pipeline
   - **Impact:** Deployment failures
   - **Recommendation:** Add Flyway/Liquibase validation

#### Medium Priority
7. **No Build Metrics**
   - **Issue:** No DORA metrics tracking
   - **Impact:** Limited visibility into delivery performance
   - **Recommendation:** Implement metrics collection

8. **Limited Caching Strategy**
   - **Issue:** Build cache could be optimized
   - **Impact:** Slower builds
   - **Recommendation:** Implement layer caching and build cache

### 4.2 Monitoring Gaps

#### Critical
1. **No Alert Notifications**
   - **Issue:** AlertManager not configured
   - **Impact:** Alerts not delivered
   - **Recommendation:** Configure Slack/Email/PagerDuty

2. **Tempo Storage Not Persistent**
   - **Issue:** Traces lost on pod restart
   - **Impact:** Limited debugging capability
   - **Recommendation:** Configure object storage backend

#### High Priority
3. **No Long-Term Metrics Storage**
   - **Issue:** 30-day retention only
   - **Impact:** Limited historical analysis
   - **Recommendation:** Configure remote write to BigQuery or Thanos

4. **No Multi-Cluster Federation**
   - **Issue:** Single cluster monitoring
   - **Impact:** Limited visibility across environments
   - **Recommendation:** Implement Prometheus federation

#### Medium Priority
5. **Limited Dashboard Automation**
   - **Issue:** Dashboards not fully automated
   - **Impact:** Manual dashboard management
   - **Recommendation:** Implement dashboard as code

6. **No Synthetic Monitoring**
   - **Issue:** No external health checks
   - **Impact:** Limited user experience visibility
   - **Recommendation:** Implement uptime checks

### 4.3 Infrastructure Gaps

#### Critical
1. **No Production Environment**
   - **Issue:** Only dev environment in Terraform
   - **Impact:** Manual production setup
   - **Recommendation:** Add staging/production environments

2. **No Disaster Recovery Plan**
   - **Issue:** No backup/restore procedures
   - **Impact:** Data loss risk
   - **Recommendation:** Implement DR strategy

#### High Priority
3. **Limited High Availability**
   - **Issue:** Single-zone deployments
   - **Impact:** Availability risk
   - **Recommendation:** Multi-zone GKE clusters

4. **No Infrastructure Testing**
   - **Issue:** No Terraform validation
   - **Impact:** Configuration errors
   - **Recommendation:** Add Terratest or Kitchen-Terraform

#### Medium Priority
5. **No Cost Optimization**
   - **Issue:** No resource right-sizing
   - **Impact:** Higher costs
   - **Recommendation:** Implement cost monitoring and optimization

6. **Limited Observability in Infrastructure**
   - **Issue:** No infrastructure metrics
   - **Impact:** Limited visibility
   - **Recommendation:** Add Cloud Monitoring integration

---

## 5. Google Cloud Build Integration Plan

### 5.1 Executive Summary

**Objective:** Integrate Google Cloud Build as a complementary CI/CD solution alongside GitHub Actions, leveraging GCP-native services for enhanced security, performance, and cost optimization.

**Strategy:** Hybrid approach - Use Cloud Build for GCP-native operations (builds, deployments) while maintaining GitHub Actions for code quality gates and PR workflows.

### 5.2 Why Cloud Build?

#### Benefits
1. **GCP-Native Integration**
   - Seamless authentication with Workload Identity
   - No service account key management
   - Native Artifact Registry integration
   - Built-in GKE deployment support

2. **Security**
   - No long-lived credentials
   - IAM-based access control
   - Binary Authorization integration
   - VPC-native builds (private pools)

3. **Performance**
   - Faster builds with GCP network
   - Better caching with Artifact Registry
   - Parallel builds
   - Custom machine types

4. **Cost Optimization**
   - Pay-per-use pricing
   - No runner maintenance
   - Efficient resource utilization
   - Free tier available

5. **Compliance**
   - Audit logging
   - Compliance certifications
   - Data residency control
   - Encryption at rest

### 5.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   PR/Merge   │────────▶│ GitHub Actions│                 │
│  │              │         │ (Code Quality)│                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                                   │ Webhook                  │
│                                   ▼                          │
│                          ┌─────────────────┐                │
│                          │  Cloud Build    │                │
│                          │  (Build & Deploy)│               │
│                          └────────┬────────┘                │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   Artifact   │  │  GKE Cluster │  │ Cloud SQL    │
        │   Registry   │  │   (Deploy)   │  │  (Migrate)   │
        └──────────────┘  └──────────────┘  └──────────────┘
```

### 5.4 Integration Strategy

#### Phase 1: Hybrid Approach (Recommended)
- **GitHub Actions:** Code quality, testing, security scanning
- **Cloud Build:** Docker builds, image scanning, deployments

#### Phase 2: Full Migration (Optional)
- **Cloud Build:** Complete CI/CD pipeline
- **GitHub Actions:** PR checks only

### 5.5 Cloud Build Triggers

#### 5.5.1 Push to Main/Develop
```yaml
Trigger: Push to branch (main, develop)
Build: Docker images
Actions:
  - Build Secret Service image
  - Build Audit Service image
  - Scan images (Container Analysis API)
  - Push to Artifact Registry
  - Trigger deployment (optional)
```

#### 5.5.2 Tag Creation
```yaml
Trigger: Tag creation (v*)
Build: Release build
Actions:
  - Build production images
  - Sign images (cosign)
  - Push to Artifact Registry
  - Create release artifacts
  - Deploy to production (with approval)
```

#### 5.5.3 Pull Request (Optional)
```yaml
Trigger: PR opened/updated
Build: Validation build
Actions:
  - Build images (no push)
  - Run security scans
  - Validate Dockerfiles
  - Comment results on PR
```

### 5.6 Cloud Build Configuration

#### 5.6.1 cloudbuild.yaml Structure

**Location:** `cloudbuild.yaml` (root)

```yaml
steps:
  # Step 1: Build Secret Service
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-secret-service'
    args:
      - 'build'
      - '-t'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${SHORT_SHA}'
      - '-t'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${_ENV}-latest'
      - '--cache-from'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${_ENV}-latest'
      - './apps/backend/secret-service'
    waitFor: ['-']

  # Step 2: Build Audit Service
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-audit-service'
    args:
      - 'build'
      - '-t'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service:${SHORT_SHA}'
      - '-t'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service:${_ENV}-latest'
      - '--cache-from'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service:${_ENV}-latest'
      - './apps/backend/audit-service'
    waitFor: ['-']

  # Step 3: Scan Secret Service Image
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'scan-secret-service'
    args:
      - 'container'
      - 'images'
      - 'scan'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${SHORT_SHA}'
      - '--format=json'
    waitFor: ['build-secret-service']

  # Step 4: Scan Audit Service Image
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'scan-audit-service'
    args:
      - 'container'
      - 'images'
      - 'scan'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service:${SHORT_SHA}'
      - '--format=json'
    waitFor: ['build-audit-service']

  # Step 5: Push Secret Service
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-secret-service'
    args:
      - 'push'
      - '--all-tags'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service'
    waitFor: ['scan-secret-service']

  # Step 6: Push Audit Service
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-audit-service'
    args:
      - 'push'
      - '--all-tags'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service'
    waitFor: ['scan-audit-service']

  # Step 7: Deploy to GKE (conditional)
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'deploy-to-gke'
    args:
      - 'run'
      - '--filename=infrastructure/helm/cloud-secrets-manager'
      - '--location=${_GKE_REGION}'
      - '--cluster=${_GKE_CLUSTER}'
      - '--namespace=${_GKE_NAMESPACE}'
      - '--image=${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${SHORT_SHA}'
    waitFor: ['push-secret-service', 'push-audit-service']
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud container clusters get-credentials ${_GKE_CLUSTER} \
          --region ${_GKE_REGION} \
          --project ${PROJECT_ID}
        helm upgrade --install cloud-secrets-manager \
          ./infrastructure/helm/cloud-secrets-manager \
          --namespace ${_GKE_NAMESPACE} \
          --create-namespace \
          --set image.tag=${SHORT_SHA} \
          --set image.repositorySecretService=${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service \
          --set image.repositoryAuditService=${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service

substitutions:
  _ARTIFACT_REGISTRY: 'europe-west10-docker.pkg.dev'
  _GKE_REGION: 'europe-west10'
  _GKE_NAMESPACE: 'cloud-secrets-manager'
  _ENV: 'dev'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
  substitution_option: 'ALLOW_LOOSE'

timeout: '1800s'

images:
  - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${SHORT_SHA}'
  - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${_ENV}-latest'
  - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service:${SHORT_SHA}'
  - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/audit-service:${_ENV}-latest'
```

#### 5.6.2 Environment-Specific Configurations

**cloudbuild-dev.yaml:**
```yaml
substitutions:
  _ENV: 'dev'
  _GKE_CLUSTER: 'cloud-secrets-cluster-dev'
```

**cloudbuild-staging.yaml:**
```yaml
substitutions:
  _ENV: 'staging'
  _GKE_CLUSTER: 'cloud-secrets-cluster-staging'
```

**cloudbuild-production.yaml:**
```yaml
substitutions:
  _ENV: 'production'
  _GKE_CLUSTER: 'cloud-secrets-cluster-prod'
```

### 5.7 IAM and Security Setup

#### 5.7.1 Cloud Build Service Account

**Service Account:** `cloud-build@${PROJECT_ID}.iam.gserviceaccount.com`

**Required Roles:**
```bash
# Artifact Registry
roles/artifactregistry.writer

# GKE Deployment
roles/container.developer

# Service Account Impersonation
roles/iam.serviceAccountUser

# Secret Manager (for deployment secrets)
roles/secretmanager.secretAccessor

# Cloud SQL (for migrations)
roles/cloudsql.client
```

#### 5.7.2 Workload Identity Federation (Recommended)

**Setup:**
```bash
# Enable Workload Identity
gcloud services enable iamcredentials.googleapis.com

# Create Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --project=${PROJECT_ID} \
  --location=global

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=${PROJECT_ID} \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"

# Grant Cloud Build access
gcloud iam service-accounts add-iam-policy-binding \
  cloud-build@${PROJECT_ID}.iam.gserviceaccount.com \
  --project=${PROJECT_ID} \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_REPO}"
```

### 5.8 Cloud Build Triggers Setup

#### 5.8.1 GitHub App Integration

**Setup:**
```bash
# Create GitHub App connection
gcloud builds connections create github \
  --region=europe-west10 \
  --project=${PROJECT_ID}

# Install GitHub App in repository
# Follow prompts to authorize

# Create trigger for main branch
gcloud builds triggers create github \
  --name="build-and-deploy-main" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-production.yaml" \
  --substitutions="_ENV=production,_GKE_CLUSTER=cloud-secrets-cluster-prod" \
  --require-approval

# Create trigger for develop branch
gcloud builds triggers create github \
  --name="build-and-deploy-develop" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^develop$" \
  --build-config="cloudbuild-dev.yaml" \
  --substitutions="_ENV=dev,_GKE_CLUSTER=cloud-secrets-cluster-dev"
```

#### 5.8.2 Manual Approval for Production

**Setup:**
```bash
# Create approval trigger
gcloud builds triggers create github \
  --name="deploy-production-approval" \
  --region=europe-west10 \
  --repo-name="CSM-Project" \
  --repo-owner="${GITHUB_ORG}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-production.yaml" \
  --require-approval \
  --approval-config="count=2,approver-identities=${APPROVER_EMAILS}"
```

### 5.9 Advanced Features

#### 5.9.1 Private Pools (VPC-Native Builds)

**Benefits:**
- Builds run in your VPC
- Access to private resources
- Enhanced security

**Setup:**
```bash
# Create private pool
gcloud builds worker-pools create private-pool \
  --region=europe-west10 \
  --peered-network=projects/${PROJECT_ID}/global/networks/${VPC_NAME} \
  --worker-machine-type=e2-highcpu-8

# Use in cloudbuild.yaml
options:
  pool:
    name: 'projects/${PROJECT_ID}/locations/europe-west10/workerPools/private-pool'
```

#### 5.9.2 Build Caching

**Artifact Registry Caching:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--cache-from'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:latest'
      - '-t'
      - '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${SHORT_SHA}'
      - './apps/backend/secret-service'
```

#### 5.9.3 Build Notifications

**Pub/Sub Integration:**
```bash
# Create Pub/Sub topic
gcloud pubsub topics create cloud-builds

# Create subscription
gcloud pubsub subscriptions create cloud-builds-sub \
  --topic=cloud-builds

# Configure notification
gcloud builds triggers update build-and-deploy-main \
  --pubsub-config=topic=projects/${PROJECT_ID}/topics/cloud-builds
```

### 5.10 Integration with GitHub Actions

#### 5.10.1 Hybrid Workflow

**GitHub Actions (ci-cd.yml):**
```yaml
jobs:
  build-test:
    # ... existing build and test steps ...
  
  trigger-cloud-build:
    needs: build-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    steps:
      - name: Trigger Cloud Build
        uses: google-github-actions/cloud-build-action@v2
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}
          region: ${{ env.GCP_REGION }}
          trigger_id: build-and-deploy-${{ github.ref_name == 'main' && 'production' || 'dev' }}
          substitutions: |
            _ENV=${{ github.ref_name == 'main' && 'production' || 'dev' }}
            _GKE_CLUSTER=${{ github.ref_name == 'main' && env.GKE_CLUSTER_PROD || env.GKE_CLUSTER_DEV }}
```

#### 5.10.2 Status Reporting

**Cloud Build → GitHub:**
```yaml
# In cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'report-status'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud builds submit --config=cloudbuild-status.yaml \
          --substitutions=_GITHUB_TOKEN=$$GITHUB_TOKEN,_GITHUB_REPO=$$GITHUB_REPO,_BUILD_STATUS=$$BUILD_STATUS
```

### 5.11 Cost Optimization

#### 5.11.1 Machine Type Selection

**Recommendations:**
- **Small builds:** `E2_HIGHCPU_4` (4 vCPU, 4GB RAM)
- **Medium builds:** `E2_HIGHCPU_8` (8 vCPU, 8GB RAM)
- **Large builds:** `E2_HIGHCPU_32` (32 vCPU, 32GB RAM)

**Cost per build (approximate):**
- E2_HIGHCPU_4: $0.003/minute
- E2_HIGHCPU_8: $0.006/minute
- E2_HIGHCPU_32: $0.024/minute

#### 5.11.2 Build Time Optimization

**Strategies:**
1. **Layer Caching:** Use `--cache-from` for Docker builds
2. **Parallel Builds:** Build multiple images simultaneously
3. **Build Cache:** Use Artifact Registry for build cache
4. **Selective Building:** Only build changed services

### 5.12 Monitoring and Observability

#### 5.12.1 Build Metrics

**Cloud Monitoring:**
- Build duration
- Build success rate
- Build frequency
- Resource utilization

**Dashboards:**
- Build performance dashboard
- Build cost dashboard
- Build failure analysis

#### 5.12.2 Logging

**Cloud Logging:**
- Build logs automatically stored
- 30-day retention (default)
- Export to BigQuery for analysis

**Query Examples:**
```sql
-- Build success rate
SELECT
  COUNTIF(status = "SUCCESS") / COUNT(*) as success_rate
FROM
  `cloud-build-logs.builds`
WHERE
  timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)

-- Average build duration
SELECT
  AVG(duration) as avg_duration
FROM
  `cloud-build-logs.builds`
WHERE
  timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
```

### 5.13 Security Best Practices

#### 5.13.1 Binary Authorization

**Setup:**
```bash
# Enable Binary Authorization
gcloud services enable binaryauthorization.googleapis.com

# Create policy
gcloud container binauthz policy import policy.yaml

# Policy example (policy.yaml):
admissionWhitelistPatterns:
  - namePattern: gcr.io/google_containers/*
  - namePattern: gcr.io/cloud-builders/*
defaultAdmissionRule:
  evaluationMode: REQUIRE_ATTESTATION
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  requireAttestationsBy:
    - projects/${PROJECT_ID}/attestors/build-attestor
```

#### 5.13.2 Image Signing

**Using cosign:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-image'
    # ... build steps ...

  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'sign-image'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        cosign sign --key gcpkms://projects/${PROJECT_ID}/locations/${LOCATION}/keyRings/${KEY_RING}/cryptoKeys/${KEY_NAME} \
          ${_ARTIFACT_REGISTRY}/${PROJECT_ID}/docker-images/secret-service:${SHORT_SHA}
    waitFor: ['build-image']
```

### 5.14 Migration Plan

#### Phase 1: Setup and Testing (Week 1-2)
1. ✅ Enable Cloud Build API
2. ✅ Create service accounts and IAM roles
3. ✅ Create cloudbuild.yaml files
4. ✅ Set up GitHub App connection
5. ✅ Create test triggers
6. ✅ Test builds in dev environment

#### Phase 2: Integration (Week 3-4)
1. ✅ Integrate with GitHub Actions
2. ✅ Set up approval workflows
3. ✅ Configure notifications
4. ✅ Test end-to-end pipeline
5. ✅ Document procedures

#### Phase 3: Production Rollout (Week 5-6)
1. ✅ Enable production triggers
2. ✅ Monitor build performance
3. ✅ Optimize build times
4. ✅ Train team on new workflow
5. ✅ Decommission old build steps (optional)

#### Phase 4: Optimization (Ongoing)
1. ✅ Implement advanced features
2. ✅ Optimize costs
3. ✅ Enhance security
4. ✅ Improve monitoring

---

## 6. Implementation Roadmap

### 6.1 Immediate Actions (Week 1)

1. **Re-enable CI/CD Pipeline**
   - Uncomment automatic triggers
   - Add cost controls
   - Monitor initial runs

2. **Configure AlertManager**
   - Set up Slack/Email notifications
   - Configure alert routing
   - Test alert delivery

3. **Fix Tempo Storage**
   - Configure object storage backend
   - Enable persistent volumes
   - Test trace retention

### 6.2 Short-Term (Month 1)

1. **Cloud Build Integration**
   - Complete Phase 1 setup
   - Test builds
   - Integrate with GitHub Actions

2. **Monitoring Enhancements**
   - Configure long-term storage
   - Set up synthetic monitoring
   - Create additional dashboards

3. **Infrastructure Improvements**
   - Add staging/production Terraform
   - Implement HA configurations
   - Add infrastructure testing

### 6.3 Medium-Term (Months 2-3)

1. **Advanced CI/CD Features**
   - Implement canary deployments
   - Add performance testing
   - Database migration automation

2. **Security Enhancements**
   - Image signing
   - Binary Authorization
   - Enhanced IAM policies

3. **Cost Optimization**
   - Right-size resources
   - Implement cost monitoring
   - Optimize build times

### 6.4 Long-Term (Months 4-6)

1. **Multi-Cluster Support**
   - Prometheus federation
   - Cross-cluster monitoring
   - Global load balancing

2. **Disaster Recovery**
   - Backup automation
   - DR procedures
   - Regular DR drills

3. **Advanced Observability**
   - OpenTelemetry integration
   - Enhanced tracing
   - AI-powered anomaly detection

---

## 7. Conclusion

The Cloud Secrets Manager project has a solid foundation with:
- ✅ Well-structured CI/CD pipeline
- ✅ Comprehensive monitoring stack
- ✅ Infrastructure as Code with Terraform
- ✅ Security best practices

**Key Recommendations:**
1. **Immediate:** Re-enable pipeline, configure alerts, fix Tempo storage
2. **Short-term:** Integrate Cloud Build, enhance monitoring, complete infrastructure
3. **Medium-term:** Advanced deployment strategies, security enhancements
4. **Long-term:** Multi-cluster support, DR, advanced observability

**Cloud Build Integration Benefits:**
- Enhanced security with Workload Identity
- Better performance with GCP-native builds
- Cost optimization with pay-per-use
- Improved compliance and auditability

The hybrid approach (GitHub Actions + Cloud Build) provides the best of both worlds:
- GitHub Actions for code quality and PR workflows
- Cloud Build for GCP-native operations and deployments

---

## Appendix A: Cloud Build Configuration Files

### A.1 cloudbuild.yaml (Base)

See section 5.6.1 for complete configuration.

### A.2 cloudbuild-dev.yaml

```yaml
include:
  - cloudbuild.yaml

substitutions:
  _ENV: 'dev'
  _GKE_CLUSTER: 'cloud-secrets-cluster-dev'
```

### A.3 cloudbuild-staging.yaml

```yaml
include:
  - cloudbuild.yaml

substitutions:
  _ENV: 'staging'
  _GKE_CLUSTER: 'cloud-secrets-cluster-staging'
```

### A.4 cloudbuild-production.yaml

```yaml
include:
  - cloudbuild.yaml

substitutions:
  _ENV: 'production'
  _GKE_CLUSTER: 'cloud-secrets-cluster-prod'

options:
  # Require approval for production
  # Configured via trigger settings
```

---

## Appendix B: IAM Roles and Permissions

### B.1 Cloud Build Service Account Roles

```yaml
Service Account: cloud-build@${PROJECT_ID}.iam.gserviceaccount.com

Roles:
  - roles/artifactregistry.writer
  - roles/container.developer
  - roles/iam.serviceAccountUser
  - roles/secretmanager.secretAccessor
  - roles/cloudsql.client
  - roles/logging.logWriter
  - roles/monitoring.metricWriter
```

### B.2 GitHub Actions Service Account (Updated)

```yaml
Service Account: github-actions-ci@${PROJECT_ID}.iam.gserviceaccount.com

Roles:
  - roles/artifactregistry.reader
  - roles/cloudbuild.builds.editor
  - roles/iam.serviceAccountTokenCreator
```

---

## Appendix C: Cost Estimates

### C.1 Cloud Build Costs

**Assumptions:**
- 20 builds/day
- Average build time: 10 minutes
- Machine type: E2_HIGHCPU_8

**Monthly Cost:**
- Build time: 20 builds × 10 min × 30 days = 6,000 minutes
- Cost: 6,000 min × $0.006/min = **$36/month**

### C.2 Storage Costs

**Artifact Registry:**
- Image storage: ~50GB
- Cost: 50GB × $0.10/GB = **$5/month**

**Total Estimated Cost: ~$41/month**

---

## Appendix D: References

### D.1 Documentation
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

### D.2 Best Practices
- [Google Cloud Build Best Practices](https://cloud.google.com/build/docs/best-practices)
- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy)
- [SRE Book - SLIs, SLOs, SLAs](https://sre.google/workbook/slo-document/)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** March 2025

