# Logging Infrastructure - Quick Reference Card

**Last Updated:** December 5, 2025

---

## 🚀 Quick Commands

### Check Status
```bash
# Check all logging pods
kubectl get pods -n logging

# Check Loki health
kubectl port-forward -n logging svc/loki 3100:3100
curl http://localhost:3100/ready

# Check Promtail logs
kubectl logs -n logging -l app=promtail --tail=50
```

### Query Logs
```bash
# Port-forward to Loki
kubectl port-forward -n logging svc/loki 3100:3100

# Query all logs (last 5 minutes)
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="default"}' \
  --data-urlencode 'start='$(date -u -d '5 minutes ago' +%s)000000000 \
  --data-urlencode 'end='$(date -u +%s)000000000 | jq

# Query errors only
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="default"} |~ "(?i)error"' | jq
```

### Restart Components
```bash
# Restart Loki
kubectl rollout restart statefulset/loki -n logging

# Restart Promtail
kubectl rollout restart daemonset/loki-promtail -n logging
```

---

## 📊 Key Endpoints

| Component | Endpoint | Purpose |
|-----------|----------|---------|
| Loki API | `http://loki.logging.svc.cluster.local:3100` | Log queries |
| Loki Ready | `http://loki:3100/ready` | Health check |
| Loki Metrics | `http://loki:3100/metrics` | Prometheus metrics |
| Promtail Metrics | `http://loki-promtail:3101/metrics` | Prometheus metrics |

---

## 🔍 Common LogQL Queries

### By Service
```logql
# Secret Service logs
{namespace="default", app="secret-service"}

# Audit Service logs
{namespace="default", app="audit-service"}

# All errors
{namespace="default"} |~ "(?i)error"
```

### By Log Level
```logql
# Errors only
{namespace="default"} |= "ERROR"

# Warnings and errors
{namespace="default"} |~ "ERROR|WARN"

# Info and above
{namespace="default"} |~ "INFO|WARN|ERROR"
```

### Performance
```logql
# Slow requests (>1s)
{namespace="default"} |~ "duration.*[1-9][0-9]{3,}ms"

# High memory usage
{namespace="default"} |~ "memory.*[5-9][0-9]{2}MB"
```

### Time Ranges
```logql
# Last 5 minutes
{namespace="default"}[5m]

# Last hour
{namespace="default"}[1h]

# Last 24 hours
{namespace="default"}[24h]
```

---

## 🚨 Alert Rules

| Alert | Severity | Threshold | Action |
|-------|----------|-----------|--------|
| LokiDown | Critical | 5 minutes | Immediate investigation |
| PromtailDown | Warning | 5 minutes | Check pod status |
| HighLogIngestionRate | Warning | >10k lines/sec | Check for log spam |
| LokiRequestLatencyHigh | Warning | p99 >2s | Optimize queries |
| PromtailDroppingLogs | Warning | Any drops | Check resources |
| LokiHighMemoryUsage | Warning | >90% | Increase limits |
| LokiStorageNearFull | Warning | >85% | Clean old logs |

---

## 📈 Key Metrics

### Loki Metrics
```promql
# Log ingestion rate
rate(loki_distributor_lines_received_total[5m])

# Request latency (p99)
histogram_quantile(0.99, rate(loki_request_duration_seconds_bucket[5m]))

# Memory usage
container_memory_working_set_bytes{namespace="logging",pod=~"loki-.*"}
```

### Promtail Metrics
```promql
# Entries sent per second
rate(promtail_sent_entries_total[5m])

# Dropped entries
rate(promtail_dropped_entries_total[5m])

# Files being tailed
promtail_files_active_total
```

---

## 🛠️ Troubleshooting

### Logs Not Appearing
```bash
# 1. Check Promtail is running
kubectl get pods -n logging -l app=promtail

# 2. Check Promtail logs
kubectl logs -n logging -l app=promtail --tail=100

# 3. Check Loki is reachable
kubectl exec -n logging -l app=promtail -- wget -O- http://loki:3100/ready

# 4. Check application logs exist
kubectl exec -n logging -l app=promtail -- ls -la /var/log/pods/
```

### Slow Queries
```bash
# 1. Check Loki resources
kubectl top pod -n logging loki-0

# 2. Check query in Loki logs
kubectl logs -n logging loki-0 --tail=100 | grep query

# 3. Optimize query (add filters)
# Bad:  {namespace="default"}
# Good: {namespace="default", app="secret-service"} |= "ERROR"
```

### Storage Issues
```bash
# 1. Check storage usage
kubectl exec -n logging loki-0 -- df -h

# 2. Check retention policy (should be 30 days)
kubectl get cm -n logging loki -o yaml | grep retention

# 3. Manually clean old data (if needed)
kubectl exec -n logging loki-0 -- rm -rf /data/loki/chunks/fake/*
```

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| [Loki & Promtail 101](../../101/08-LOKI-PROMTAIL-101.md) | Learning guide |
| [Logging Setup](./LOGGING_SETUP.md) | Installation guide |
| [Logging Runbook](./LOGGING_RUNBOOK.md) | Operations guide |
| [LogQL Examples](./LOGQL_EXAMPLES.md) | Query examples |
| [Grafana Integration](./GRAFANA_LOKI_INTEGRATION.md) | Grafana setup |
| [Prometheus Integration](./PROMETHEUS_INTEGRATION.md) | Prometheus setup |

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `infrastructure/helm/loki-stack-values.yaml` | Loki/Promtail config |
| `infrastructure/kubernetes/monitoring/loki-servicemonitor.yaml` | Loki metrics |
| `infrastructure/kubernetes/monitoring/promtail-servicemonitor.yaml` | Promtail metrics |
| `infrastructure/kubernetes/monitoring/loki-prometheus-rules.yaml` | Alerts & rules |

---

## 💡 Pro Tips

1. **Always use label filters** - Queries are faster with labels
   ```logql
   # Slow
   {namespace="default"} |= "error"
   
   # Fast
   {namespace="default", app="secret-service"} |= "error"
   ```

2. **Use recording rules** - Pre-computed metrics are faster
   ```promql
   # Instead of
   rate(loki_distributor_lines_received_total[5m])
   
   # Use
   job:loki_distributor_lines_received:rate5m
   ```

3. **Limit time ranges** - Shorter ranges = faster queries
   ```logql
   # Query last 5 minutes, not last 24 hours
   {namespace="default"}[5m]
   ```

4. **Use Grafana Explore** - Better UI than curl
   - Navigate to Explore tab
   - Select Loki data source
   - Use query builder

5. **Set up alerts** - Don't wait for problems
   ```bash
   kubectl apply -f infrastructure/kubernetes/monitoring/loki-prometheus-rules.yaml
   ```

---

## 🆘 Emergency Contacts

**Runbook:** [LOGGING_RUNBOOK.md](./LOGGING_RUNBOOK.md)

**Common Issues:**
- Loki Down → [Section 4.1](./LOGGING_RUNBOOK.md#loki-down)
- Logs Not Appearing → [Section 4.2](./LOGGING_RUNBOOK.md#logs-not-appearing)
- Slow Queries → [Section 4.3](./LOGGING_RUNBOOK.md#slow-queries)
- Storage Issues → [Section 4.4](./LOGGING_RUNBOOK.md#storage-issues)

---

**Print this page and keep it handy!** 📄

