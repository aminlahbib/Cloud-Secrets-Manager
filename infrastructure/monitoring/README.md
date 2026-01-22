# Monitoring Infrastructure

This directory contains monitoring and observability configurations for production deployment.

## Deployment Options

### Cloud Run (Primary - Recommended)

**Location:** `cloudrun/`

Cloud Run uses Google Cloud's native monitoring (Cloud Monitoring + Cloud Logging). No additional setup required - metrics are automatically collected.

**Quick Start:**
```bash
# Deploy dashboard
cd cloudrun
gcloud monitoring dashboards create \
  --config-from-file=cloud-monitoring-dashboard.json \
  --project=cloud-secrets-manager

# Deploy alerts
gcloud alpha monitoring policies create \
  --policy-from-file=alert-policy.yaml \
  --project=cloud-secrets-manager
```

**See:** [cloudrun/README.md](./cloudrun/README.md) and [docs/MONITORING_CLOUDRUN.md](../../docs/MONITORING_CLOUDRUN.md)

### GKE (Advanced - Optional)

**Location:** Root directory and subdirectories

For GKE deployments, use Prometheus + Grafana + Loki for advanced monitoring.

**Quick Start:**
```bash
# Deploy the full monitoring stack
./deploy-monitoring.sh
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Contents

```
monitoring/
├── cloudrun/               # Cloud Run monitoring (Primary)
│   ├── README.md
│   ├── cloud-monitoring-dashboard.json
│   └── alert-policy.yaml
├── DEPLOYMENT_GUIDE.md     # GKE monitoring guide
├── deploy-monitoring.sh    # GKE monitoring deployment
├── alerts/                 # Prometheus alerting rules (GKE)
│   └── prometheus-rules.yaml
├── grafana/                # Grafana configuration (GKE)
│   └── dashboard-configmap.yaml
├── servicemonitors/        # Prometheus ServiceMonitors (GKE)
│   ├── audit-service-monitor.yaml
│   └── secret-service-monitor.yaml
└── tracing/                # Distributed tracing (GKE)
    └── tempo-deployment.yaml
```

## Components

### Cloud Run Monitoring (Primary)
- **Cloud Monitoring:** Native GCP monitoring with automatic metrics
- **Cloud Logging:** Centralized log aggregation
- **Dashboards:** Pre-configured dashboards for all services
- **Alerts:** Error rate, latency, memory, availability

### GKE Monitoring (Advanced/Optional)
- **Prometheus + Grafana:** Metrics collection and visualization
- **Loki + Promtail:** Log aggregation with LogQL
- **Tempo:** Distributed tracing (optional)
- **ServiceMonitors:** Auto-discovery of services

## Access

After deployment:

```bash
# Grafana (admin/admin)
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

