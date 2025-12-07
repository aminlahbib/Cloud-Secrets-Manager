# Monitoring Stack Deployment Guide

> **Deploy Prometheus, Grafana, and Loki for Cloud Secrets Manager**

---

## Prerequisites

1. **Local Kubernetes Cluster** (one of these):
   - Docker Desktop with Kubernetes enabled
   - minikube
   - kind

2. **Helm 3.x** installed

3. **kubectl** configured to connect to your cluster

---

## Quick Start (5 minutes)

### Step 1: Start Local Kubernetes

**Docker Desktop:**
1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"
5. Wait for Kubernetes to start (green icon)

**Or minikube:**
```bash
minikube start --cpus=4 --memory=8192
```

### Step 2: Verify Cluster

```bash
kubectl cluster-info
kubectl get nodes
```

### Step 3: Deploy Monitoring Stack

```bash
cd infrastructure/monitoring

# Run the deployment script
./deploy-monitoring.sh
```

---

## Manual Deployment Steps

If you prefer to deploy step-by-step:

### 1. Add Helm Repositories

```bash
# Add Prometheus community repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Add Grafana repo
helm repo add grafana https://grafana.github.io/helm-charts

# Update repos
helm repo update
```

### 2. Create Monitoring Namespace

```bash
kubectl create namespace monitoring
```

### 3. Deploy Prometheus + Grafana (kube-prometheus-stack)

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=7d \
  --set alertmanager.enabled=true
```

### 4. Deploy Loki + Promtail

```bash
cd infrastructure/helm

helm install loki grafana/loki-stack \
  --namespace monitoring \
  -f loki-stack-values.yaml
```

### 5. Apply Custom ServiceMonitors

```bash
kubectl apply -f infrastructure/monitoring/servicemonitors/
```

### 6. Apply Alert Rules

```bash
kubectl apply -f infrastructure/monitoring/alerts/
```

---

## Accessing Dashboards

### Grafana

```bash
# Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open in browser
open http://localhost:3000

# Login
# Username: admin
# Password: admin (or as set during install)
```

### Prometheus

```bash
# Port forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open in browser
open http://localhost:9090
```

### Loki (via Grafana)

1. Open Grafana at http://localhost:3000
2. Go to Connections → Data Sources
3. Add Loki data source: `http://loki:3100`
4. Go to Explore and select Loki

---

## Verify Deployment

### Check All Pods

```bash
kubectl get pods -n monitoring
```

Expected output:
```
NAME                                                     READY   STATUS    
alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   
loki-0                                                   1/1     Running   
loki-promtail-xxxxx                                      1/1     Running   
prometheus-grafana-xxxxx                                 3/3     Running   
prometheus-kube-prometheus-operator-xxxxx                1/1     Running   
prometheus-prometheus-kube-prometheus-prometheus-0       2/2     Running   
```

### Test Prometheus Targets

```bash
# Port forward and check targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090 &
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'
```

### Test Loki

```bash
# Check Loki is receiving logs
kubectl port-forward -n monitoring svc/loki 3100:3100 &
curl -s http://localhost:3100/ready
```

---

## Adding CSM Application Monitoring

Once the monitoring stack is running, deploy the CSM services and they'll be auto-discovered.

### Deploy CSM with Helm

```bash
cd infrastructure/helm/cloud-secrets-manager

# Create namespace
kubectl create namespace csm

# Install CSM
helm install csm . -n csm \
  --set postgres.enabled=true \
  --set cloudSql.enabled=false \
  --set monitoring.enabled=true

# Verify ServiceMonitors can find the services
kubectl get servicemonitors -n monitoring
```

---

## Troubleshooting

### Prometheus not scraping CSM services

1. Check ServiceMonitor labels match:
```bash
kubectl get servicemonitor -n monitoring -o yaml | grep -A5 selector
```

2. Verify pods have correct labels:
```bash
kubectl get pods -n csm --show-labels
```

### Loki not receiving logs

1. Check Promtail is running:
```bash
kubectl get pods -n monitoring -l app=promtail
kubectl logs -n monitoring -l app=promtail
```

2. Verify Promtail can reach Loki:
```bash
kubectl exec -n monitoring -it $(kubectl get pods -n monitoring -l app=promtail -o jsonpath='{.items[0].metadata.name}') -- wget -O- http://loki:3100/ready
```

### Grafana dashboard not loading

1. Check Grafana pod:
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
```

2. Verify data sources:
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Then check Settings → Data Sources in Grafana UI
```

---

## Cleanup

To remove the monitoring stack:

```bash
helm uninstall prometheus -n monitoring
helm uninstall loki -n monitoring
kubectl delete namespace monitoring
```

---

## Next Steps

1. Import custom dashboards for CSM services
2. Configure alerting channels (Slack, PagerDuty, Email)
3. Set up log retention policies
4. Create recording rules for SLOs

---

*Last Updated: December 2025*
