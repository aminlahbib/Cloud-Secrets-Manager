# Monitoring Setup for Cloud Secrets Manager

This directory contains monitoring configurations for Prometheus and Grafana.

## Prerequisites

1. **Prometheus Operator** must be installed in your cluster
2. **Grafana** should be deployed (can use the Prometheus Operator's Grafana or standalone)

## Installation

### Option 1: Using Prometheus Operator (Recommended)

If you have Prometheus Operator installed:

```bash
# Apply ServiceMonitors and AlertingRules
kubectl apply -f prometheus-config.yaml
```

### Option 2: Standalone Prometheus

If using standalone Prometheus, you'll need to configure scrape targets manually in your Prometheus configuration.

## ServiceMonitors

The `prometheus-config.yaml` includes ServiceMonitors for:
- **secret-service**: Scrapes metrics from `/actuator/prometheus`
- **audit-service**: Scrapes metrics from `/actuator/prometheus`

## Alerting Rules

The configuration includes alerts for:
- Pod restarts
- High error rates
- High latency
- Database connection failures
- High memory/CPU usage

## Grafana Dashboards

### Importing Dashboards

1. Access Grafana UI
2. Go to **Dashboards** → **Import**
3. Use the dashboard JSON files (to be created) or create custom dashboards

### Key Metrics to Monitor

- **Application Metrics**:
  - Request rate (requests/second)
  - Response time (p50, p95, p99)
  - Error rate (4xx, 5xx)
  - Active connections

- **Infrastructure Metrics**:
  - CPU usage
  - Memory usage
  - Pod restarts
  - Cloud SQL Proxy connections

- **Business Metrics**:
  - Number of secrets stored
  - Audit log entries
  - Authentication attempts

## Accessing Metrics

### Prometheus

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-k8s 9090:9090

# Access at http://localhost:9090
```

### Grafana

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Access at http://localhost:3000
# Default credentials: admin/admin (change on first login)
```

## Spring Boot Actuator Endpoints

Both services expose Prometheus metrics at:
- Secret Service: `http://secret-service:8080/actuator/prometheus`
- Audit Service: `http://audit-service:8081/actuator/prometheus`

These endpoints are already configured in `application.yml` files.

