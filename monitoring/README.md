# Monitoring & Observability

This directory contains all monitoring, observability, and alerting configurations for Cloud Secrets Manager.

## Directory Structure

```
monitoring/
├── alerts/            # Prometheus alert rules
├── grafana/           # Grafana dashboards and configuration
├── prometheus/        # Prometheus configuration (if needed)
├── servicemonitors/   # Prometheus ServiceMonitor resources
└── tracing/           # Distributed tracing configuration (Grafana Tempo)
```

## Components

### 🚨 `alerts/`
Prometheus alert rules for monitoring service health and performance:
- **`prometheus-rules.yaml`** - Alert definitions
  - Service availability alerts
  - Error rate thresholds
  - Latency alerts
  - Resource usage alerts
  - Database connection alerts

**Deployment:**
```bash
kubectl apply -f monitoring/alerts/prometheus-rules.yaml
```

### 📊 `grafana/`
Grafana dashboards and configuration:
- **`dashboard-configmap.yaml`** - Kubernetes ConfigMap for dashboards
- **`dashboards/`** - JSON dashboard definitions
  - Service overview dashboard
  - JVM metrics dashboard
  - Database performance dashboard

**Dashboards:**
- **Service Overview** - High-level metrics for all services
- **JVM Metrics** - Java Virtual Machine performance
- **Database Metrics** - PostgreSQL performance and health

**Deployment:**
```bash
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml
```

### 📈 `servicemonitors/`
Prometheus ServiceMonitor resources for scraping metrics:
- **`secret-service-monitor.yaml`** - Metrics scraping for secret-service
- **`audit-service-monitor.yaml`** - Metrics scraping for audit-service

These resources tell Prometheus where to scrape metrics from each service.

**Deployment:**
```bash
kubectl apply -f monitoring/servicemonitors/
```

### 🔍 `tracing/`
Distributed tracing configuration for Grafana Tempo:
- OpenTelemetry configuration
- Trace collection setup
- Trace correlation with logs

**Deployment:**
```bash
kubectl apply -f monitoring/tracing/
```

## Metrics & Alerts

### Key Metrics Monitored

#### Service Metrics
- **Request Rate** - Requests per second
- **Error Rate** - Percentage of failed requests
- **Latency** - P50, P95, P99 response times
- **Availability** - Uptime percentage

#### JVM Metrics
- **Memory Usage** - Heap and non-heap memory
- **GC Performance** - Garbage collection frequency and duration
- **Thread Count** - Active and daemon threads

#### Database Metrics
- **Connection Pool** - Active and idle connections
- **Query Performance** - Slow queries and execution times
- **Database Size** - Table sizes and growth

### Alert Rules

The following alerts are configured:
- **ServiceDown** - Service is unreachable
- **HighErrorRate** - Error rate exceeds threshold
- **HighLatency** - Response time exceeds threshold
- **DatabaseConnectionFailure** - Cannot connect to database
- **HighMemoryUsage** - JVM memory usage too high

## Setup & Deployment

### Prerequisites
- Prometheus Operator installed in Kubernetes cluster
- Grafana deployed and configured
- Grafana Tempo for distributed tracing (optional)

### Full Monitoring Stack Deployment

```bash
# 1. Deploy ServiceMonitors (tells Prometheus what to scrape)
kubectl apply -f monitoring/servicemonitors/

# 2. Deploy Alert Rules
kubectl apply -f monitoring/alerts/prometheus-rules.yaml

# 3. Deploy Grafana Dashboards
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml

# 4. Deploy Tracing Configuration (optional)
kubectl apply -f monitoring/tracing/
```

### Using the Deployment Script

```bash
# Deploy all monitoring resources
./scripts/deploy-monitoring.sh
```

## Accessing Dashboards

### Grafana
1. Port-forward to Grafana service:
   ```bash
   kubectl port-forward svc/grafana 3000:3000 -n monitoring
   ```
2. Open browser: `http://localhost:3000`
3. Default credentials: `admin/admin` (change in production!)

### Prometheus
1. Port-forward to Prometheus service:
   ```bash
   kubectl port-forward svc/prometheus 9090:9090 -n monitoring
   ```
2. Open browser: `http://localhost:9090`

## Service Level Objectives (SLOs)

The following SLOs are monitored:
- **Availability:** 99.9% uptime
- **Latency:** P95 < 500ms
- **Error Rate:** < 0.1%

See [SLOs & Error Budgets](../../docs/deployment/monitoring/SLOS_AND_ERROR_BUDGETS.md) for details.

## Troubleshooting

### Metrics Not Appearing
1. Check ServiceMonitor resources are deployed:
   ```bash
   kubectl get servicemonitors -n cloud-secrets-manager
   ```
2. Verify Prometheus is scraping:
   - Check Prometheus targets: `http://localhost:9090/targets`
   - Look for `secret-service` and `audit-service` targets

### Alerts Not Firing
1. Check alert rules are loaded:
   ```bash
   kubectl get prometheusrules -n cloud-secrets-manager
   ```
2. Verify in Prometheus UI: `http://localhost:9090/alerts`

### Dashboards Not Loading
1. Verify ConfigMap is deployed:
   ```bash
   kubectl get configmap grafana-dashboards -n monitoring
   ```
2. Check Grafana data source configuration

## Related Documentation

- **[Monitoring Setup Guide](../../docs/deployment/monitoring/MONITORING_SETUP.md)** - Complete monitoring setup
- **[Runbooks](../../docs/deployment/monitoring/RUNBOOKS.md)** - Incident response procedures
- **[SLOs & Error Budgets](../../docs/deployment/monitoring/SLOS_AND_ERROR_BUDGETS.md)** - Reliability targets

## Maintenance

- **Adding New Metrics:** Update ServiceMonitor resources
- **New Alerts:** Add to `alerts/prometheus-rules.yaml`
- **Dashboard Updates:** Modify JSON files in `grafana/dashboards/`
- **Tracing Changes:** Update configuration in `tracing/`

---

**Last Updated:** December 2024

