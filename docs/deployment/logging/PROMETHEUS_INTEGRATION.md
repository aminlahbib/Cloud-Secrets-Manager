# Prometheus Integration for Loki & Promtail

This guide covers integrating Loki and Promtail with Prometheus for comprehensive monitoring.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy ServiceMonitors](#deploy-servicemonitors)
3. [Deploy Alert Rules](#deploy-alert-rules)
4. [Verify Integration](#verify-integration)
5. [Key Metrics](#key-metrics)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Components

- ✅ Loki deployed and running
- ✅ Promtail deployed and running
- ⚠️ Prometheus Operator installed
- ⚠️ Prometheus instance running

### Install Prometheus Operator

If you don't have Prometheus Operator installed:

```bash
# Add Prometheus community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

**Note:** The `serviceMonitorSelectorNilUsesHelmValues=false` flag allows Prometheus to discover ServiceMonitors in all namespaces.

---

## Deploy ServiceMonitors

ServiceMonitors tell Prometheus how to scrape metrics from Loki and Promtail.

### 1. Deploy Loki ServiceMonitor

```bash
kubectl apply -f infrastructure/kubernetes/monitoring/loki-servicemonitor.yaml
```

**Expected Output:**
```
servicemonitor.monitoring.coreos.com/loki created
```

**Verify:**
```bash
kubectl get servicemonitor -n logging loki
```

### 2. Deploy Promtail ServiceMonitor

```bash
kubectl apply -f infrastructure/kubernetes/monitoring/promtail-servicemonitor.yaml
```

**Expected Output:**
```
servicemonitor.monitoring.coreos.com/promtail created
```

**Verify:**
```bash
kubectl get servicemonitor -n logging promtail
```

---

## Deploy Alert Rules

Alert rules define conditions that trigger alerts in Prometheus.

### 1. Deploy Loki Alert Rules

```bash
kubectl apply -f infrastructure/kubernetes/monitoring/loki-prometheus-rules.yaml
```

**Expected Output:**
```
prometheusrule.monitoring.coreos.com/loki-alerts created
```

**Verify:**
```bash
kubectl get prometheusrule -n logging loki-alerts
```

### 2. View Alert Rules

```bash
kubectl get prometheusrule -n logging loki-alerts -o yaml
```

---

## Verify Integration

### 1. Check Prometheus Targets

Port-forward to Prometheus:

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Open browser: http://localhost:9090/targets

**Look for:**
- `serviceMonitor/logging/loki/0` - Should be UP
- `serviceMonitor/logging/promtail/0` - Should be UP

### 2. Query Loki Metrics

In Prometheus UI (http://localhost:9090), try these queries:

**Loki is up:**
```promql
up{job="loki"}
```

**Log ingestion rate:**
```promql
rate(loki_distributor_lines_received_total[5m])
```

**Promtail is sending logs:**
```promql
rate(promtail_sent_entries_total[5m])
```

### 3. Check Alert Rules

In Prometheus UI, go to: Status → Rules

**Look for:**
- `loki.rules` group with 9 alert rules
- `loki.recording` group with 7 recording rules

### 4. View Active Alerts

In Prometheus UI, go to: Alerts

**Check for:**
- No firing alerts (if everything is healthy)
- Alert definitions are loaded

---

## Key Metrics

### Loki Metrics

#### Ingestion Metrics

```promql
# Log lines received per second
rate(loki_distributor_lines_received_total[5m])

# Bytes received per second
rate(loki_distributor_bytes_received_total[5m])

# Chunks created per second
rate(loki_ingester_chunks_created_total[5m])
```

#### Performance Metrics

```promql
# 99th percentile request latency
histogram_quantile(0.99, rate(loki_request_duration_seconds_bucket[5m]))

# 95th percentile request latency
histogram_quantile(0.95, rate(loki_request_duration_seconds_bucket[5m]))

# Average request latency
rate(loki_request_duration_seconds_sum[5m]) / rate(loki_request_duration_seconds_count[5m])
```

#### Resource Metrics

```promql
# Memory usage
container_memory_working_set_bytes{namespace="logging",pod=~"loki-.*"}

# CPU usage
rate(container_cpu_usage_seconds_total{namespace="logging",pod=~"loki-.*"}[5m])
```

### Promtail Metrics

#### Collection Metrics

```promql
# Entries sent per second
rate(promtail_sent_entries_total[5m])

# Bytes read per second
rate(promtail_read_bytes_total[5m])

# Files being tailed
promtail_files_active_total
```

#### Error Metrics

```promql
# Dropped entries per second
rate(promtail_dropped_entries_total[5m])

# Encoding failures
rate(promtail_encoding_failures_total[5m])
```

---

## Alert Rules Explained

### Critical Alerts

#### LokiDown
**Condition:** Loki is unreachable for 5 minutes  
**Action:** Immediate investigation required  
**Runbook:** [Loki Down](./LOGGING_RUNBOOK.md#loki-down)

### Warning Alerts

#### PromtailDown
**Condition:** Promtail is unreachable for 5 minutes  
**Action:** Check Promtail pods and logs  
**Runbook:** [Promtail Not Sending](./LOGGING_RUNBOOK.md#promtail-not-sending-logs)

#### HighLogIngestionRate
**Condition:** More than 10,000 log lines per second for 10 minutes  
**Action:** Check for log spam, consider scaling  
**Runbook:** [High Log Volume](./LOGGING_RUNBOOK.md#high-log-volume)

#### LokiRequestLatencyHigh
**Condition:** 99th percentile latency > 2 seconds for 10 minutes  
**Action:** Check Loki resources, optimize queries  
**Runbook:** [Slow Queries](./LOGGING_RUNBOOK.md#slow-queries)

#### PromtailDroppingLogs
**Condition:** Promtail is dropping log entries  
**Action:** Check Promtail resources, Loki availability  
**Runbook:** [Logs Not Appearing](./LOGGING_RUNBOOK.md#logs-not-appearing)

#### LokiIngesterUnhealthy
**Condition:** Flush queue > 100 chunks for 10 minutes  
**Action:** Check Loki ingester health  
**Runbook:** [Loki Performance Issues](./LOGGING_RUNBOOK.md#loki-performance-issues)

#### LokiHighMemoryUsage
**Condition:** Memory usage > 90% of limit for 10 minutes  
**Action:** Consider increasing memory limits  
**Runbook:** [Loki Performance Issues](./LOGGING_RUNBOOK.md#loki-performance-issues)

#### LokiHighCPUUsage
**Condition:** CPU usage > 0.8 cores for 10 minutes  
**Action:** Consider increasing CPU limits  
**Runbook:** [Loki Performance Issues](./LOGGING_RUNBOOK.md#loki-performance-issues)

#### LokiStorageNearFull
**Condition:** Storage > 85% full for 10 minutes  
**Action:** Clean old logs, increase storage  
**Runbook:** [Storage Issues](./LOGGING_RUNBOOK.md#storage-issues)

---

## Recording Rules

Recording rules pre-compute frequently used queries for better performance.

### Available Recording Rules

```promql
# Log ingestion rate (5m average)
job:loki_distributor_lines_received:rate5m

# Bytes ingestion rate (5m average)
job:loki_distributor_bytes_received:rate5m

# Request latency percentiles
job:loki_request_duration_seconds:p99
job:loki_request_duration_seconds:p95
job:loki_request_duration_seconds:p50

# Promtail metrics
job:promtail_sent_entries:rate5m
job:promtail_dropped_entries:rate5m
```

**Usage Example:**
```promql
# Instead of:
rate(loki_distributor_lines_received_total[5m])

# Use:
job:loki_distributor_lines_received:rate5m
```

---

## Grafana Dashboards

### Import Loki Metrics Dashboard

1. Open Grafana
2. Go to Dashboards → Import
3. Enter dashboard ID: `13639` (Loki Metrics)
4. Select Prometheus data source
5. Click Import

### Import Promtail Dashboard

1. Go to Dashboards → Import
2. Enter dashboard ID: `15443` (Promtail Metrics)
3. Select Prometheus data source
4. Click Import

---

## Troubleshooting

### ServiceMonitor Not Discovered

**Check Prometheus Operator logs:**
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus-operator
```

**Check ServiceMonitor selector:**
```bash
kubectl get prometheus -n monitoring -o yaml | grep -A10 serviceMonitorSelector
```

**Ensure ServiceMonitor has correct labels:**
```bash
kubectl get servicemonitor -n logging loki -o yaml | grep -A5 labels
```

### No Metrics in Prometheus

**Check Loki service:**
```bash
kubectl get svc -n logging loki
```

**Test metrics endpoint:**
```bash
kubectl port-forward -n logging svc/loki 3100:3100
curl http://localhost:3100/metrics
```

**Check Prometheus targets:**
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open http://localhost:9090/targets
```

### Alert Rules Not Loading

**Check PrometheusRule resource:**
```bash
kubectl get prometheusrule -n logging loki-alerts -o yaml
```

**Check Prometheus Operator logs:**
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus-operator | grep -i rule
```

**Verify rule syntax:**
```bash
# Install promtool
go install github.com/prometheus/prometheus/cmd/promtool@latest

# Check rules
promtool check rules infrastructure/kubernetes/monitoring/loki-prometheus-rules.yaml
```

---

## Next Steps

1. ✅ Deploy ServiceMonitors
2. ✅ Deploy Alert Rules
3. ⏭️ Configure Alertmanager for notifications
4. ⏭️ Import Grafana dashboards
5. ⏭️ Set up on-call rotation
6. ⏭️ Test alert firing

---

## References

- [Prometheus Operator Documentation](https://prometheus-operator.dev/)
- [ServiceMonitor API](https://prometheus-operator.dev/docs/operator/api/#monitoring.coreos.com/v1.ServiceMonitor)
- [PrometheusRule API](https://prometheus-operator.dev/docs/operator/api/#monitoring.coreos.com/v1.PrometheusRule)
- [Loki Metrics](https://grafana.com/docs/loki/latest/operations/observability/)
- [Promtail Metrics](https://grafana.com/docs/loki/latest/clients/promtail/configuration/#server)

---

**Last Updated:** December 5, 2025  
**Maintained By:** DevOps Team

