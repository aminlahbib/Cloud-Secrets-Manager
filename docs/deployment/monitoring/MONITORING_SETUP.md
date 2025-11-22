# Monitoring & Observability Setup Guide

**Complete guide for deploying and configuring monitoring, metrics, tracing, and alerting**

**Version:** 1.0  
**Last Updated:** November 22, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deploy Monitoring Stack](#deploy-monitoring-stack)
4. [Deploy Tracing Backend](#deploy-tracing-backend)
5. [Configure Services](#configure-services)
6. [Deploy Service Monitors](#deploy-service-monitors)
7. [Deploy Alerting Rules](#deploy-alerting-rules)
8. [Configure Grafana Dashboards](#configure-grafana-dashboards)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Cloud Secrets Manager observability stack includes:

- **📊 Prometheus** - Metrics collection and alerting
- **📈 Grafana** - Dashboards and visualization
- **🔍 Tempo** - Distributed tracing
- **🔔 AlertManager** - Alert routing and notification
- **📝 OpenTelemetry** - Instrumentation and telemetry

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Applications   │────▶│   Prometheus     │────▶│   Grafana   │
│  (Services)     │     │  (Metrics & SLOs)│     │ (Dashboards)│
└─────────────────┘     └──────────────────┘     └─────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │  AlertManager    │
         │              │  (Notifications) │
         │              └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Tempo (Traces) │
│  (Distributed)  │
└─────────────────┘
```

---

## Prerequisites

### Required

- ✅ Kubernetes cluster with monitoring namespace
- ✅ Helm 3.x installed
- ✅ kubectl configured
- ✅ Cloud Secrets Manager services deployed

### Optional

- Persistent storage for Prometheus (recommended for production)
- Ingress controller for external access
- TLS certificates for secure access

---

## Deploy Monitoring Stack

### Step 1: Install Prometheus Operator

```bash
# Add Prometheus community helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install Prometheus Operator (kube-prometheus-stack)
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.enabled=true \
  --set grafana.adminPassword=admin \
  --wait
```

### Step 2: Verify Prometheus Operator

```bash
# Check all pods are running
kubectl get pods -n monitoring

# Expected output:
# prometheus-operator-...
# prometheus-prometheus-...
# prometheus-grafana-...
# alertmanager-...
```

### Step 3: Access Grafana

```bash
# Port forward to access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open browser: http://localhost:3000
# Username: admin
# Password: admin (or what you set)
```

---

## Deploy Tracing Backend

### Step 1: Deploy Tempo

```bash
# Deploy Tempo for distributed tracing
kubectl apply -f monitoring/tracing/tempo-deployment.yaml

# Verify deployment
kubectl get pods -n tracing
kubectl get svc -n tracing
```

### Step 2: Configure Grafana Data Source

1. Open Grafana (http://localhost:3000)
2. Go to **Configuration** → **Data Sources**
3. Click **Add data source**
4. Select **Tempo**
5. Configure:
   - **URL:** `http://tempo.tracing.svc.cluster.local:3200`
   - **Name:** `Tempo`
6. Click **Save & Test**

---

## Configure Services

### Step 1: Update Application Configuration

The observability configuration is already included in the services:
- `apps/backend/secret-service/src/main/resources/application-observability.yml`
- `apps/backend/audit-service/src/main/resources/application-observability.yml`

### Step 2: Enable Observability Profile

Update Helm values to enable observability:

```yaml
# infrastructure/helm/cloud-secrets-manager/values.yaml

secretService:
  env:
    - name: SPRING_PROFILES_ACTIVE
      value: "prod,observability"
    - name: ENVIRONMENT
      value: "production"
    - name: APP_VERSION
      value: "1.0.0"

auditService:
  env:
    - name: SPRING_PROFILES_ACTIVE
      value: "prod,observability"
    - name: ENVIRONMENT
      value: "production"
    - name: APP_VERSION
      value: "1.0.0"
```

### Step 3: Redeploy Services

```bash
helm upgrade cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --namespace cloud-secrets-manager \
  --values ./infrastructure/helm/cloud-secrets-manager/values.yaml \
  --wait
```

---

## Deploy Service Monitors

ServiceMonitors tell Prometheus where to scrape metrics:

```bash
# Deploy ServiceMonitors
kubectl apply -f monitoring/servicemonitors/secret-service-monitor.yaml
kubectl apply -f monitoring/servicemonitors/audit-service-monitor.yaml

# Verify ServiceMonitors
kubectl get servicemonitors -n cloud-secrets-manager

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open: http://localhost:9090/targets
# Look for: secret-service and audit-service (should be UP)
```

---

## Deploy Alerting Rules

### Step 1: Deploy Prometheus Rules

```bash
# Deploy alert rules
kubectl apply -f monitoring/alerts/prometheus-rules.yaml

# Verify rules are loaded
kubectl get prometheusrules -n monitoring

# Check in Prometheus UI
# Open: http://localhost:9090/alerts
# You should see all defined alerts
```

### Step 2: Configure AlertManager (Optional)

To receive alert notifications (Slack, Email, PagerDuty):

```yaml
# Create alertmanager-config.yaml
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
    
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      routes:
      - match:
          severity: critical
        receiver: 'critical-alerts'
    
    receivers:
    - name: 'default'
      # Add your notification method here
    
    - name: 'critical-alerts'
      # Slack example:
      # slack_configs:
      # - api_url: 'YOUR_SLACK_WEBHOOK_URL'
      #   channel: '#alerts'
      #   title: 'Critical Alert: {{ .GroupLabels.alertname }}'
```

Apply configuration:
```bash
kubectl apply -f alertmanager-config.yaml
```

---

## Configure Grafana Dashboards

### Step 1: Import Dashboards

```bash
# Apply dashboard ConfigMaps
kubectl create configmap csm-overview-dashboard \
  --from-file=monitoring/grafana/dashboards/overview-dashboard.json \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap csm-jvm-db-dashboard \
  --from-file=monitoring/grafana/dashboards/jvm-database-dashboard.json \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Label the ConfigMaps for Grafana auto-discovery
kubectl label configmap csm-overview-dashboard \
  grafana_dashboard=1 -n monitoring

kubectl label configmap csm-jvm-db-dashboard \
  grafana_dashboard=1 -n monitoring
```

### Step 2: Access Dashboards

1. Open Grafana: http://localhost:3000
2. Go to **Dashboards** → **Browse**
3. You should see:
   - Cloud Secrets Manager - Overview & SLOs
   - Cloud Secrets Manager - JVM & Database

---

## Verification

### Step 1: Verify Metrics Collection

```bash
# Check Prometheus targets are UP
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open: http://localhost:9090/targets

# Run test queries in Prometheus
# Query: up{job=~"secret-service|audit-service"}
# Should return: 1 (UP)

# Query: http_server_requests_seconds_count
# Should return metrics
```

### Step 2: Verify Tracing

```bash
# Port forward Tempo Query UI
kubectl port-forward -n tracing svc/tempo-query 16686:16686

# Open: http://localhost:16686
# Select service: secret-service or audit-service
# Click "Find Traces"
```

### Step 3: Run Synthetic Load Test

```bash
# Generate test traffic to validate metrics
./scripts/synthetic-load-test.sh staging 300 10

# After test, check:
# 1. Grafana dashboards show increased traffic
# 2. Latency metrics are collected
# 3. No alerts fired (unless testing thresholds)
```

### Step 4: Test Alerting

To test that alerts work:

```bash
# Option 1: Trigger a test alert manually
kubectl delete pod -n cloud-secrets-manager -l app=secret-service

# This should trigger "ServiceDown" alert after 1 minute
# Check in Prometheus: http://localhost:9090/alerts

# Option 2: Generate errors to test error rate alert
# (Requires test endpoint or manual error injection)
```

---

## Troubleshooting

### Issue 1: Prometheus Not Scraping Services

**Symptoms:** Targets show as DOWN in Prometheus

**Solutions:**

```bash
# 1. Check ServiceMonitor exists
kubectl get servicemonitors -n cloud-secrets-manager

# 2. Check Service labels match ServiceMonitor selector
kubectl get svc -n cloud-secrets-manager --show-labels

# 3. Check Prometheus has permissions
kubectl get clusterrole prometheus

# 4. Check service endpoints
kubectl get endpoints -n cloud-secrets-manager

# 5. Test metrics endpoint manually
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager
curl http://localhost:8080/actuator/prometheus
```

### Issue 2: No Metrics in Grafana

**Symptoms:** Dashboards show "No Data"

**Solutions:**

```bash
# 1. Verify Prometheus data source configured
# Grafana → Configuration → Data Sources → Prometheus

# 2. Check Prometheus is collecting metrics
# Run query in Prometheus UI: up

# 3. Verify time range in Grafana
# Adjust time range to last 5-15 minutes

# 4. Check dashboard queries
# Edit panel → Check PromQL query is correct
```

### Issue 3: Traces Not Appearing

**Symptoms:** No traces in Tempo/Jaeger UI

**Solutions:**

```bash
# 1. Check Tempo is running
kubectl get pods -n tracing

# 2. Verify services can reach Tempo
kubectl exec -it <pod-name> -n cloud-secrets-manager -- \
  curl http://tempo.tracing.svc.cluster.local:3200/ready

# 3. Check application logs for OTLP export errors
kubectl logs -n cloud-secrets-manager -l app=secret-service | grep -i otlp

# 4. Verify sampling probability is > 0
# Check application-observability.yml: sampling.probability
```

### Issue 4: Alerts Not Firing

**Symptoms:** Expected alerts don't trigger

**Solutions:**

```bash
# 1. Check alert rules are loaded
kubectl get prometheusrules -n monitoring

# 2. Check alert definition in Prometheus
# Open: http://localhost:9090/alerts
# Verify alert exists and shows correct state

# 3. Check AlertManager is running
kubectl get pods -n monitoring | grep alertmanager

# 4. Test alert manually
# Prometheus UI → Alerts → Click alert → "Execute"

# 5. Check AlertManager config
kubectl get secret -n monitoring \
  alertmanager-prometheus-kube-prometheus-alertmanager \
  -o jsonpath='{.data.alertmanager\.yaml}' | base64 -d
```

---

## Production Considerations

### High Availability

For production, configure HA:

```bash
# Prometheus HA
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  --set prometheus.prometheusSpec.replicas=2 \
  -n monitoring

# Alertmanager HA
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  --set alertmanager.alertmanagerSpec.replicas=3 \
  -n monitoring

# Tempo HA (requires object storage)
# See Tempo documentation for S3/GCS configuration
```

### Persistent Storage

```yaml
# Configure persistent volumes for Prometheus
prometheus:
  prometheusSpec:
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: standard
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi
```

### Security

```bash
# 1. Enable authentication in Grafana
# Set strong admin password

# 2. Use TLS for all endpoints
# Configure Ingress with cert-manager

# 3. Restrict access with NetworkPolicies
kubectl apply -f monitoring/network-policies/

# 4. Use RBAC for Prometheus
# Already included in kube-prometheus-stack
```

### Retention

```yaml
# Configure data retention
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: "45GB"
```

---

## Monitoring Checklist

### Initial Setup

- ✅ Prometheus Operator installed
- ✅ Grafana accessible
- ✅ Tempo deployed
- ✅ ServiceMonitors created
- ✅ Alert rules deployed
- ✅ Dashboards imported
- ✅ AlertManager configured (optional)

### Verification

- ✅ Prometheus targets showing UP
- ✅ Metrics visible in Grafana dashboards
- ✅ Traces visible in Tempo/Jaeger UI
- ✅ Alerts defined in Prometheus
- ✅ Synthetic load test passes
- ✅ SLO metrics calculated correctly

### Operations

- ✅ Alert notifications working
- ✅ Runbooks documented
- ✅ SLOs defined and measured
- ✅ Team trained on dashboards
- ✅ Incident response procedures documented

---

## Summary

You now have a complete observability stack:

**✅ Metrics:** Prometheus scraping both services  
**✅ Dashboards:** Grafana showing SLOs and key metrics  
**✅ Tracing:** Tempo collecting distributed traces  
**✅ Alerting:** Prometheus rules with SLO-based alerts  
**✅ Documentation:** Runbooks and SLO definitions  
**✅ Testing:** Synthetic load test script  

---

## Related Documentation

- [SLOs & Error Budgets](./SLOS_AND_ERROR_BUDGETS.md)
- [Runbooks](./RUNBOOKS.md)
- [Operations Guide](../OPERATIONS_GUIDE.md)
- [Prometheus Rules](../../monitoring/alerts/prometheus-rules.yaml)
- [Grafana Dashboards](../../monitoring/grafana/dashboards/)

---

**Questions or Issues?**

- Check [Troubleshooting](#troubleshooting) section
- Review [Runbooks](./RUNBOOKS.md) for common scenarios
- Check Prometheus/Grafana documentation

---

**Last Updated:** November 22, 2025

