# Logging Infrastructure Setup Guide

**Last Updated:** December 5, 2025  
**Status:** Phase 2 Complete - Loki and Promtail Deployed

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Installation Steps](#installation-steps)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## Overview

This guide walks through deploying a centralized logging infrastructure using:
- **Loki**: Log aggregation and storage
- **Promtail**: Log collection from Kubernetes pods
- **Grafana**: Log visualization (to be configured)

The setup is optimized for a university project/proof of concept with minimal resource footprint.

---

## Prerequisites

### Required Tools

- `kubectl` configured for your cluster
- `helm` 3.x installed
- Access to Kubernetes cluster (GKE or Docker Desktop)
- At least 2GB free disk space

### Cluster Requirements

- Kubernetes 1.19+
- At least 1 node with 1 CPU and 1GB RAM available
- Storage class available (hostpath for Docker Desktop, standard for GKE)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Application  │  │ Application  │  │ Application  │     │
│  │    Pod 1     │  │    Pod 2     │  │    Pod 3     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │    Promtail     │                       │
│                   │   (DaemonSet)   │                       │
│                   └────────┬────────┘                       │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │      Loki       │                       │
│                   │  (StatefulSet)  │                       │
│                   └────────┬────────┘                       │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │    Grafana      │                       │
│                   │  (Visualization)│                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Applications write logs to stdout/stderr
2. Promtail collects logs from `/var/log/pods`
3. Promtail adds labels (namespace, pod, service) and forwards to Loki
4. Loki indexes and stores logs
5. Grafana queries Loki for visualization

---

## Installation Steps

### Step 1: Create Logging Namespace

```bash
# Create namespace
kubectl create namespace logging

# Verify
kubectl get namespace logging
```

**Expected Output:**
```
NAME      STATUS   AGE
logging   Active   5s
```

---

### Step 2: Add Grafana Helm Repository

```bash
# Add repository
helm repo add grafana https://grafana.github.io/helm-charts

# Update repositories
helm repo update

# Verify
helm search repo grafana/loki-stack
```

**Expected Output:**
```
NAME                CHART VERSION   APP VERSION   DESCRIPTION
grafana/loki-stack  2.10.3          v2.9.3        Loki: like Prometheus, but for logs.
```

---

### Step 3: Create Loki Configuration

Create `infrastructure/helm/loki-stack-values.yaml`:

```yaml
# Loki Stack Helm Values
loki:
  enabled: true
  persistence:
    enabled: false  # Use emptyDir for dev
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi
  config:
    auth_enabled: false
    limits_config:
      retention_period: 720h  # 30 days
      ingestion_rate_mb: 10
      ingestion_burst_size_mb: 20

promtail:
  enabled: true
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 100m
      memory: 128Mi

# Disable other components
grafana:
  enabled: false
prometheus:
  enabled: false
```

---

### Step 4: Deploy Loki Stack

```bash
# Install Loki and Promtail
helm install loki grafana/loki-stack \
  --namespace logging \
  --values infrastructure/helm/loki-stack-values.yaml

# Watch deployment
kubectl get pods -n logging -w
```

**Expected Output:**
```
NAME                  READY   STATUS    RESTARTS   AGE
loki-0                1/1     Running   0          2m
loki-promtail-xxxxx   1/1     Running   0          2m
```

**Note:** Wait until both pods show `1/1 Running` status (may take 2-3 minutes).

---

### Step 5: Verify Services

```bash
# Check services
kubectl get svc -n logging
```

**Expected Output:**
```
NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
loki              ClusterIP   10.101.241.128   <none>        3100/TCP   5m
loki-headless     ClusterIP   None             <none>        3100/TCP   5m
loki-memberlist   ClusterIP   None             <none>        7946/TCP   5m
```

---

## Verification

### Test 1: Check Loki Health

```bash
# Port-forward Loki service
kubectl port-forward -n logging svc/loki 3100:3100 &

# Test ready endpoint
curl http://localhost:3100/ready
```

**Expected Output:**
```
ready
```

---

### Test 2: Send Test Log

```bash
# Send a test log entry
curl -H "Content-Type: application/json" -XPOST -s "http://localhost:3100/loki/api/v1/push" \
  --data-raw "{\"streams\": [{\"stream\": {\"job\": \"test\", \"service\": \"test-service\"}, \"values\": [[\"$(date +%s)000000000\", \"Test log entry\"]]}]}"
```

**Expected Output:** (empty response = success)

---

### Test 3: Query Logs

```bash
# Query the test log
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="test"}' \
  --data-urlencode "start=$(date -u -v-1H +%s)000000000" \
  --data-urlencode "end=$(date -u +%s)000000000" | jq '.data.result'
```

**Expected Output:**
```json
[
  {
    "stream": {
      "job": "test",
      "service": "test-service"
    },
    "values": [
      ["1764941569000000000", "Test log entry"]
    ]
  }
]
```

---

### Test 4: Check Promtail Logs

```bash
# Get Promtail pod name
PROMTAIL_POD=$(kubectl get pods -n logging -l app=promtail -o jsonpath='{.items[0].metadata.name}')

# Check Promtail logs
kubectl logs -n logging $PROMTAIL_POD --tail=50
```

**Expected Output:** Should show log collection activity without errors.

---

### Test 5: Verify Metrics

```bash
# Check Loki metrics
curl -s http://localhost:3100/metrics | grep loki_ingester_chunks_created_total
```

**Expected Output:**
```
loki_ingester_chunks_created_total 1
```

---

## Troubleshooting

### Issue 1: Pods Stuck in Pending

**Symptoms:**
```
NAME     READY   STATUS    RESTARTS   AGE
loki-0   0/1     Pending   0          5m
```

**Diagnosis:**
```bash
kubectl describe pod loki-0 -n logging | grep -A 5 Events
```

**Common Causes:**

1. **Insufficient Resources**
   ```bash
   # Check node resources
   kubectl describe nodes | grep -A 5 "Allocated resources"
   ```

2. **PVC Not Bound** (if persistence enabled)
   ```bash
   kubectl get pvc -n logging
   ```
   **Solution:** Create PersistentVolume or disable persistence

3. **Node Taints**
   ```bash
   kubectl describe nodes | grep Taints
   ```
   **Solution:** Remove taints or add tolerations

---

### Issue 2: Disk Pressure (Docker Desktop)

**Symptoms:**
```
Warning  FailedScheduling  node(s) had untolerated taint {node.kubernetes.io/disk-pressure}
```

**Solution:**
```bash
# Clean Docker volumes
docker volume prune -f

# Clean Docker system
docker system prune -a -f --volumes

# Remove taint manually
kubectl taint nodes docker-desktop node.kubernetes.io/disk-pressure:NoSchedule-

# Restart pods
kubectl delete pod --all -n logging
```

---

### Issue 3: Loki Not Receiving Logs

**Diagnosis:**
```bash
# Check Promtail logs
kubectl logs -n logging -l app=promtail --tail=100

# Check Loki logs
kubectl logs -n logging loki-0 --tail=100
```

**Common Causes:**

1. **Promtail Can't Reach Loki**
   ```bash
   # Test connectivity from Promtail pod
   kubectl exec -it -n logging <promtail-pod> -- wget -O- http://loki:3100/ready
   ```

2. **Incorrect Loki Address in Promtail Config**
   ```bash
   # Check Promtail config
   kubectl get configmap -n logging loki-promtail -o yaml | grep lokiAddress
   ```

3. **RBAC Permissions**
   ```bash
   # Check Promtail service account
   kubectl get serviceaccount -n logging
   kubectl get clusterrole -n logging
   ```

---

### Issue 4: Query Returns No Results

**Diagnosis:**
```bash
# Check if logs are being ingested
curl -s http://localhost:3100/metrics | grep loki_distributor_lines_received_total
```

**Solutions:**

1. **Check Time Range**
   - Ensure query time range includes when logs were sent
   - Use wider time range: `-v-24H` instead of `-v-1H`

2. **Check Label Selectors**
   ```bash
   # List all label names
   curl -s http://localhost:3100/loki/api/v1/labels | jq
   
   # List values for a label
   curl -s http://localhost:3100/loki/api/v1/label/job/values | jq
   ```

3. **Check Retention Policy**
   - Logs older than 30 days are automatically deleted

---

### Issue 5: High Memory Usage

**Symptoms:**
```
loki-0   1/1     Running   0   OOMKilled
```

**Solution:**
```bash
# Increase memory limits
helm upgrade loki grafana/loki-stack \
  -n logging \
  -f loki-stack-values.yaml \
  --set loki.resources.limits.memory=512Mi

# Or reduce ingestion rate
helm upgrade loki grafana/loki-stack \
  -n logging \
  -f loki-stack-values.yaml \
  --set loki.config.limits_config.ingestion_rate_mb=5
```

---

## Next Steps

### 1. Configure Grafana Data Source

Add Loki as a data source in Grafana:

**URL:** `http://loki.logging.svc.cluster.local:3100`

See [Grafana Configuration Guide](./GRAFANA_LOKI_INTEGRATION.md) (to be created)

---

### 2. Create Dashboards

Import pre-built dashboards or create custom ones:
- Logs Overview Dashboard
- Service-Specific Dashboards
- Error Analysis Dashboard

See [Dashboard Guide](./GRAFANA_DASHBOARDS.md) (to be created)

---

### 3. Configure Alerts

Set up alerts for log patterns:
- High error rate
- Specific error messages
- Service unavailability

See [Alerting Guide](./LOGGING_ALERTS.md) (to be created)

---

### 4. Integrate with Prometheus

Correlate logs with metrics:
- Add log links to Prometheus alerts
- Create unified observability dashboards

See [Integration Guide](./PROMETHEUS_LOKI_INTEGRATION.md) (to be created)

---

## Configuration Files

All configuration files are stored in:
- `infrastructure/helm/loki-stack-values.yaml` - Helm values
- `infrastructure/kubernetes/loki-pv.yaml` - PersistentVolume (if needed)

---

## Useful Commands

```bash
# View Loki logs
kubectl logs -n logging loki-0 -f

# View Promtail logs
kubectl logs -n logging -l app=promtail -f

# Restart Loki
kubectl delete pod loki-0 -n logging

# Restart Promtail
kubectl delete pod -l app=promtail -n logging

# Check Loki configuration
kubectl exec -it -n logging loki-0 -- cat /etc/loki/config/config.yaml

# Port-forward for local access
kubectl port-forward -n logging svc/loki 3100:3100

# Uninstall (if needed)
helm uninstall loki -n logging
kubectl delete namespace logging
```

---

## Resources

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Helm Chart Documentation](https://github.com/grafana/helm-charts/tree/main/charts/loki-stack)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Loki Runbook](./LOGGING_RUNBOOK.md) (to be created)
3. Check Loki GitHub issues: https://github.com/grafana/loki/issues

---

**Status:** ✅ Loki and Promtail deployed and verified  
**Next Phase:** Configure Grafana dashboards and integrate with Prometheus
