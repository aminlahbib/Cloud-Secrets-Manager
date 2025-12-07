# Monitoring Infrastructure

This directory contains monitoring and observability configurations for production deployment.

## Quick Start

```bash
# Deploy the full monitoring stack
./deploy-monitoring.sh
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Contents

```
monitoring/
├── DEPLOYMENT_GUIDE.md     # Step-by-step deployment guide
├── deploy-monitoring.sh    # Automated deployment script
├── alerts/                 # Prometheus alerting rules
│   └── prometheus-rules.yaml
├── grafana/                # Grafana configuration
│   └── dashboard-configmap.yaml
├── servicemonitors/        # Prometheus ServiceMonitors
│   ├── audit-service-monitor.yaml
│   └── secret-service-monitor.yaml
└── tracing/                # Distributed tracing (Tempo)
    └── tempo-deployment.yaml
```

## Components

### Prometheus + Grafana (kube-prometheus-stack)
- Metrics collection and visualization
- Alerting rules for SLOs
- ServiceMonitors for auto-discovery

### Loki + Promtail (loki-stack)
- Log aggregation
- LogQL queries
- 30-day retention

### Tempo (Optional)
- Distributed tracing
- Request flow visualization

## Access

After deployment:

```bash
# Grafana (admin/admin)
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

