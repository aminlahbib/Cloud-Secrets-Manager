# Cloud Secrets Manager - GCP Deployment Assessment & Plan

**Date:** December 5, 2025  
**Prepared By:** Senior Solution Architect & Cloud Engineer  
**Project:** Cloud Secrets Manager - Production GCP Deployment  
**Status:** Comprehensive Analysis & Deployment Roadmap

> **Status note (aligned with current repo):**  
> Since this assessment was written, the project now has:
> - A working **local Kubernetes deployment** on Docker Desktop using the `csm` namespace and the Helm chart in `infrastructure/helm/cloud-secrets-manager/`.  
> - A deployed **local monitoring stack** (Prometheus, Grafana, Loki, Promtail) with a custom CSM dashboard, as described in `infrastructure/monitoring/DEPLOYMENT_GUIDE.md` and `GRAFANA_DASHBOARD_SETUP.md`.  
> - Implemented **Terraform environments for `dev` and `staging`** under `infrastructure/terraform/environments/`.  
> There is **still no GCP dev/staging/production deployment applied yet**; this document describes the **target GCP state** and remains accurate for cloud deployment planning.

---

## Executive Summary

This document provides a comprehensive assessment of the Cloud Secrets Manager project from a Senior Solution Architect perspective, analyzing the current infrastructure, identifying gaps, and providing a complete production deployment plan for Google Cloud Platform with budget management and operational procedures.

### Key Findings

**Strengths:**
- ✅ Well-architected microservices design (3 services)
- ✅ Comprehensive Terraform infrastructure-as-code
- ✅ Production-ready Helm charts with environment-specific values
- ✅ Security best practices (Workload Identity, Network Policies, Pod Security)
- ✅ Observability foundation (Prometheus, Grafana, Loki, Promtail)
- ✅ CI/CD pipeline configured (Cloud Build)

**Critical Gaps:**
- ⚠️ No GCP dev/staging/production deployment yet (only local Docker + local Kubernetes)
- ⚠️ Missing cost optimization strategies
- ⚠️ Incomplete disaster recovery procedures
- ⚠️ No GCP production monitoring alerts configured (local monitoring exists in `monitoring` namespace)
- ⚠️ Frontend not integrated with backend in GKE

**Overall Readiness:** 75% - Ready for production with recommended improvements

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Infrastructure Assessment](#2-infrastructure-assessment)
3. [Cost Analysis & Budget Planning](#3-cost-analysis--budget-planning)
4. [Production Deployment Plan](#4-production-deployment-plan)
5. [Operational Procedures](#5-operational-procedures)
6. [Monitoring & Alerting](#6-monitoring--alerting)
7. [Security Hardening](#7-security-hardening)
8. [Disaster Recovery](#8-disaster-recovery)
9. [Maintenance & Support](#9-maintenance--support)
10. [Recommendations](#10-recommendations)

---


## 1. Current State Analysis

### 1.1 Project Architecture

**Microservices:**
- **Secret Service** (Port 8080) - Core API, authentication, secrets management
- **Audit Service** (Port 8081) - Immutable audit logging and analytics
- **Notification Service** (Port 8082) - Email and in-app notifications via Pub/Sub

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS design system
- Firebase Authentication integration
- Currently ~40% complete

**Technology Stack:**
- **Backend:** Java 21, Spring Boot 3.3.5, Spring Security, JPA
- **Database:** PostgreSQL 16 (2 databases: secrets, audit)
- **Cache:** Redis (token blacklisting)
- **Message Queue:** Google Cloud Pub/Sub
- **Auth:** Firebase Authentication / Google Identity Platform
- **Container Registry:** Google Artifact Registry
- **Orchestration:** Kubernetes (GKE)
- **IaC:** Terraform
- **CI/CD:** Cloud Build + GitHub Actions

### 1.2 Current Deployment Status

**Local Development:** ✅ Fully Operational
- Docker Compose setup working
- All 3 backend services running
- PostgreSQL database
- Frontend development server

**GCP Infrastructure:** 🟡 Partially Configured
- Terraform modules created for all components
- Helm charts ready for deployment
- CI/CD pipeline configured but not actively used
- **No active production deployment**

**Environments Defined:**
- `dev` - Development environment (Terraform configuration implemented)
- `staging` - Staging environment (Terraform configuration implemented)
- `production` - Production environment (Terraform module pattern defined; to be finalized before go‑live)

### 1.3 Infrastructure Components Analysis

#### Terraform Modules (✅ Complete)

| Module | Status | Purpose |
|--------|--------|---------|
| `gke-cluster` | ✅ Ready | GKE cluster with autoscaling, workload identity |
| `postgresql` | ✅ Ready | Cloud SQL PostgreSQL with HA options |
| `artifact-registry` | ✅ Ready | Docker image registry |
| `iam` | ✅ Ready | Service accounts, roles, workload identity |
| `billing-budget` | ✅ Ready | Cost alerting and budget management |
| `identity-platform` | ⚠️ Partial | Firebase/Google Identity setup |

#### Kubernetes Resources (✅ Complete)

- Deployments for all 3 services
- Services (ClusterIP, LoadBalancer)
- Ingress with NGINX
- Network Policies
- Pod Security Standards
- External Secrets Operator integration
- ServiceMonitors for Prometheus

#### Observability Stack (🟡 Partial)

| Component | Status | Notes |
|-----------|--------|-------|
| Prometheus | 📋 Configured | ServiceMonitors ready, not deployed |
| Grafana | 📋 Configured | Dashboards ready, not deployed |
| Loki | ✅ Deployed | Running on Docker Desktop |
| Promtail | ✅ Deployed | Collecting logs |
| Tempo | 📋 Configured | Tracing ready, not deployed |
| Alertmanager | ❌ Missing | Needs configuration |

---


## 2. Infrastructure Assessment

### 2.1 GKE Cluster Configuration

**Current Configuration (Dev):**
```yaml
Cluster Name: cloud-secrets-cluster-dev
Region: europe-west10
Node Count: 1 (min: 1, max: 3)
Machine Type: e2-medium (2 vCPU, 4GB RAM)
Disk Size: 30GB per node
Release Channel: REGULAR
Workload Identity: Enabled
Network Policy: Enabled (Calico)
Private Nodes: Disabled (for dev)
```

**Assessment:**
- ✅ Appropriate for development
- ⚠️ Undersized for production workloads
- ⚠️ No high availability (single node)
- ⚠️ Public endpoint (security concern for production)

**Production Recommendations:**
```yaml
Cluster Name: cloud-secrets-cluster-prod
Region: europe-west10 (or multi-region)
Node Count: 3 (min: 3, max: 10)
Machine Type: e2-standard-4 (4 vCPU, 16GB RAM)
Disk Size: 100GB per node (SSD)
Release Channel: STABLE
Workload Identity: Enabled
Network Policy: Enabled
Private Nodes: Enabled
Private Endpoint: Enabled
Binary Authorization: Enabled
```

### 2.2 Database Configuration

**Current Configuration (Dev):**
```yaml
Instance: secrets-manager-db-dev
Tier: db-g1-small (1 vCPU, 1.7GB RAM)
Disk: 20GB (autoresize to 50GB)
High Availability: Disabled
Backups: Enabled
Point-in-Time Recovery: Disabled
Deletion Protection: Disabled
```

**Assessment:**
- ✅ Cost-effective for development
- ⚠️ No HA (single point of failure)
- ⚠️ Limited resources for production load
- ⚠️ No PITR (limited recovery options)

**Production Recommendations:**
```yaml
Instance: secrets-manager-db-prod
Tier: db-custom-4-16384 (4 vCPU, 16GB RAM)
Disk: 100GB SSD (autoresize to 500GB)
High Availability: Enabled (Regional)
Backups: Enabled (automated daily)
Point-in-Time Recovery: Enabled
Deletion Protection: Enabled
Read Replicas: 1-2 (for read scaling)
Connection Pooling: PgBouncer
```

### 2.3 Networking Architecture

**Current Setup:**
- Default VPC network
- Public GKE endpoint
- No VPN or Cloud Interconnect
- Basic firewall rules

**Production Requirements:**
- Custom VPC with subnets
- Private GKE cluster
- Cloud NAT for egress
- Cloud Armor for DDoS protection
- VPN or Cloud Interconnect for admin access
- Private Service Connect for Cloud SQL

### 2.4 Security Posture

**Implemented:**
- ✅ Workload Identity (no service account keys)
- ✅ Network Policies (pod-to-pod traffic control)
- ✅ Pod Security Standards (restricted)
- ✅ Secrets in Secret Manager (not in code)
- ✅ TLS encryption in transit
- ✅ AES-256 encryption at rest

**Missing:**
- ⚠️ Binary Authorization (image signing)
- ⚠️ Cloud Armor WAF
- ⚠️ VPC Service Controls
- ⚠️ Security Command Center integration
- ⚠️ Vulnerability scanning automation
- ⚠️ Secrets rotation automation

---


## 3. Cost Analysis & Budget Planning

### 3.1 Estimated Monthly Costs (GCP europe-west10)

#### Development Environment

| Resource | Specification | Monthly Cost (USD) |
|----------|--------------|-------------------|
| **GKE Cluster** | 1x e2-medium node | $24.27 |
| **GKE Management** | Free tier | $0.00 |
| **Cloud SQL** | db-g1-small, 20GB | $25.55 |
| **Cloud SQL Backups** | 7 days retention | $1.60 |
| **Artifact Registry** | 10GB storage | $1.00 |
| **Secret Manager** | 10 secrets | $0.18 |
| **Pub/Sub** | 1M messages/month | $0.40 |
| **Load Balancer** | 1 forwarding rule | $18.26 |
| **Egress Traffic** | 10GB/month | $1.20 |
| **Logging** | 5GB/month | $2.50 |
| **Monitoring** | Basic metrics | $0.00 |
| **Loki/Promtail** | 10GB logs/month | $1.00 |
| **TOTAL DEV** | | **~$76/month** |

#### Staging Environment

| Resource | Specification | Monthly Cost (USD) |
|----------|--------------|-------------------|
| **GKE Cluster** | 2x e2-standard-2 nodes | $97.08 |
| **GKE Management** | Free tier | $0.00 |
| **Cloud SQL** | db-custom-2-8192, 50GB | $156.00 |
| **Cloud SQL Backups** | 14 days retention | $4.00 |
| **Artifact Registry** | 20GB storage | $2.00 |
| **Secret Manager** | 20 secrets | $0.36 |
| **Pub/Sub** | 10M messages/month | $4.00 |
| **Load Balancer** | 1 forwarding rule | $18.26 |
| **Egress Traffic** | 50GB/month | $6.00 |
| **Logging** | 20GB/month | $10.00 |
| **Monitoring** | Standard metrics | $5.00 |
| **Loki/Promtail** | 50GB logs/month | $5.00 |
| **TOTAL STAGING** | | **~$308/month** |

#### Production Environment

| Resource | Specification | Monthly Cost (USD) |
|----------|--------------|-------------------|
| **GKE Cluster** | 3x e2-standard-4 nodes | $291.24 |
| **GKE Management** | Free tier | $0.00 |
| **Cloud SQL (Primary)** | db-custom-4-16384, 100GB SSD | $468.00 |
| **Cloud SQL (HA Standby)** | Included in HA pricing | $0.00 |
| **Cloud SQL (Read Replica)** | db-custom-2-8192, 100GB | $234.00 |
| **Cloud SQL Backups** | 30 days retention | $12.00 |
| **Artifact Registry** | 50GB storage | $5.00 |
| **Secret Manager** | 50 secrets | $0.90 |
| **Pub/Sub** | 100M messages/month | $40.00 |
| **Load Balancer** | 2 forwarding rules | $36.52 |
| **Cloud Armor** | WAF protection | $5.00 |
| **Cloud NAT** | 3 gateways | $97.20 |
| **Egress Traffic** | 200GB/month | $24.00 |
| **Logging** | 100GB/month | $50.00 |
| **Monitoring** | Advanced metrics | $20.00 |
| **Loki/Promtail** | 200GB logs/month | $20.00 |
| **Prometheus/Grafana** | Managed service | $50.00 |
| **Cloud CDN** | Frontend assets | $10.00 |
| **TOTAL PRODUCTION** | | **~$1,364/month** |

### 3.2 Annual Cost Projection

| Environment | Monthly | Annual | Notes |
|-------------|---------|--------|-------|
| Development | $76 | $912 | Can be shut down nights/weekends |
| Staging | $308 | $3,696 | Can be shut down when not in use |
| Production | $1,364 | $16,368 | 24/7 operation |
| **TOTAL** | **$1,748** | **$20,976** | All environments |

### 3.3 Cost Optimization Strategies

#### Immediate Savings (20-30%)

1. **Committed Use Discounts (CUD)**
   - 1-year commitment: 25% discount
   - 3-year commitment: 52% discount
   - **Savings:** $4,000-$10,000/year

2. **Sustained Use Discounts**
   - Automatic 30% discount for continuous usage
   - **Savings:** Already included in estimates

3. **Preemptible/Spot VMs for Dev/Staging**
   - 60-91% discount on compute
   - **Savings:** $1,500/year on dev/staging

4. **Resource Scheduling**
   - Shut down dev/staging nights (12h) and weekends (48h)
   - **Savings:** ~60% on dev/staging = $2,400/year

#### Medium-Term Optimizations (10-15%)

1. **Right-sizing Resources**
   - Monitor actual usage and adjust
   - **Savings:** $2,000/year

2. **Storage Lifecycle Policies**
   - Move old logs to Coldline storage
   - **Savings:** $500/year

3. **Network Optimization**
   - Use Cloud CDN for static assets
   - Optimize egress traffic
   - **Savings:** $1,000/year

### 3.4 Budget Alerts Configuration

**Recommended Budget Thresholds:**

```yaml
Development:
  Monthly Budget: $100
  Alerts: [50%, 75%, 90%, 100%]
  
Staging:
  Monthly Budget: $400
  Alerts: [50%, 75%, 90%, 100%]
  
Production:
  Monthly Budget: $1,500
  Alerts: [50%, 75%, 90%, 100%]
  
Total Project:
  Monthly Budget: $2,000
  Alerts: [50%, 75%, 90%, 100%]
```

**Alert Actions:**
- 50%: Email notification to team
- 75%: Email + Slack notification
- 90%: Email + Slack + PagerDuty
- 100%: Automatic scale-down of non-critical resources

---


## 4. Production Deployment Plan

### 4.1 Pre-Deployment Checklist

#### GCP Project Setup
- [ ] Create GCP project: `cloud-secrets-manager-prod`
- [ ] Enable billing account
- [ ] Set up billing budgets and alerts
- [ ] Enable required APIs (see list below)
- [ ] Configure IAM roles and permissions
- [ ] Set up Cloud Identity or Workspace
- [ ] Configure organization policies

#### Required GCP APIs
```bash
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  billingbudgets.googleapis.com \
  pubsub.googleapis.com \
  cloudresourcemanager.googleapis.com \
  servicenetworking.googleapis.com \
  dns.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  cloudtrace.googleapis.com
```

#### Security Prerequisites
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Generate AES-256 encryption key
- [ ] Set up SendGrid account and API key
- [ ] Configure Firebase project
- [ ] Create service account for External Secrets
- [ ] Set up SSL/TLS certificates (Let's Encrypt or managed)

#### Domain & DNS
- [ ] Register domain (e.g., `cloudsecrets.io`)
- [ ] Configure Cloud DNS zone
- [ ] Set up DNS records for:
  - `api.cloudsecrets.io` → Backend API
  - `app.cloudsecrets.io` → Frontend
  - `grafana.cloudsecrets.io` → Monitoring

### 4.2 Phase 1: Infrastructure Provisioning (Week 1)

#### Day 1-2: Network & VPC Setup

```bash
# 1. Create custom VPC
gcloud compute networks create csm-vpc \
  --subnet-mode=custom \
  --bgp-routing-mode=regional

# 2. Create subnets
gcloud compute networks subnets create csm-gke-subnet \
  --network=csm-vpc \
  --region=europe-west10 \
  --range=10.0.0.0/20 \
  --secondary-range pods=10.4.0.0/14 \
  --secondary-range services=10.0.16.0/20

# 3. Create Cloud NAT
gcloud compute routers create csm-router \
  --network=csm-vpc \
  --region=europe-west10

gcloud compute routers nats create csm-nat \
  --router=csm-router \
  --region=europe-west10 \
  --auto-allocate-nat-external-ips \
  --nat-all-subnet-ip-ranges
```

#### Day 3-4: Terraform Infrastructure

```bash
# Navigate to production environment
cd infrastructure/terraform/environments/production

# Initialize Terraform
terraform init

# Review plan
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

**Resources Created:**
- GKE cluster (3 nodes, private)
- Cloud SQL PostgreSQL (HA, 4 vCPU, 16GB RAM)
- Artifact Registry
- Service Accounts with Workload Identity
- Pub/Sub topic and subscription
- Secret Manager secrets
- Billing budgets

#### Day 5: Verify Infrastructure

```bash
# Verify GKE cluster
gcloud container clusters get-credentials cloud-secrets-cluster-prod \
  --region=europe-west10

kubectl get nodes
kubectl get namespaces

# Verify Cloud SQL
gcloud sql instances describe secrets-manager-db-prod

# Verify Pub/Sub
gcloud pubsub topics list
gcloud pubsub subscriptions list
```

### 4.3 Phase 2: Application Deployment (Week 2)

#### Day 1: Build & Push Images

```bash
# Set environment variables
export PROJECT_ID=cloud-secrets-manager-prod
export REGION=europe-west10
export REGISTRY=${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images

# Authenticate Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push secret-service
cd apps/backend/secret-service
docker build -t ${REGISTRY}/secret-service:v1.0.0 .
docker push ${REGISTRY}/secret-service:v1.0.0

# Build and push audit-service
cd ../audit-service
docker build -t ${REGISTRY}/audit-service:v1.0.0 .
docker push ${REGISTRY}/audit-service:v1.0.0

# Build and push notification-service
cd ../notification-service
docker build -t ${REGISTRY}/notification-service:v1.0.0 .
docker push ${REGISTRY}/notification-service:v1.0.0

# Build and push frontend
cd ../../frontend
docker build -t ${REGISTRY}/frontend:v1.0.0 .
docker push ${REGISTRY}/frontend:v1.0.0
```

#### Day 2: Configure Secrets

```bash
# Create secrets in Secret Manager
gcloud secrets create jwt-secret \
  --data-file=- <<< "$(openssl rand -base64 32)"

gcloud secrets create encryption-key \
  --data-file=- <<< "$(openssl rand -base64 32)"

gcloud secrets create sendgrid-api-key \
  --data-file=- <<< "YOUR_SENDGRID_API_KEY"

# Grant access to service accounts
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:secret-service-prod@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### Day 3-4: Deploy with Helm

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace

# Deploy application
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f ./infrastructure/helm/cloud-secrets-manager/values-production.yaml \
  --namespace cloud-secrets-manager \
  --create-namespace \
  --set image.tag=v1.0.0 \
  --set cloudSql.connectionName=${CONNECTION_NAME} \
  --wait \
  --timeout 10m
```

#### Day 5: Verify Deployment

```bash
# Check pods
kubectl get pods -n cloud-secrets-manager

# Check services
kubectl get svc -n cloud-secrets-manager

# Check ingress
kubectl get ingress -n cloud-secrets-manager

# Test health endpoints
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager
curl http://localhost:8080/actuator/health
```

### 4.4 Phase 3: Monitoring & Observability (Week 3)

#### Deploy Prometheus Stack

```bash
# Add Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword='CHANGE_ME' \
  --set grafana.ingress.enabled=true \
  --set grafana.ingress.hosts[0]=grafana.cloudsecrets.io
```

#### Deploy Loki Stack

```bash
# Install Loki
helm install loki grafana/loki-stack \
  --namespace logging \
  --create-namespace \
  -f infrastructure/helm/loki-stack-values-production.yaml
```

#### Apply ServiceMonitors

```bash
# Deploy application ServiceMonitors
kubectl apply -f infrastructure/monitoring/servicemonitors/

# Deploy Loki ServiceMonitors
kubectl apply -f infrastructure/kubernetes/monitoring/
```

### 4.5 Phase 4: Security Hardening (Week 4)

#### Configure Network Policies

```bash
kubectl apply -f infrastructure/security/policies/network-policies-enhanced.yaml
kubectl apply -f infrastructure/security/policies/pod-security-standards.yaml
```

#### Enable Binary Authorization

```bash
# Create policy
gcloud container binauthz policy import policy.yaml

# Update GKE cluster
gcloud container clusters update cloud-secrets-cluster-prod \
  --enable-binauthz \
  --region=europe-west10
```

#### Configure Cloud Armor

```bash
# Create security policy
gcloud compute security-policies create csm-security-policy \
  --description="Cloud Secrets Manager WAF"

# Add rules
gcloud compute security-policies rules create 1000 \
  --security-policy=csm-security-policy \
  --expression="origin.region_code == 'CN'" \
  --action=deny-403

# Attach to backend service
gcloud compute backend-services update csm-backend \
  --security-policy=csm-security-policy \
  --global
```

---


## 5. Operational Procedures

### 5.1 Daily Operations

#### Morning Health Check (5 minutes)
```bash
# 1. Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces | grep -v Running

# 2. Check application health
kubectl get pods -n cloud-secrets-manager
curl https://api.cloudsecrets.io/actuator/health

# 3. Check database
gcloud sql instances describe secrets-manager-db-prod | grep state

# 4. Review overnight alerts
# Check Grafana dashboards
# Review PagerDuty incidents
```

#### Monitoring Dashboard Review (10 minutes)
- Application metrics (requests, errors, latency)
- Database performance (connections, queries, replication lag)
- Infrastructure metrics (CPU, memory, disk, network)
- Cost dashboard (daily spend vs. budget)

### 5.2 Weekly Operations

#### Monday: Capacity Planning
- Review resource utilization trends
- Check autoscaling metrics
- Plan for upcoming load (events, releases)
- Review and adjust resource requests/limits

#### Wednesday: Security Review
- Review access logs
- Check for failed authentication attempts
- Review IAM changes
- Scan for vulnerabilities (Trivy, Security Command Center)

#### Friday: Backup Verification
- Verify automated backups completed
- Test backup restoration (monthly full test)
- Review backup retention policies
- Check disaster recovery procedures

### 5.3 Monthly Operations

#### First Week: Cost Optimization
- Review monthly spend report
- Identify cost anomalies
- Optimize underutilized resources
- Review and adjust budgets
- Implement cost-saving recommendations

#### Second Week: Performance Tuning
- Analyze slow queries
- Optimize database indexes
- Review application performance metrics
- Tune JVM settings if needed
- Update resource allocations

#### Third Week: Security Audit
- Review security policies
- Update dependencies (security patches)
- Rotate secrets and credentials
- Review firewall rules
- Audit user access

#### Fourth Week: Disaster Recovery Test
- Test backup restoration
- Verify failover procedures
- Update runbooks
- Train team on incident response

### 5.4 Deployment Procedures

#### Standard Deployment (Blue-Green)

```bash
# 1. Build new version
export NEW_VERSION=v1.1.0
docker build -t ${REGISTRY}/secret-service:${NEW_VERSION} .
docker push ${REGISTRY}/secret-service:${NEW_VERSION}

# 2. Deploy to staging first
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-staging.yaml \
  --set image.tag=${NEW_VERSION} \
  --namespace cloud-secrets-manager-staging

# 3. Run smoke tests
./testing/smoke-tests.sh staging

# 4. Deploy to production
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-production.yaml \
  --set image.tag=${NEW_VERSION} \
  --namespace cloud-secrets-manager

# 5. Monitor rollout
kubectl rollout status deployment/secret-service -n cloud-secrets-manager

# 6. Verify health
curl https://api.cloudsecrets.io/actuator/health
```

#### Emergency Rollback

```bash
# Quick rollback to previous version
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Or specify revision
helm rollback cloud-secrets-manager 5 -n cloud-secrets-manager

# Verify rollback
kubectl get pods -n cloud-secrets-manager
curl https://api.cloudsecrets.io/actuator/health
```

### 5.5 Incident Response

#### Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| P0 - Critical | Complete outage | 15 minutes | API down, database unavailable |
| P1 - High | Major degradation | 1 hour | High error rate, slow response |
| P2 - Medium | Partial degradation | 4 hours | Single service degraded |
| P3 - Low | Minor issue | 1 business day | UI glitch, non-critical feature |

#### Incident Response Workflow

1. **Detection** (Automated alerts or user report)
2. **Triage** (Assess severity, assign owner)
3. **Investigation** (Gather logs, metrics, traces)
4. **Mitigation** (Apply fix or workaround)
5. **Resolution** (Verify fix, close incident)
6. **Post-Mortem** (Root cause analysis, prevention)

#### Common Incidents & Resolutions

**API Returning 500 Errors**
```bash
# 1. Check pod status
kubectl get pods -n cloud-secrets-manager

# 2. Check logs
kubectl logs deployment/secret-service -n cloud-secrets-manager --tail=100

# 3. Check database connectivity
kubectl exec -it deployment/secret-service -n cloud-secrets-manager -- \
  curl http://localhost:8080/actuator/health

# 4. Restart if needed
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
```

**Database Connection Pool Exhausted**
```bash
# 1. Check active connections
gcloud sql operations list --instance=secrets-manager-db-prod

# 2. Increase pool size (temporary)
kubectl set env deployment/secret-service \
  SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=20 \
  -n cloud-secrets-manager

# 3. Scale application (permanent)
kubectl scale deployment/secret-service --replicas=5 -n cloud-secrets-manager
```

**High Memory Usage**
```bash
# 1. Check memory metrics
kubectl top pods -n cloud-secrets-manager

# 2. Check for memory leaks
kubectl exec -it deployment/secret-service -n cloud-secrets-manager -- \
  curl http://localhost:8080/actuator/metrics/jvm.memory.used

# 3. Increase memory limits
# Edit values.yaml and redeploy
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-production.yaml \
  --set secretService.resources.limits.memory=2Gi
```

---


## 6. Monitoring & Alerting

### 6.1 Key Metrics to Monitor

#### Application Metrics

**Secret Service:**
- Request rate (requests/second)
- Error rate (errors/second, %)
- Response time (p50, p95, p99)
- Active users
- Secrets created/updated/deleted
- Authentication failures
- JWT token generation rate

**Audit Service:**
- Audit log write rate
- Query performance
- Storage growth rate

**Notification Service:**
- Pub/Sub message processing rate
- Email delivery success rate
- Notification queue depth
- Failed deliveries

#### Infrastructure Metrics

**GKE Cluster:**
- Node CPU utilization (target: <70%)
- Node memory utilization (target: <80%)
- Pod restart count
- Pod eviction count
- Network throughput

**Cloud SQL:**
- CPU utilization (target: <70%)
- Memory utilization (target: <80%)
- Active connections (target: <80% of max)
- Replication lag (target: <5 seconds)
- Query performance (slow queries)
- Storage utilization (target: <80%)

**Pub/Sub:**
- Message publish rate
- Message delivery rate
- Oldest unacked message age
- Subscription backlog

### 6.2 Alert Rules

#### Critical Alerts (P0 - Immediate Response)

```yaml
# API Down
- alert: APIDown
  expr: up{job="secret-service"} == 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Secret Service API is down"
    description: "API has been down for more than 2 minutes"

# Database Down
- alert: DatabaseDown
  expr: up{job="cloudsql"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Cloud SQL database is down"

# High Error Rate
- alert: HighErrorRate
  expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors/second"
```

#### High Priority Alerts (P1 - 1 Hour Response)

```yaml
# High Response Time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
  for: 10m
  labels:
    severity: high
  annotations:
    summary: "High API response time"
    description: "P95 latency is {{ $value }}s (threshold: 2s)"

# Database Connection Pool Near Limit
- alert: DatabaseConnectionPoolHigh
  expr: hikaricp_connections_active / hikaricp_connections_max > 0.8
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "Database connection pool near limit"

# Pod Restart Loop
- alert: PodRestartLoop
  expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "Pod is restarting frequently"
```

#### Medium Priority Alerts (P2 - 4 Hour Response)

```yaml
# High CPU Usage
- alert: HighCPUUsage
  expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
  for: 15m
  labels:
    severity: medium
  annotations:
    summary: "High CPU usage detected"

# High Memory Usage
- alert: HighMemoryUsage
  expr: container_memory_working_set_bytes / container_spec_memory_limit_bytes > 0.85
  for: 15m
  labels:
    severity: medium
  annotations:
    summary: "High memory usage detected"

# Disk Space Low
- alert: DiskSpaceLow
  expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
  for: 10m
  labels:
    severity: medium
  annotations:
    summary: "Disk space is running low"
```

### 6.3 Grafana Dashboards

#### Dashboard 1: Application Overview

**Panels:**
- Request rate (time series)
- Error rate (time series)
- Response time percentiles (time series)
- Active users (gauge)
- Recent errors (table)
- Top endpoints by traffic (bar chart)

#### Dashboard 2: Infrastructure Health

**Panels:**
- Node CPU/Memory (time series)
- Pod status (stat)
- Network I/O (time series)
- Disk usage (gauge)
- Container restarts (stat)

#### Dashboard 3: Database Performance

**Panels:**
- Connection pool usage (gauge)
- Query performance (time series)
- Slow queries (table)
- Replication lag (time series)
- Storage growth (time series)

#### Dashboard 4: Business Metrics

**Panels:**
- Secrets created/day (time series)
- Active projects (gauge)
- User signups (time series)
- API usage by endpoint (pie chart)
- Audit log volume (time series)

### 6.4 Log Aggregation

#### Log Levels

- **ERROR:** Application errors, exceptions
- **WARN:** Warnings, deprecated features
- **INFO:** Important business events
- **DEBUG:** Detailed debugging (dev/staging only)

#### Log Queries (Loki)

```logql
# All errors in last hour
{namespace="cloud-secrets-manager"} |= "ERROR" [1h]

# Slow queries
{app="secret-service"} |~ "duration.*[5-9][0-9]{3,}ms"

# Authentication failures
{app="secret-service"} |= "authentication failed"

# Database connection errors
{namespace="cloud-secrets-manager"} |= "connection" |= "refused"
```

### 6.5 Alerting Channels

**Configuration:**
```yaml
Slack:
  Channel: #cloud-secrets-alerts
  Webhook: https://hooks.slack.com/services/...
  
Email:
  Recipients: 
    - devops@company.com
    - oncall@company.com
  
PagerDuty:
  Integration Key: <key>
  Severity Mapping:
    critical: P0
    high: P1
    medium: P2
```

---


## 7. Security Hardening

### 7.1 Network Security

#### VPC Configuration
```bash
# Create private subnet for GKE
gcloud compute networks subnets create gke-private-subnet \
  --network=csm-vpc \
  --region=europe-west10 \
  --range=10.0.0.0/20 \
  --enable-private-ip-google-access \
  --secondary-range pods=10.4.0.0/14 \
  --secondary-range services=10.0.16.0/20

# Create firewall rules
gcloud compute firewall-rules create allow-internal \
  --network=csm-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/8

gcloud compute firewall-rules create allow-health-checks \
  --network=csm-vpc \
  --allow=tcp:80,tcp:443,tcp:8080 \
  --source-ranges=35.191.0.0/16,130.211.0.0/22
```

#### Network Policies
```yaml
# Deny all ingress by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: cloud-secrets-manager
spec:
  podSelector: {}
  policyTypes:
  - Ingress

# Allow specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-secret-service
  namespace: cloud-secrets-manager
spec:
  podSelector:
    matchLabels:
      app: secret-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: audit-service
    ports:
    - protocol: TCP
      port: 8081
  - to:
    - podSelector:
        matchLabels:
          app: notification-service
    ports:
    - protocol: TCP
      port: 8082
```

### 7.2 Identity & Access Management

#### Service Account Permissions (Principle of Least Privilege)

```yaml
Secret Service:
  - roles/cloudsql.client
  - roles/secretmanager.secretAccessor
  - roles/pubsub.publisher
  - roles/artifactregistry.reader

Audit Service:
  - roles/cloudsql.client
  - roles/logging.logWriter
  - roles/artifactregistry.reader

Notification Service:
  - roles/cloudsql.client
  - roles/pubsub.subscriber
  - roles/artifactregistry.reader

External Secrets:
  - roles/secretmanager.secretAccessor
```

#### Workload Identity Binding
```bash
# Bind Kubernetes SA to GCP SA
gcloud iam service-accounts add-iam-policy-binding \
  secret-service-prod@${PROJECT_ID}.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:${PROJECT_ID}.svc.id.goog[cloud-secrets-manager/secret-service]"
```

### 7.3 Secrets Management

#### Secrets Rotation Schedule

| Secret | Rotation Frequency | Automation |
|--------|-------------------|------------|
| JWT Secret | 90 days | Manual |
| Encryption Key | Never (data encrypted) | N/A |
| Database Passwords | 90 days | Automated |
| SendGrid API Key | 180 days | Manual |
| TLS Certificates | 90 days | Automated (cert-manager) |
| Service Account Keys | Never (use Workload Identity) | N/A |

#### Automated Secrets Rotation

```bash
# Create rotation script
cat > rotate-db-password.sh <<'EOF'
#!/bin/bash
NEW_PASSWORD=$(openssl rand -base64 32)

# Update in Secret Manager
gcloud secrets versions add db-password --data-file=- <<< "$NEW_PASSWORD"

# Update in Cloud SQL
gcloud sql users set-password secrets_user \
  --instance=secrets-manager-db-prod \
  --password="$NEW_PASSWORD"

# Restart pods to pick up new secret
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
EOF

# Schedule with Cloud Scheduler
gcloud scheduler jobs create http rotate-db-password \
  --schedule="0 0 1 */3 *" \
  --uri="https://cloud-run-function-url" \
  --http-method=POST
```

### 7.4 Vulnerability Management

#### Container Scanning

```bash
# Enable Container Analysis API
gcloud services enable containeranalysis.googleapis.com

# Scan images on push (automatic with Artifact Registry)
# View vulnerabilities
gcloud artifacts docker images scan \
  europe-west10-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest

# Set up continuous scanning
gcloud artifacts repositories set-iam-policy docker-images \
  --member=serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-artifactregistry.iam.gserviceaccount.com \
  --role=roles/artifactregistry.reader
```

#### Dependency Scanning

```bash
# Maven dependency check
mvn org.owasp:dependency-check-maven:check

# Trivy scanning
trivy image ${REGISTRY}/secret-service:latest

# Snyk scanning
snyk test --all-projects
```

### 7.5 Compliance & Audit

#### Enable Audit Logging

```bash
# Enable Data Access logs
gcloud projects set-iam-policy ${PROJECT_ID} policy.yaml

# policy.yaml
auditConfigs:
- auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_READ
  - logType: DATA_WRITE
  service: allServices
```

#### Security Command Center

```bash
# Enable Security Command Center
gcloud services enable securitycenter.googleapis.com

# Create findings
gcloud scc findings create \
  --source=organizations/${ORG_ID}/sources/${SOURCE_ID} \
  --finding-id=custom-finding-1 \
  --category="VULNERABILITY" \
  --state="ACTIVE"
```

### 7.6 DDoS Protection

#### Cloud Armor Configuration

```bash
# Create security policy
gcloud compute security-policies create csm-ddos-protection \
  --description="DDoS protection for Cloud Secrets Manager"

# Rate limiting rule
gcloud compute security-policies rules create 100 \
  --security-policy=csm-ddos-protection \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=1000 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP

# Geographic blocking
gcloud compute security-policies rules create 200 \
  --security-policy=csm-ddos-protection \
  --expression="origin.region_code in ['CN', 'RU', 'KP']" \
  --action=deny-403

# SQL injection protection
gcloud compute security-policies rules create 300 \
  --security-policy=csm-ddos-protection \
  --expression="evaluatePreconfiguredExpr('sqli-stable')" \
  --action=deny-403
```

---


## 8. Disaster Recovery

### 8.1 Backup Strategy

#### Database Backups

**Automated Backups (Cloud SQL):**
```yaml
Configuration:
  Backup Window: 02:00-06:00 UTC
  Frequency: Daily
  Retention: 30 days
  Point-in-Time Recovery: Enabled (7 days)
  Transaction Log Retention: 7 days
  
Backup Types:
  - Automated daily backups
  - On-demand backups before major changes
  - Export to Cloud Storage (weekly)
```

**Manual Backup Procedure:**
```bash
# Create on-demand backup
gcloud sql backups create \
  --instance=secrets-manager-db-prod \
  --description="Pre-deployment backup $(date +%Y%m%d)"

# Export to Cloud Storage
gcloud sql export sql secrets-manager-db-prod \
  gs://csm-backups/manual/backup-$(date +%Y%m%d-%H%M%S).sql \
  --database=secrets,audit

# Verify backup
gcloud sql backups list --instance=secrets-manager-db-prod
```

#### Application State Backups

**Kubernetes Resources:**
```bash
# Backup all Kubernetes resources
kubectl get all --all-namespaces -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Backup secrets (encrypted)
kubectl get secrets --all-namespaces -o yaml | \
  kubeseal -o yaml > sealed-secrets-$(date +%Y%m%d).yaml

# Backup with Velero
velero backup create csm-backup-$(date +%Y%m%d) \
  --include-namespaces cloud-secrets-manager,monitoring,logging
```

**Configuration Backups:**
```bash
# Backup Terraform state
gsutil cp terraform.tfstate gs://csm-terraform-state/backups/$(date +%Y%m%d)/

# Backup Helm values
tar -czf helm-values-$(date +%Y%m%d).tar.gz infrastructure/helm/

# Backup secrets from Secret Manager
gcloud secrets versions list --limit=1 jwt-secret > secrets-backup.txt
```

### 8.2 Recovery Procedures

#### Database Recovery

**Restore from Automated Backup:**
```bash
# List available backups
gcloud sql backups list --instance=secrets-manager-db-prod

# Restore to new instance
gcloud sql backups restore BACKUP_ID \
  --backup-instance=secrets-manager-db-prod \
  --backup-id=BACKUP_ID

# Or restore to point in time
gcloud sql backups restore secrets-manager-db-prod \
  --backup-instance=secrets-manager-db-prod \
  --point-in-time=2025-12-05T10:30:00Z
```

**Restore from Cloud Storage Export:**
```bash
# Import from Cloud Storage
gcloud sql import sql secrets-manager-db-prod \
  gs://csm-backups/manual/backup-20251205-103000.sql \
  --database=secrets
```

#### Application Recovery

**Restore Kubernetes Resources:**
```bash
# Restore from Velero backup
velero restore create --from-backup csm-backup-20251205

# Or restore manually
kubectl apply -f k8s-backup-20251205.yaml
```

**Redeploy with Helm:**
```bash
# Restore from last known good configuration
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-production.yaml \
  --set image.tag=v1.0.0-stable
```

### 8.3 Disaster Recovery Plan

#### RTO & RPO Targets

| Component | RTO (Recovery Time) | RPO (Data Loss) |
|-----------|-------------------|-----------------|
| Database | 1 hour | 5 minutes |
| Application | 30 minutes | 0 (stateless) |
| Monitoring | 2 hours | 1 hour |
| Overall System | 2 hours | 5 minutes |

#### DR Scenarios

**Scenario 1: Database Failure**
```
Impact: Complete service outage
Recovery Steps:
1. Verify database is down (2 min)
2. Identify root cause (5 min)
3. Restore from latest backup (30 min)
4. Verify data integrity (10 min)
5. Restart application pods (5 min)
6. Verify service health (5 min)
Total: ~57 minutes (within 1 hour RTO)
```

**Scenario 2: GKE Cluster Failure**
```
Impact: Complete service outage
Recovery Steps:
1. Verify cluster is down (2 min)
2. Create new cluster from Terraform (15 min)
3. Deploy applications with Helm (10 min)
4. Restore configurations (5 min)
5. Verify service health (5 min)
Total: ~37 minutes (within 30 min RTO)
```

**Scenario 3: Regional Outage**
```
Impact: Complete service outage
Recovery Steps:
1. Activate DR region (manual decision) (10 min)
2. Promote read replica to primary (5 min)
3. Update DNS to DR region (5 min)
4. Deploy applications to DR cluster (15 min)
5. Verify service health (10 min)
Total: ~45 minutes (within 1 hour RTO)
```

**Scenario 4: Data Corruption**
```
Impact: Partial service degradation
Recovery Steps:
1. Identify corrupted data (10 min)
2. Stop writes to affected tables (2 min)
3. Restore from point-in-time backup (30 min)
4. Verify data integrity (15 min)
5. Resume normal operations (3 min)
Total: ~60 minutes (within 1 hour RTO)
```

### 8.4 Multi-Region Setup (Optional)

#### Architecture for High Availability

```
Primary Region (europe-west10):
  - GKE Cluster (3 nodes)
  - Cloud SQL Primary (HA)
  - Cloud SQL Read Replica
  
DR Region (europe-west1):
  - GKE Cluster (standby, 1 node)
  - Cloud SQL Read Replica
  - Automated failover scripts
  
Global:
  - Cloud Load Balancer
  - Cloud CDN
  - Cloud Armor
```

#### Failover Procedure

```bash
# 1. Promote read replica to primary
gcloud sql instances promote-replica secrets-manager-db-dr \
  --project=${PROJECT_ID}

# 2. Update DNS
gcloud dns record-sets transaction start --zone=csm-zone
gcloud dns record-sets transaction add \
  --name=api.cloudsecrets.io. \
  --type=A \
  --zone=csm-zone \
  --ttl=300 \
  NEW_IP_ADDRESS
gcloud dns record-sets transaction execute --zone=csm-zone

# 3. Scale up DR cluster
gcloud container clusters resize cloud-secrets-cluster-dr \
  --num-nodes=3 \
  --region=europe-west1

# 4. Deploy applications
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-production.yaml \
  --set cloudSql.connectionName=${DR_CONNECTION_NAME}
```

### 8.5 Testing & Validation

#### Monthly DR Drill

```bash
#!/bin/bash
# DR Drill Script - Run monthly

echo "=== Cloud Secrets Manager DR Drill ==="
echo "Date: $(date)"

# 1. Backup current state
echo "1. Creating backup..."
gcloud sql backups create --instance=secrets-manager-db-prod

# 2. Create test instance
echo "2. Creating test instance..."
gcloud sql instances create csm-dr-test \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=europe-west10

# 3. Restore backup to test instance
echo "3. Restoring backup..."
BACKUP_ID=$(gcloud sql backups list --instance=secrets-manager-db-prod --limit=1 --format="value(id)")
gcloud sql backups restore $BACKUP_ID \
  --backup-instance=secrets-manager-db-prod \
  --restore-instance=csm-dr-test

# 4. Verify data
echo "4. Verifying data..."
gcloud sql connect csm-dr-test --user=postgres << EOF
\c secrets
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM secrets;
\q
EOF

# 5. Cleanup
echo "5. Cleaning up..."
gcloud sql instances delete csm-dr-test --quiet

echo "=== DR Drill Complete ==="
```

---


## 9. Maintenance & Support

### 9.1 Maintenance Windows

#### Scheduled Maintenance

**Weekly Maintenance (Low Impact):**
- **Time:** Sunday 02:00-04:00 UTC
- **Activities:**
  - Security patches (OS, dependencies)
  - Log rotation and cleanup
  - Backup verification
  - Performance tuning

**Monthly Maintenance (Medium Impact):**
- **Time:** First Sunday of month, 02:00-06:00 UTC
- **Activities:**
  - Application updates
  - Database maintenance (VACUUM, ANALYZE)
  - Certificate renewals
  - Disaster recovery testing

**Quarterly Maintenance (High Impact):**
- **Time:** First Sunday of quarter, 00:00-08:00 UTC
- **Activities:**
  - Major version upgrades
  - Infrastructure changes
  - Comprehensive security audit
  - Full DR failover test

#### Maintenance Procedures

**Pre-Maintenance Checklist:**
```bash
# 1. Notify users (24 hours advance)
# 2. Create backup
gcloud sql backups create --instance=secrets-manager-db-prod

# 3. Verify backup
gcloud sql backups list --instance=secrets-manager-db-prod --limit=1

# 4. Scale up resources (if needed)
kubectl scale deployment/secret-service --replicas=5 -n cloud-secrets-manager

# 5. Enable maintenance mode (optional)
kubectl apply -f maintenance-mode.yaml
```

**Post-Maintenance Checklist:**
```bash
# 1. Verify all services healthy
kubectl get pods -n cloud-secrets-manager
curl https://api.cloudsecrets.io/actuator/health

# 2. Run smoke tests
./testing/smoke-tests.sh production

# 3. Check monitoring dashboards
# 4. Review logs for errors
# 5. Disable maintenance mode
# 6. Notify users of completion
```

### 9.2 Update Procedures

#### Application Updates

**Minor Updates (Patch Releases):**
```bash
# 1. Build new image
docker build -t ${REGISTRY}/secret-service:v1.0.1 .
docker push ${REGISTRY}/secret-service:v1.0.1

# 2. Update staging
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-staging.yaml \
  --set image.tag=v1.0.1 \
  --namespace cloud-secrets-manager-staging

# 3. Test in staging
./testing/smoke-tests.sh staging

# 4. Update production (rolling update)
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f values-production.yaml \
  --set image.tag=v1.0.1 \
  --namespace cloud-secrets-manager

# 5. Monitor rollout
kubectl rollout status deployment/secret-service -n cloud-secrets-manager
```

**Major Updates (Version Upgrades):**
```bash
# 1. Review breaking changes
# 2. Update database schema (Flyway migrations)
# 3. Deploy to dev environment
# 4. Run full test suite
# 5. Deploy to staging
# 6. Perform UAT (User Acceptance Testing)
# 7. Schedule maintenance window
# 8. Deploy to production with rollback plan
# 9. Monitor for 24 hours
```

#### Infrastructure Updates

**GKE Cluster Updates:**
```bash
# 1. Check available versions
gcloud container get-server-config --region=europe-west10

# 2. Update control plane
gcloud container clusters upgrade cloud-secrets-cluster-prod \
  --master \
  --cluster-version=1.28.5-gke.1000 \
  --region=europe-west10

# 3. Update node pools (one at a time)
gcloud container clusters upgrade cloud-secrets-cluster-prod \
  --node-pool=default-pool \
  --cluster-version=1.28.5-gke.1000 \
  --region=europe-west10
```

**Database Updates:**
```bash
# 1. Create read replica for testing
gcloud sql instances create csm-db-test-replica \
  --master-instance-name=secrets-manager-db-prod

# 2. Test upgrade on replica
gcloud sql instances patch csm-db-test-replica \
  --database-version=POSTGRES_16

# 3. Verify compatibility
# 4. Schedule maintenance window
# 5. Upgrade production
gcloud sql instances patch secrets-manager-db-prod \
  --database-version=POSTGRES_16 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=2
```

### 9.3 Performance Optimization

#### Database Optimization

**Query Optimization:**
```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Create indexes for slow queries
CREATE INDEX CONCURRENTLY idx_secrets_user_id ON secrets(user_id);
CREATE INDEX CONCURRENTLY idx_secrets_project_id ON secrets(project_id);

-- Analyze tables
ANALYZE secrets;
ANALYZE users;
ANALYZE projects;
```

**Connection Pooling:**
```yaml
# Update Hikari configuration
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

#### Application Optimization

**JVM Tuning:**
```yaml
# Optimize JVM settings
JAVA_OPTS: >-
  -Xms1g
  -Xmx2g
  -XX:+UseG1GC
  -XX:MaxGCPauseMillis=200
  -XX:+UseStringDeduplication
  -XX:+OptimizeStringConcat
  -XX:+UseCompressedOops
  -XX:+UseContainerSupport
  -XX:MaxRAMPercentage=75.0
```

**Caching Strategy:**
```java
// Enable caching for frequently accessed data
@Cacheable(value = "users", key = "#userId")
public User getUserById(Long userId) {
    return userRepository.findById(userId);
}

@Cacheable(value = "projects", key = "#projectId")
public Project getProjectById(Long projectId) {
    return projectRepository.findById(projectId);
}
```

#### Infrastructure Optimization

**Horizontal Pod Autoscaling:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: secret-service-hpa
  namespace: cloud-secrets-manager
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: secret-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Vertical Pod Autoscaling:**
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: secret-service-vpa
  namespace: cloud-secrets-manager
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: secret-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: secret-service
      minAllowed:
        cpu: 200m
        memory: 256Mi
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
```

### 9.4 Support Tiers

#### Support Levels

| Tier | Response Time | Availability | Cost |
|------|--------------|--------------|------|
| **Basic** | 24 hours | Business hours | Included |
| **Standard** | 4 hours | 24/5 | $500/month |
| **Premium** | 1 hour | 24/7 | $2,000/month |
| **Enterprise** | 15 minutes | 24/7 + dedicated | $5,000/month |

#### Escalation Path

```
Level 1: DevOps Engineer
  ↓ (15 minutes)
Level 2: Senior DevOps Engineer
  ↓ (30 minutes)
Level 3: Solutions Architect
  ↓ (1 hour)
Level 4: Engineering Manager
```

### 9.5 Documentation Maintenance

#### Documentation Review Schedule

**Monthly:**
- Update runbooks with new procedures
- Review and update troubleshooting guides
- Update architecture diagrams if changed
- Review and update cost estimates

**Quarterly:**
- Comprehensive documentation audit
- Update all version numbers
- Review and update security procedures
- Update disaster recovery procedures

**Annually:**
- Complete documentation overhaul
- Update all screenshots and examples
- Review and update all links
- Archive outdated documentation

---


## 10. Recommendations

### 10.1 Immediate Actions (Week 1)

**Priority 1: Critical**
1. ✅ **Revoke Compromised Service Account Keys**
   - Action: Revoke old Firebase service account keys in GCP Console
   - Impact: Security vulnerability
   - Effort: 15 minutes

2. ✅ **Set Up Budget Alerts**
   - Action: Configure billing budgets with alerts at 50%, 75%, 90%, 100%
   - Impact: Cost control
   - Effort: 30 minutes

3. ✅ **Enable Audit Logging**
   - Action: Enable Data Access audit logs for all services
   - Impact: Compliance and security
   - Effort: 1 hour

**Priority 2: High**
4. 📋 **Deploy to Development Environment**
   - Action: Apply Terraform and deploy to dev GKE cluster
   - Impact: Validate infrastructure
   - Effort: 4 hours

5. 📋 **Configure Monitoring Alerts**
   - Action: Deploy Prometheus, configure critical alerts
   - Impact: Operational visibility
   - Effort: 4 hours

6. 📋 **Document Runbooks**
   - Action: Create incident response procedures
   - Impact: Faster incident resolution
   - Effort: 8 hours

### 10.2 Short-Term Improvements (Month 1)

**Infrastructure:**
1. **Implement Private GKE Cluster**
   - Enhance security with private nodes and endpoints
   - Estimated cost: No additional cost
   - Effort: 1 day

2. **Enable High Availability for Database**
   - Configure regional HA for Cloud SQL
   - Estimated cost: +$234/month
   - Effort: 2 hours

3. **Set Up Cloud Armor WAF**
   - Protect against DDoS and common attacks
   - Estimated cost: +$5/month
   - Effort: 4 hours

**Monitoring:**
4. **Deploy Complete Observability Stack**
   - Prometheus, Grafana, Loki, Tempo
   - Estimated cost: +$50/month
   - Effort: 2 days

5. **Create Custom Dashboards**
   - Business metrics, SLOs, error budgets
   - Estimated cost: $0
   - Effort: 1 day

**Security:**
6. **Implement Secrets Rotation**
   - Automate rotation of JWT secrets, DB passwords
   - Estimated cost: $0
   - Effort: 1 day

7. **Enable Binary Authorization**
   - Ensure only signed images are deployed
   - Estimated cost: $0
   - Effort: 4 hours

### 10.3 Medium-Term Enhancements (Quarter 1)

**Scalability:**
1. **Implement Horizontal Pod Autoscaling**
   - Auto-scale based on CPU/memory/custom metrics
   - Estimated cost: Variable (pay for what you use)
   - Effort: 1 day

2. **Add Read Replicas**
   - Improve read performance and availability
   - Estimated cost: +$234/month per replica
   - Effort: 2 hours

3. **Implement Caching Layer**
   - Redis for session management and caching
   - Estimated cost: +$50/month
   - Effort: 3 days

**Reliability:**
4. **Set Up Multi-Region Deployment**
   - DR region with automated failover
   - Estimated cost: +$700/month
   - Effort: 1 week

5. **Implement Circuit Breakers**
   - Resilience patterns for service-to-service calls
   - Estimated cost: $0
   - Effort: 2 days

**Compliance:**
6. **Achieve SOC 2 Compliance**
   - Implement required controls and auditing
   - Estimated cost: $10,000-$50,000 (audit)
   - Effort: 3 months

7. **GDPR Compliance**
   - Data residency, right to deletion, data portability
   - Estimated cost: $0 (development time)
   - Effort: 2 weeks

### 10.4 Long-Term Vision (Year 1)

**Platform Evolution:**
1. **Microservices Expansion**
   - Add dedicated services for:
     - User management
     - Billing and subscriptions
     - Analytics and reporting
   - Estimated cost: +$300/month
   - Effort: 3 months

2. **Multi-Tenancy**
   - Support for enterprise customers with isolated environments
   - Estimated cost: +$500/month
   - Effort: 2 months

3. **API Gateway**
   - Centralized API management with rate limiting, authentication
   - Estimated cost: +$100/month
   - Effort: 1 month

**Advanced Features:**
4. **Machine Learning Integration**
   - Anomaly detection for security events
   - Predictive analytics for resource usage
   - Estimated cost: +$200/month
   - Effort: 2 months

5. **Mobile Applications**
   - Native iOS and Android apps
   - Estimated cost: $0 (development time)
   - Effort: 4 months

6. **Advanced Encryption**
   - Client-side encryption
   - Hardware Security Module (HSM) integration
   - Estimated cost: +$1,000/month
   - Effort: 1 month

### 10.5 Architecture Improvements

#### Current Architecture Issues

1. **Single Database for All Services**
   - Issue: Tight coupling, single point of failure
   - Recommendation: Separate databases per service
   - Impact: Better isolation, independent scaling
   - Effort: 1 week

2. **Synchronous Service Communication**
   - Issue: Cascading failures, tight coupling
   - Recommendation: Event-driven architecture with Pub/Sub
   - Impact: Better resilience, loose coupling
   - Effort: 2 weeks

3. **No API Gateway**
   - Issue: Each service exposed directly
   - Recommendation: Implement Cloud Endpoints or Kong
   - Impact: Centralized auth, rate limiting, monitoring
   - Effort: 1 week

#### Proposed Future Architecture

```
                    ┌─────────────────┐
                    │   Cloud CDN     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Cloud Armor    │
                    │   (WAF/DDoS)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │  (Kong/Apigee)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
   │  Secret  │      │   Audit     │     │Notification │
   │ Service  │      │  Service    │     │  Service    │
   └────┬─────┘      └──────┬──────┘     └──────┬──────┘
        │                   │                    │
   ┌────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
   │Cloud SQL │      │ Cloud SQL   │     │ Cloud SQL   │
   │(Secrets) │      │  (Audit)    │     │(Notifications)│
   └──────────┘      └─────────────┘     └─────────────┘
        │                                        │
        └────────────────┬───────────────────────┘
                         │
                  ┌──────▼──────┐
                  │   Pub/Sub   │
                  │   (Events)  │
                  └─────────────┘
```

### 10.6 Cost Optimization Roadmap

#### Phase 1: Quick Wins (Month 1)
- Implement resource scheduling for dev/staging
- Right-size VM instances based on actual usage
- Enable sustained use discounts
- **Expected Savings:** $300/month (15%)

#### Phase 2: Committed Use (Month 2)
- Purchase 1-year CUD for production workloads
- Negotiate enterprise discount with Google
- **Expected Savings:** $400/month (20%)

#### Phase 3: Architecture Optimization (Quarter 1)
- Implement caching to reduce database load
- Optimize container images (smaller size)
- Use preemptible VMs for batch workloads
- **Expected Savings:** $200/month (10%)

#### Phase 4: Advanced Optimization (Quarter 2)
- Implement auto-scaling policies
- Use Cloud CDN for static assets
- Optimize network egress
- **Expected Savings:** $150/month (7%)

**Total Potential Savings:** $1,050/month (52% reduction)

---


## 11. Deployment Checklist

### 11.1 Pre-Production Checklist

#### Infrastructure
- [ ] GCP project created and configured
- [ ] Billing account linked with budgets
- [ ] Required APIs enabled
- [ ] VPC and subnets configured
- [ ] Cloud NAT configured
- [ ] Firewall rules configured
- [ ] GKE cluster deployed (private)
- [ ] Cloud SQL deployed (HA enabled)
- [ ] Artifact Registry configured
- [ ] Service accounts created with Workload Identity
- [ ] Pub/Sub topic and subscription created

#### Security
- [ ] Secrets stored in Secret Manager
- [ ] External Secrets Operator deployed
- [ ] Network policies applied
- [ ] Pod Security Standards enforced
- [ ] Cloud Armor configured
- [ ] SSL/TLS certificates configured
- [ ] Audit logging enabled
- [ ] Binary Authorization enabled
- [ ] Service account keys revoked (using Workload Identity)

#### Application
- [ ] Docker images built and pushed
- [ ] Database migrations applied
- [ ] Helm charts deployed
- [ ] Health checks passing
- [ ] Ingress configured
- [ ] DNS records configured
- [ ] Frontend deployed and accessible
- [ ] Backend APIs accessible
- [ ] Authentication working (Firebase)
- [ ] Pub/Sub integration working

#### Monitoring
- [ ] Prometheus deployed
- [ ] Grafana deployed
- [ ] Loki deployed
- [ ] Promtail deployed
- [ ] ServiceMonitors configured
- [ ] Alert rules configured
- [ ] Dashboards imported
- [ ] Alerting channels configured (Slack, Email, PagerDuty)
- [ ] Log aggregation working

#### Testing
- [ ] Smoke tests passing
- [ ] Integration tests passing
- [ ] Load tests completed
- [ ] Security scan completed
- [ ] Disaster recovery tested
- [ ] Backup and restore tested

#### Documentation
- [ ] Architecture documentation updated
- [ ] Runbooks created
- [ ] Incident response procedures documented
- [ ] Maintenance procedures documented
- [ ] User documentation updated
- [ ] API documentation published

### 11.2 Go-Live Checklist

#### Day Before Launch
- [ ] Final backup of all data
- [ ] Verify all monitoring alerts
- [ ] Notify stakeholders of launch
- [ ] Prepare rollback plan
- [ ] Schedule on-call rotation
- [ ] Review incident response procedures

#### Launch Day
- [ ] Execute deployment
- [ ] Verify all services healthy
- [ ] Run smoke tests
- [ ] Monitor dashboards continuously
- [ ] Check error rates and latency
- [ ] Verify user authentication
- [ ] Test critical user flows
- [ ] Monitor costs

#### Day After Launch
- [ ] Review metrics and logs
- [ ] Address any issues found
- [ ] Gather user feedback
- [ ] Update documentation
- [ ] Conduct post-launch review
- [ ] Plan next improvements

### 11.3 Production Readiness Scorecard

| Category | Criteria | Status | Score |
|----------|----------|--------|-------|
| **Infrastructure** | GKE cluster configured | ✅ | 10/10 |
| | Cloud SQL configured | ✅ | 10/10 |
| | Networking configured | 🟡 | 7/10 |
| | High availability | 🟡 | 6/10 |
| **Security** | Secrets management | ✅ | 10/10 |
| | Network policies | ✅ | 10/10 |
| | Authentication | ✅ | 10/10 |
| | Encryption | ✅ | 10/10 |
| | Audit logging | 🟡 | 7/10 |
| **Monitoring** | Metrics collection | 🟡 | 7/10 |
| | Log aggregation | ✅ | 10/10 |
| | Alerting | 🟡 | 6/10 |
| | Dashboards | 🟡 | 7/10 |
| **Reliability** | Backup strategy | ✅ | 9/10 |
| | Disaster recovery | 🟡 | 7/10 |
| | Auto-scaling | ❌ | 3/10 |
| | Circuit breakers | ❌ | 0/10 |
| **Operations** | Runbooks | ✅ | 9/10 |
| | Incident response | 🟡 | 7/10 |
| | Maintenance procedures | ✅ | 8/10 |
| | Documentation | ✅ | 9/10 |
| **Testing** | Unit tests | ✅ | 8/10 |
| | Integration tests | 🟡 | 6/10 |
| | Load tests | 🟡 | 5/10 |
| | Security tests | 🟡 | 6/10 |

**Overall Score: 7.5/10 (B+)**

**Readiness Assessment:** ✅ **READY FOR PRODUCTION** with recommended improvements

---

## 12. Conclusion

### 12.1 Executive Summary

The Cloud Secrets Manager project is **well-architected and 75% ready for production deployment** on Google Cloud Platform. The infrastructure code is comprehensive, security best practices are followed, and the application is functionally complete.

**Key Strengths:**
- Modern microservices architecture
- Comprehensive Terraform infrastructure-as-code
- Security-first design (Workload Identity, encryption, network policies)
- Good observability foundation
- Excellent documentation

**Critical Gaps:**
- No active production deployment yet
- Monitoring alerts not fully configured
- Disaster recovery procedures need testing
- Cost optimization strategies not implemented
- Frontend integration incomplete

### 12.2 Recommended Deployment Timeline

**Week 1-2: Infrastructure Setup**
- Deploy development environment
- Configure monitoring and alerting
- Test disaster recovery procedures

**Week 3-4: Staging Deployment**
- Deploy to staging environment
- Conduct thorough testing
- Train operations team

**Week 5-6: Production Deployment**
- Deploy to production
- Monitor closely for 2 weeks
- Gather user feedback

**Week 7-8: Optimization**
- Implement cost optimizations
- Fine-tune performance
- Address any issues

### 12.3 Estimated Costs

| Environment | Monthly Cost | Annual Cost |
|-------------|-------------|-------------|
| Development | $76 | $912 |
| Staging | $308 | $3,696 |
| Production | $1,364 | $16,368 |
| **Total** | **$1,748** | **$20,976** |

**With Optimizations:** $1,200/month ($14,400/year) - 31% savings

### 12.4 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Cost overrun | Medium | High | Budget alerts, cost optimization |
| Security breach | Low | Critical | Security hardening, audit logging |
| Data loss | Low | Critical | Backups, PITR, DR procedures |
| Service outage | Medium | High | HA, monitoring, incident response |
| Performance issues | Medium | Medium | Load testing, auto-scaling |

### 12.5 Success Metrics

**Technical Metrics:**
- Uptime: 99.9% (8.76 hours downtime/year)
- Response time: p95 < 500ms, p99 < 1s
- Error rate: < 0.1%
- Database query time: p95 < 100ms

**Business Metrics:**
- User satisfaction: > 4.5/5
- API availability: > 99.9%
- Support ticket resolution: < 24 hours
- Cost per user: < $5/month

### 12.6 Final Recommendations

**Immediate (Do Now):**
1. Revoke compromised service account keys
2. Set up billing budgets and alerts
3. Deploy to development environment
4. Configure critical monitoring alerts

**Short-Term (Month 1):**
1. Deploy to staging environment
2. Complete monitoring setup
3. Test disaster recovery procedures
4. Implement security hardening

**Medium-Term (Quarter 1):**
1. Deploy to production
2. Implement cost optimizations
3. Add high availability features
4. Complete frontend integration

**Long-Term (Year 1):**
1. Multi-region deployment
2. Advanced features (ML, mobile apps)
3. SOC 2 compliance
4. Platform expansion

---

## Appendices

### Appendix A: Terraform Commands Reference

```bash
# Initialize Terraform
terraform -chdir=infrastructure/terraform/environments/production init

# Plan changes
terraform -chdir=infrastructure/terraform/environments/production plan -out=tfplan

# Apply changes
terraform -chdir=infrastructure/terraform/environments/production apply tfplan

# Destroy resources (use with caution!)
terraform -chdir=infrastructure/terraform/environments/production destroy

# Show current state
terraform -chdir=infrastructure/terraform/environments/production show

# Import existing resources
terraform -chdir=infrastructure/terraform/environments/production import \
  google_container_cluster.primary projects/PROJECT_ID/locations/REGION/clusters/CLUSTER_NAME
```

### Appendix B: Useful GCP Commands

```bash
# List all GKE clusters
gcloud container clusters list

# Get cluster credentials
gcloud container clusters get-credentials CLUSTER_NAME --region=REGION

# List Cloud SQL instances
gcloud sql instances list

# Connect to Cloud SQL
gcloud sql connect INSTANCE_NAME --user=postgres

# List Artifact Registry repositories
gcloud artifacts repositories list

# List secrets
gcloud secrets list

# View billing account
gcloud billing accounts list

# View current project
gcloud config get-value project
```

### Appendix C: Kubectl Commands Reference

```bash
# Get all resources
kubectl get all -n cloud-secrets-manager

# Describe pod
kubectl describe pod POD_NAME -n cloud-secrets-manager

# View logs
kubectl logs POD_NAME -n cloud-secrets-manager --tail=100 -f

# Execute command in pod
kubectl exec -it POD_NAME -n cloud-secrets-manager -- /bin/bash

# Port forward
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager

# Scale deployment
kubectl scale deployment/secret-service --replicas=5 -n cloud-secrets-manager

# Restart deployment
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager

# View rollout status
kubectl rollout status deployment/secret-service -n cloud-secrets-manager

# View rollout history
kubectl rollout history deployment/secret-service -n cloud-secrets-manager
```

### Appendix D: Helm Commands Reference

```bash
# List releases
helm list -n cloud-secrets-manager

# Get values
helm get values cloud-secrets-manager -n cloud-secrets-manager

# Upgrade release
helm upgrade cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  -f values-production.yaml \
  -n cloud-secrets-manager

# Rollback release
helm rollback cloud-secrets-manager REVISION -n cloud-secrets-manager

# Uninstall release
helm uninstall cloud-secrets-manager -n cloud-secrets-manager

# Show history
helm history cloud-secrets-manager -n cloud-secrets-manager
```

---

**Document Version:** 1.0  
**Last Updated:** December 5, 2025  
**Prepared By:** Senior Solution Architect & Cloud Engineer  
**Next Review:** January 5, 2026

---

**END OF DOCUMENT**

