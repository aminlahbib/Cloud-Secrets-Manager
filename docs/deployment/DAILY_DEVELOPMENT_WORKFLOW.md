# Daily Development Workflow Guide

**Streamlined guide for day-to-day development and deployment workflows.**

This guide covers routine tasks: code changes, building, testing, deploying, and monitoring updates.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Code Changes Workflow](#code-changes-workflow)
4. [Build & Deploy Workflow](#build--deploy-workflow)
5. [CI/CD Automated Workflow](#cicd-automated-workflow)
6. [Manual Deployment](#manual-deployment)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference](#quick-reference)

---

## Quick Start

### Prerequisites Check

```bash
# Set environment variables
export PROJECT_ID="cloud-secrets-manager"
export REGION="europe-west10"
export CLUSTER_NAME="cloud-secrets-cluster-dev"
export NAMESPACE="cloud-secrets-manager"

# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Verify Docker authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### One-Command Status Check

```bash
# Check everything at once
kubectl get pods,svc,deployments -n ${NAMESPACE} && \
kubectl top pods -n ${NAMESPACE} && \
helm list -n ${NAMESPACE}
```

---

## Local Development

### Start Local Environment

```bash
# Start all services with Docker Compose
cd infrastructure/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Run Tests Locally

```bash
# Secret Service tests
cd apps/backend/secret-service
mvn clean test

# Audit Service tests
cd ../audit-service
mvn clean test

# All tests
mvn clean test -pl apps/backend/secret-service,apps/backend/audit-service
```

### Local Database Access

```bash
# Connect to secrets database
docker exec -it cloud-secrets-manager-secrets-db-1 psql -U secret_user -d secrets

# Connect to audit database
docker exec -it cloud-secrets-manager-audit-db-1 psql -U audit_user -d audit
```

---

## Code Changes Workflow

### Standard Git Workflow

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes and test locally
# ... make code changes ...
mvn clean test

# 3. Commit changes
git add .
git commit -m "feat: add new feature"

# 4. Push and create PR
git push origin feature/my-feature
# Create PR on GitHub to 'develop' branch
```

### Pre-Commit Checklist

- [ ] Code compiles (`mvn clean compile`)
- [ ] Tests pass (`mvn clean test`)
- [ ] No security vulnerabilities (`trivy fs .`)
- [ ] Code formatted (`mvn formatter:format`)
- [ ] Commit message follows conventions

---

## Build & Deploy Workflow

### Option A: Automated CI/CD (Recommended)

**For pushes to `develop` or `main` branches:**

1. **Push to GitHub**
   ```bash
   git push origin develop
   ```

2. **GitHub Actions automatically:**
   - ✅ Builds and tests code
   - ✅ Runs Trivy security scans
   - ✅ Builds Docker images
   - ✅ Scans images with Trivy
   - ✅ Pushes to Artifact Registry
   - ✅ Deploys to dev/staging/production

3. **Monitor Pipeline**
   - Go to: GitHub → Actions tab
   - Watch workflow execution
   - Check for any failures

4. **Verify Deployment**
   ```bash
   # Wait for deployment to complete
   kubectl get pods -n ${NAMESPACE} -w
   
   # Check rollout status
   kubectl rollout status deployment/secret-service -n ${NAMESPACE}
   ```

### Option B: Manual Build & Deploy

**Use this when CI/CD is not available or for hotfixes:**

#### Step 1: Build Images

```bash
# Build Secret Service
cd apps/backend/secret-service
IMAGE_TAG=$(git rev-parse --short HEAD)
docker build --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:${IMAGE_TAG} \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest \
  .

# Scan image
trivy image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:${IMAGE_TAG} \
  --exit-code 1 --severity HIGH,CRITICAL || echo "Review vulnerabilities"

# Push image
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:${IMAGE_TAG}
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest

# Repeat for Audit Service
cd ../audit-service
docker build --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:${IMAGE_TAG} \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest \
  .
trivy image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:${IMAGE_TAG} \
  --exit-code 1 --severity HIGH,CRITICAL || echo "Review vulnerabilities"
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:${IMAGE_TAG}
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest
```

#### Step 2: Deploy with Helm

```bash
# Update Helm values if needed (e.g., image tag)
cd infrastructure/helm/cloud-secrets-manager
# Edit values.yaml: image.tag = "${IMAGE_TAG}"

# Deploy
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=${NAMESPACE} \
  --set secretService.image.tag=${IMAGE_TAG} \
  --set auditService.image.tag=${IMAGE_TAG} \
  --wait \
  --timeout=10m

# Or use latest tag
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=${NAMESPACE} \
  --wait
```

#### Step 3: Restart Deployments (if using latest tag)

```bash
# Restart to pick up new image
kubectl rollout restart deployment/secret-service -n ${NAMESPACE}
kubectl rollout restart deployment/audit-service -n ${NAMESPACE}

# Monitor rollout
kubectl rollout status deployment/secret-service -n ${NAMESPACE}
kubectl rollout status deployment/audit-service -n ${NAMESPACE}
```

---

## CI/CD Automated Workflow

### Branch Strategy

```
feature/* → develop → main → production
   │          │        │
   │          │        └─→ staging (manual approval)
   │          │            └─→ production (2 approvals)
   │          └─→ dev (automatic)
   └─→ PR → build & test only
```

### Workflow Stages

1. **Build & Test** (all PRs and pushes)
   - Maven build
   - Unit tests
   - Integration tests
   - Test reports

2. **Security Scan** (all PRs and pushes)
   - Trivy filesystem scan
   - Fails on CRITICAL/HIGH vulnerabilities

3. **Build Images** (pushes to develop/main)
   - Build Docker images
   - Trivy image scan
   - Push to Artifact Registry
   - Tag with git SHA

4. **Deploy to Dev** (push to develop)
   - Automatic deployment
   - Helm upgrade
   - Smoke tests

5. **Deploy to Staging** (push to main)
   - Manual approval required (1 person)
   - Helm upgrade
   - Smoke tests + regression tests

6. **Deploy to Production** (after staging)
   - Manual approval required (2 people)
   - 10-minute wait timer
   - Helm upgrade
   - Smoke tests
   - Auto-rollback on failure

### Monitoring CI/CD

```bash
# View GitHub Actions runs
gh run list

# Watch current run
gh run watch

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

---

## Manual Deployment

### Quick Deployment Script

```bash
#!/bin/bash
# Save as: scripts/quick-deploy.sh

set -e

PROJECT_ID="cloud-secrets-manager"
REGION="europe-west10"
NAMESPACE="cloud-secrets-manager"
IMAGE_TAG=$(git rev-parse --short HEAD)

echo "Building images..."
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:${IMAGE_TAG} \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest \
  .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:${IMAGE_TAG}
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest

cd ../audit-service
docker build --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:${IMAGE_TAG} \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest \
  .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:${IMAGE_TAG}
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest

echo "Deploying with Helm..."
cd ../../..
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=${NAMESPACE} \
  --set secretService.image.tag=${IMAGE_TAG} \
  --set auditService.image.tag=${IMAGE_TAG} \
  --wait

echo "Restarting deployments..."
kubectl rollout restart deployment/secret-service -n ${NAMESPACE}
kubectl rollout restart deployment/audit-service -n ${NAMESPACE}

echo "Waiting for rollout..."
kubectl rollout status deployment/secret-service -n ${NAMESPACE}
kubectl rollout status deployment/audit-service -n ${NAMESPACE}

echo "✅ Deployment complete!"
kubectl get pods -n ${NAMESPACE}
```

### Using the Script

```bash
chmod +x scripts/quick-deploy.sh
./scripts/quick-deploy.sh
```

---

## Verification & Testing

### Health Checks

```bash
# Check pod status
kubectl get pods -n ${NAMESPACE}

# Check health endpoints
kubectl port-forward -n ${NAMESPACE} svc/secret-service 8080:8080 &
curl http://localhost:8080/actuator/health

# Check metrics
curl http://localhost:8080/actuator/prometheus | grep -i "http_server_requests"
```

### Log Verification

```bash
# View recent logs
kubectl logs -n ${NAMESPACE} -l app=secret-service -c secret-service --tail=50

# Follow logs
kubectl logs -n ${NAMESPACE} -l app=secret-service -c secret-service -f

# Check for errors
kubectl logs -n ${NAMESPACE} -l app=secret-service -c secret-service | grep -i error
```

### Smoke Tests

```bash
# Run smoke test script
./scripts/smoke-test.sh dev

# Or manual smoke test
kubectl port-forward -n ${NAMESPACE} svc/secret-service 8080:8080 &
sleep 5

# Health check
curl -f http://localhost:8080/actuator/health || exit 1

# Metrics check
curl -f http://localhost:8080/actuator/prometheus || exit 1

echo "✅ Smoke tests passed"
```

### Monitoring Verification

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 &
# Open: http://localhost:9090/targets
# Verify services are UP

# Check Grafana dashboards
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80 &
# Open: http://localhost:3000
# View dashboards
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod for details
kubectl describe pod <pod-name> -n ${NAMESPACE}

# Check events
kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' | tail -20

# Check logs
kubectl logs <pod-name> -n ${NAMESPACE} -c secret-service
kubectl logs <pod-name> -n ${NAMESPACE} -c cloud-sql-proxy
```

### Image Pull Errors

```bash
# Verify image exists
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images

# Check image pull secret
kubectl get secrets -n ${NAMESPACE} | grep image

# Verify Docker authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### Deployment Rollback

```bash
# View rollout history
kubectl rollout history deployment/secret-service -n ${NAMESPACE}

# Rollback to previous version
kubectl rollout undo deployment/secret-service -n ${NAMESPACE}

# Rollback to specific revision
kubectl rollout undo deployment/secret-service --to-revision=2 -n ${NAMESPACE}

# Or use Helm rollback
helm rollback cloud-secrets-manager -n ${NAMESPACE}
helm rollback cloud-secrets-manager <revision> -n ${NAMESPACE}
```

### Database Connection Issues

```bash
# Check Cloud SQL Proxy logs
kubectl logs -n ${NAMESPACE} -l app=secret-service -c cloud-sql-proxy

# Verify Workload Identity
kubectl describe serviceaccount secret-service -n ${NAMESPACE} | grep iam.gke.io

# Check service account permissions
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:secret-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
```

---

## Quick Reference

### Daily Commands

```bash
# Status check
kubectl get pods,svc,deployments -n ${NAMESPACE}

# View logs
kubectl logs -n ${NAMESPACE} -l app=secret-service -c secret-service -f

# Restart service
kubectl rollout restart deployment/secret-service -n ${NAMESPACE}

# Scale service
kubectl scale deployment/secret-service --replicas=2 -n ${NAMESPACE}

# Port forward
kubectl port-forward -n ${NAMESPACE} svc/secret-service 8080:8080

# Helm upgrade
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=${NAMESPACE}
```

### Environment Variables

```bash
# Set once per session
export PROJECT_ID="cloud-secrets-manager"
export REGION="europe-west10"
export CLUSTER_NAME="cloud-secrets-cluster-dev"
export NAMESPACE="cloud-secrets-manager"
export IMAGE_TAG=$(git rev-parse --short HEAD)
```

### Common Workflows

#### Update Application Code

```bash
# 1. Make changes
# 2. Test locally
mvn clean test

# 3. Commit and push
git add .
git commit -m "fix: update feature"
git push origin develop

# 4. CI/CD handles the rest
# Or manually:
./scripts/quick-deploy.sh
```

#### Update Configuration

```bash
# 1. Update Helm values
vi infrastructure/helm/cloud-secrets-manager/values.yaml

# 2. Apply changes
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=${NAMESPACE}

# 3. Restart if needed
kubectl rollout restart deployment/secret-service -n ${NAMESPACE}
```

#### Hotfix Deployment

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make fix and test
# ... make changes ...
mvn clean test

# 3. Build and deploy manually
./scripts/quick-deploy.sh

# 4. Merge back to main and develop
git checkout main
git merge hotfix/critical-fix
git push origin main

git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

---

## Best Practices

### ✅ Do

- Always test locally before pushing
- Use feature branches for changes
- Let CI/CD handle deployments when possible
- Monitor deployments after changes
- Keep Helm values version-controlled
- Use semantic versioning for releases
- Review security scan results

### ❌ Don't

- Push directly to main/develop
- Skip tests
- Deploy without verification
- Ignore security vulnerabilities
- Use `latest` tag in production
- Skip backup before major changes
- Deploy during peak hours (if avoidable)

---

## Monitoring & Alerts

### Check Metrics

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090

# Query metrics
# Open: http://localhost:9090
# Query: up{job=~"secret-service|audit-service"}
```

### Check Alerts

```bash
# View Prometheus alerts
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open: http://localhost:9090/alerts

# Check AlertManager
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
# Open: http://localhost:9093
```

---

## Related Documentation

- [First-Time Deployment](./FIRST_TIME_DEPLOYMENT.md) - Complete initial setup
- [Operations Guide](./operations/OPERATIONS_GUIDE.md) - Day-to-day operations
- [CI/CD Setup](./ci-cd/CI_CD_SETUP.md) - CI/CD configuration
- [Monitoring Setup](./monitoring/MONITORING_SETUP.md) - Monitoring configuration

---

**Last Updated:** December 2024

