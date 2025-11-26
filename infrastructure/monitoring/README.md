# Monitoring Infrastructure

This directory contains monitoring and observability configurations for production deployment.

## Contents

```
monitoring/
├── alerts/                 # Prometheus alerting rules
│   └── prometheus-rules.yaml
├── dashboards/            # Grafana dashboards
│   ├── jvm-database-dashboard.json
│   └── overview-dashboard.json
├── grafana/               # Grafana configuration
│   └── dashboard-configmap.yaml
├── servicemonitors/       # Prometheus ServiceMonitors
│   ├── audit-service-monitor.yaml
│   └── secret-service-monitor.yaml
└── tracing/               # Distributed tracing (Tempo)
    └── tempo-deployment.yaml
```

## Components

### Prometheus
- Metrics collection
- Alerting rules for SLOs
- ServiceMonitors for auto-discovery

### Grafana
- Pre-built dashboards
- JVM metrics visualization
- Database performance monitoring

### Tempo (Optional)
- Distributed tracing
- Request flow visualization

## Deployment

These configurations are deployed to Kubernetes via Helm or kubectl.

See `infrastructure/kubernetes/` for deployment manifests.

