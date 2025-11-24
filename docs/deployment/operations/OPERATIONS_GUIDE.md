# Operations Guide - Cloud Secrets Manager

Complete guide for managing and operating the Cloud Secrets Manager deployment on GKE.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Monitoring & Health Checks](#monitoring--health-checks)
3. [Scaling Operations](#scaling-operations)
4. [Update & Rollout Management](#update--rollout-management)
5. [Log Management](#log-management)
6. [Resource Management](#resource-management)
7. [Database Operations](#database-operations)
8. [Troubleshooting Commands](#troubleshooting-commands)
9. [Backup & Recovery](#backup--recovery)
10. [Security Operations](#security-operations)

---

## Quick Start

### Connect to Cluster

```bash
gcloud container clusters get-credentials cloud-secrets-cluster-dev \
  --region europe-west10 \
  --project cloud-secrets-manager
```

### Check Overall Status

```bash
# All resources in namespace
kubectl get all -n cloud-secrets-manager

# Pod status
kubectl get pods -n cloud-secrets-manager

# Service status
kubectl get svc -n cloud-secrets-manager

# Deployment status
kubectl get deployments -n cloud-secrets-manager
```

---

## Monitoring & Health Checks

### Pod Health

```bash
# Check pod status
kubectl get pods -n cloud-secrets-manager

# Detailed pod information
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Check pod events
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp'

# Watch pods in real-time
kubectl get pods -n cloud-secrets-manager -w
```

### Application Health Endpoints

```bash
# Port-forward to access health endpoints
kubectl port-forward -n cloud-secrets-manager \
  svc/csm-secret-service 8080:8080

# In another terminal, check health
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/health/liveness
curl http://localhost:8080/actuator/health/readiness

# Check metrics
curl http://localhost:8080/actuator/metrics
curl http://localhost:8080/actuator/prometheus
```

### Resource Usage

```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods -n cloud-secrets-manager

# Resource usage by container
kubectl top pods -n cloud-secrets-manager --containers
```

### Deployment Status

```bash
# Check rollout status
kubectl rollout status deployment/csm-secret-service -n cloud-secrets-manager
kubectl rollout status deployment/csm-audit-service -n cloud-secrets-manager

# View rollout history
kubectl rollout history deployment/csm-secret-service -n cloud-secrets-manager

# View specific revision
kubectl rollout history deployment/csm-secret-service -n cloud-secrets-manager --revision=2
```

---

## Scaling Operations

### Horizontal Scaling (Replicas)

```bash
# Scale secret-service to 3 replicas
kubectl scale deployment csm-secret-service --replicas=3 -n cloud-secrets-manager

# Scale audit-service to 2 replicas
kubectl scale deployment csm-audit-service --replicas=2 -n cloud-secrets-manager

# Check scaling status
kubectl get deployment csm-secret-service -n cloud-secrets-manager
kubectl get pods -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service
```

### Vertical Scaling (Resources)

Edit the deployment manifest to change resource requests/limits:

```bash
# Edit deployment
kubectl edit deployment csm-secret-service -n cloud-secrets-manager

# Or apply updated manifest
kubectl apply -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
```

**Example resource changes:**
```yaml
resources:
  requests:
    memory: "1Gi"    # Increased from 512Mi
    cpu: "500m"      # Increased from 300m
  limits:
    memory: "2Gi"    # Increased from 1Gi
    cpu: "2000m"     # Increased from 1000m
```

### Auto-scaling

```bash
# Create HorizontalPodAutoscaler
kubectl autoscale deployment csm-secret-service \
  --cpu-percent=70 \
  --min=1 \
  --max=5 \
  -n cloud-secrets-manager

# Check HPA status
kubectl get hpa -n cloud-secrets-manager

# Describe HPA
kubectl describe hpa csm-secret-service -n cloud-secrets-manager
```

---

## Update & Rollout Management

### Rolling Update (Default)

```bash
# Update image tag
kubectl set image deployment/csm-secret-service \
  secret-service=europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:v1.1.0 \
  -n cloud-secrets-manager

# Monitor rollout
kubectl rollout status deployment/csm-secret-service -n cloud-secrets-manager

# Watch pods during update
kubectl get pods -n cloud-secrets-manager -w
```

### Restart Deployment

```bash
# Restart to pick up new secrets/config changes
kubectl rollout restart deployment/csm-secret-service -n cloud-secrets-manager
kubectl rollout restart deployment/csm-audit-service -n cloud-secrets-manager
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/csm-secret-service -n cloud-secrets-manager

# Rollback to previous version
kubectl rollout undo deployment/csm-secret-service -n cloud-secrets-manager

# Rollback to specific revision
kubectl rollout undo deployment/csm-secret-service --to-revision=2 -n cloud-secrets-manager
```

### Pause/Resume Rollout

```bash
# Pause rollout (useful for canary deployments)
kubectl rollout pause deployment/csm-secret-service -n cloud-secrets-manager

# Resume rollout
kubectl rollout resume deployment/csm-secret-service -n cloud-secrets-manager
```

---

## Log Management

### View Logs

```bash
# Secret service logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c secret-service \
  --tail=100

# Audit service logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=audit-service \
  -c audit-service \
  --tail=100

# Cloud SQL Proxy logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c cloud-sql-proxy \
  --tail=50

# Follow logs (stream)
kubectl logs -f -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c secret-service

# Logs from previous container (if crashed)
kubectl logs -n cloud-secrets-manager \
  <pod-name> \
  -c secret-service \
  --previous
```

### Log Aggregation

```bash
# All pods logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/part-of=cloud-secrets-manager \
  --all-containers=true \
  --tail=50

# Export logs to file
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c secret-service \
  --tail=1000 > secret-service-logs.txt
```

### Google Cloud Logging

```bash
# View logs in Cloud Logging
gcloud logging read "resource.type=k8s_container AND \
  resource.labels.cluster_name=cloud-secrets-cluster-dev AND \
  resource.labels.namespace_name=cloud-secrets-manager" \
  --limit=50 \
  --format=json

# Stream logs
gcloud logging tail "resource.type=k8s_container AND \
  resource.labels.cluster_name=cloud-secrets-cluster-dev AND \
  resource.labels.namespace_name=cloud-secrets-manager"
```

---

## Resource Management

### View Resources

```bash
# All resources in namespace
kubectl get all -n cloud-secrets-manager

# Specific resource types
kubectl get deployments -n cloud-secrets-manager
kubectl get services -n cloud-secrets-manager
kubectl get secrets -n cloud-secrets-manager
kubectl get configmaps -n cloud-secrets-manager
kubectl get serviceaccounts -n cloud-secrets-manager
kubectl get ingress -n cloud-secrets-manager
```

### Describe Resources

```bash
# Describe deployment
kubectl describe deployment csm-secret-service -n cloud-secrets-manager

# Describe service
kubectl describe svc csm-secret-service -n cloud-secrets-manager

# Describe secret
kubectl describe secret csm-app-config -n cloud-secrets-manager
```

### Edit Resources

```bash
# Edit deployment (opens in default editor)
kubectl edit deployment csm-secret-service -n cloud-secrets-manager

# Edit service
kubectl edit svc csm-secret-service -n cloud-secrets-manager
```

### Delete Resources

```bash
# Delete specific pod (will be recreated by deployment)
kubectl delete pod <pod-name> -n cloud-secrets-manager

# Delete all pods with label (will be recreated)
kubectl delete pods -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service

# Delete deployment (removes pods and service)
kubectl delete deployment csm-secret-service -n cloud-secrets-manager
```

---

## Database Operations

### Cloud SQL Proxy Status

```bash
# Check Cloud SQL Proxy logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c cloud-sql-proxy \
  --tail=20

# Verify connection
kubectl exec -n cloud-secrets-manager \
  <pod-name> \
  -c cloud-sql-proxy \
  -- ps aux | grep cloud-sql-proxy
```

### Database Connection Test

```bash
# Port-forward Cloud SQL Proxy
kubectl port-forward -n cloud-secrets-manager \
  <pod-name> 5432:5432

# In another terminal, test connection
psql -h localhost -p 5432 -U secrets_db_user -d secrets_db
```

### Database Backup

```bash
# Create Cloud SQL backup
gcloud sql backups create \
  --instance=secrets-manager-db-dev-3631da18

# List backups
gcloud sql backups list \
  --instance=secrets-manager-db-dev-3631da18

# Restore from backup
gcloud sql backups restore <backup-id> \
  --backup-instance=secrets-manager-db-dev-3631da18
```

---

## Troubleshooting Commands

### Pod Issues

```bash
# Describe pod (shows events and status)
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Get pod events
kubectl get events -n cloud-secrets-manager \
  --field-selector involvedObject.name=<pod-name> \
  --sort-by='.lastTimestamp'

# Execute command in pod
kubectl exec -it <pod-name> -n cloud-secrets-manager -c secret-service -- /bin/sh

# Check environment variables
kubectl exec <pod-name> -n cloud-secrets-manager -c secret-service -- env
```

### Network Issues

```bash
# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n cloud-secrets-manager -- \
  wget -O- http://csm-secret-service:8080/actuator/health

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n cloud-secrets-manager -- \
  nslookup csm-secret-service
```

### Resource Issues

```bash
# Check node resources
kubectl describe nodes

# Check pod resource requests vs limits
kubectl describe pod <pod-name> -n cloud-secrets-manager | grep -A 10 "Limits\|Requests"

# Check resource quotas
kubectl describe quota -n cloud-secrets-manager
```

### Configuration Issues

```bash
# Verify secrets exist
kubectl get secrets -n cloud-secrets-manager

# Check secret values (base64 encoded)
kubectl get secret csm-app-config -n cloud-secrets-manager -o yaml

# Verify service account
kubectl describe serviceaccount secret-service -n cloud-secrets-manager
```

---

## Backup & Recovery

### Kubernetes Resources Backup

```bash
# Export all resources
kubectl get all -n cloud-secrets-manager -o yaml > backup-$(date +%Y%m%d).yaml

# Export secrets (be careful with sensitive data)
kubectl get secrets -n cloud-secrets-manager -o yaml > secrets-backup-$(date +%Y%m%d).yaml

# Export deployments
kubectl get deployments -n cloud-secrets-manager -o yaml > deployments-backup-$(date +%Y%m%d).yaml
```

### Restore from Backup

```bash
# Restore resources
kubectl apply -f backup-20251122.yaml

# Restore secrets
kubectl apply -f secrets-backup-20251122.yaml
```

### State Management

```bash
# Save current state
kubectl get all,secrets,configmaps -n cloud-secrets-manager -o yaml > state-$(date +%Y%m%d).yaml
```

---

## Security Operations

### Secret Management

```bash
# List secrets
kubectl get secrets -n cloud-secrets-manager

# Update secret
kubectl create secret generic csm-app-config \
  -n cloud-secrets-manager \
  --from-literal=JWT_SECRET="<new-secret>" \
  --from-literal=AES_KEY="<new-key>" \
  --dry-run=client -o yaml | kubectl apply -f -

# Delete secret
kubectl delete secret csm-app-config -n cloud-secrets-manager
```

### Service Account Verification

```bash
# Check service account
kubectl describe serviceaccount secret-service -n cloud-secrets-manager

# Verify Workload Identity binding
gcloud iam service-accounts get-iam-policy \
  secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com
```

### Network Policies

```bash
# List network policies
kubectl get networkpolicies -n cloud-secrets-manager

# Describe network policy
kubectl describe networkpolicy <policy-name> -n cloud-secrets-manager
```

---

## Useful One-Liners

### Quick Status Check

```bash
# Overall health
kubectl get pods,svc,deployments -n cloud-secrets-manager

# Resource usage
kubectl top pods -n cloud-secrets-manager

# Recent events
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp' | tail -10
```

### Quick Actions

```bash
# Restart all pods
kubectl delete pods -n cloud-secrets-manager --all

# Scale all deployments
kubectl scale deployment --all --replicas=2 -n cloud-secrets-manager

# View all logs
kubectl logs -n cloud-secrets-manager --all-containers=true --tail=50 -l app.kubernetes.io/part-of=cloud-secrets-manager
```

---

## Monitoring Dashboards

### Access Metrics

```bash
# Port-forward to access Prometheus metrics
kubectl port-forward -n cloud-secrets-manager \
  svc/csm-secret-service 8080:8080

# Access metrics endpoint
curl http://localhost:8080/actuator/prometheus
```

### Google Cloud Monitoring

```bash
# View metrics in Cloud Monitoring
gcloud monitoring dashboards list

# Query metrics
gcloud monitoring time-series list \
  --filter='metric.type="kubernetes.io/container/cpu/core_usage_time"'
```

---

**Last Updated:** November 22, 2025  
**Maintained by:** Cloud Secrets Manager Team

