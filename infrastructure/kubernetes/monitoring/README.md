# Monitoring Resources

This directory contains Kubernetes monitoring resources for the Cloud Secrets Manager project.

## ServiceMonitors

ServiceMonitors are custom resources used by Prometheus Operator to discover and scrape metrics from services.

### Loki ServiceMonitor

**File:** `loki-servicemonitor.yaml`

Configures Prometheus to scrape metrics from Loki.

**Metrics Exposed:**
- `loki_ingester_chunks_created_total` - Total chunks created
- `loki_ingester_bytes_received_total` - Total bytes received
- `loki_request_duration_seconds` - Request duration histogram
- `loki_distributor_lines_received_total` - Total log lines received

**Apply:**
```bash
kubectl apply -f loki-servicemonitor.yaml
```

**Verify:**
```bash
# Check ServiceMonitor created
kubectl get servicemonitor -n logging loki

# Check Prometheus targets (if Prometheus Operator is installed)
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open http://localhost:9090/targets and look for loki
```

---

### Promtail ServiceMonitor

**File:** `promtail-servicemonitor.yaml`

Configures Prometheus to scrape metrics from Promtail.

**Metrics Exposed:**
- `promtail_sent_entries_total` - Total log entries sent
- `promtail_dropped_entries_total` - Total log entries dropped
- `promtail_read_bytes_total` - Total bytes read from files
- `promtail_request_duration_seconds` - Request duration histogram

**Apply:**
```bash
kubectl apply -f promtail-servicemonitor.yaml
```

**Verify:**
```bash
# Check ServiceMonitor created
kubectl get servicemonitor -n logging promtail

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open http://localhost:9090/targets and look for promtail
```

---

## Prerequisites

**Prometheus Operator Required:**

ServiceMonitors require Prometheus Operator to be installed in your cluster.

**Install Prometheus Operator:**
```bash
# Add Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack (includes Prometheus Operator)
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

---

## Troubleshooting

### ServiceMonitor Not Discovered

**Check Prometheus Operator logs:**
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus-operator
```

**Check ServiceMonitor labels:**
```bash
kubectl get servicemonitor -n logging loki -o yaml
```

Ensure labels match Prometheus serviceMonitorSelector.

### No Metrics in Prometheus

**Check service exists:**
```bash
kubectl get svc -n logging loki
kubectl get svc -n logging loki-promtail
```

**Check service has correct labels:**
```bash
kubectl get svc -n logging loki -o yaml | grep -A5 labels
```

**Test metrics endpoint directly:**
```bash
# Loki
kubectl port-forward -n logging svc/loki 3100:3100
curl http://localhost:3100/metrics

# Promtail
kubectl port-forward -n logging svc/loki-promtail 3101:3101
curl http://localhost:3101/metrics
```

---

## Key Metrics to Monitor

### Loki Metrics

**Ingestion:**
- `rate(loki_distributor_lines_received_total[5m])` - Log lines per second
- `rate(loki_distributor_bytes_received_total[5m])` - Bytes per second

**Performance:**
- `histogram_quantile(0.99, rate(loki_request_duration_seconds_bucket[5m]))` - 99th percentile latency

**Errors:**
- `rate(loki_ingester_chunks_flushed_total{reason="full"}[5m])` - Chunks flushed due to being full

### Promtail Metrics

**Collection:**
- `rate(promtail_read_bytes_total[5m])` - Bytes read per second
- `rate(promtail_sent_entries_total[5m])` - Entries sent per second

**Errors:**
- `rate(promtail_dropped_entries_total[5m])` - Dropped entries per second
- `promtail_file_bytes_total` - Total bytes in files being tailed

---

## Alert Rules

Example Prometheus alert rules for Loki and Promtail:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: loki-alerts
  namespace: logging
spec:
  groups:
    - name: loki
      interval: 30s
      rules:
        - alert: LokiDown
          expr: up{job="loki"} == 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Loki is down"
            description: "Loki has been down for more than 5 minutes"
        
        - alert: PromtailDown
          expr: up{job="promtail"} == 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Promtail is down"
            description: "Promtail has been down for more than 5 minutes"
        
        - alert: HighLogIngestionRate
          expr: rate(loki_distributor_lines_received_total[5m]) > 10000
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "High log ingestion rate"
            description: "Loki is receiving more than 10k lines per second"
```

---

## References

- [Prometheus Operator Documentation](https://prometheus-operator.dev/)
- [ServiceMonitor Specification](https://prometheus-operator.dev/docs/operator/api/#monitoring.coreos.com/v1.ServiceMonitor)
- [Loki Metrics](https://grafana.com/docs/loki/latest/operations/observability/)
- [Promtail Metrics](https://grafana.com/docs/loki/latest/clients/promtail/configuration/#server)

