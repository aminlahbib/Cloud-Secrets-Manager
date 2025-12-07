# Grafana Dashboard Setup

## ✅ Completed Steps

### 1. ServiceMonitors Applied

ServiceMonitors have been applied to enable Prometheus scraping:

- ✅ `secret-service-monitor` - Scrapes metrics from secret-service pods
- ✅ `audit-service-monitor` - Scrapes metrics from audit-service pods

**Location**: `infrastructure/monitoring/servicemonitors/`

**Verification**:
```bash
kubectl get servicemonitors -n monitoring | grep -E "secret|audit"
```

### 2. CSM Dashboard Created

A comprehensive Grafana dashboard has been created with the following panels:

- **Request Rate by Service** - HTTP request rate per service
- **Error Rate** - Percentage of 5xx errors
- **Request Latency** - p50, p95, p99 percentiles
- **Requests by Status Code** - Breakdown by HTTP status
- **JVM Heap Usage** - Gauge showing heap utilization
- **Database Connection Pool Usage** - Connection pool metrics
- **Services Status** - Number of services up
- **Healthy Pods** - Count of healthy pods
- **JVM Memory Usage by Pod** - Memory usage over time
- **Database Connection Pool** - Active vs max connections
- **GC Pause Rate** - Garbage collection metrics
- **JVM Thread Count** - Thread metrics

**Files**:
- `infrastructure/monitoring/grafana/csm-dashboard.json` - Dashboard JSON
- `infrastructure/monitoring/grafana/csm-dashboard-configmap.yaml` - ConfigMap (deployed)

---

## 📊 Accessing the Dashboard

### Option 1: Manual Import (Recommended)

Since Grafana sidecar auto-discovery is not enabled, import the dashboard manually:

1. **Port-forward to Grafana**:
   ```bash
   kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80
   ```

2. **Open Grafana**:
   - URL: http://localhost:3001
   - Username: `admin`
   - Password: `admin` (change on first login)

3. **Import Dashboard**:
   - Click **"+"** → **"Import"**
   - Click **"Upload JSON file"**
   - Select: `infrastructure/monitoring/grafana/csm-dashboard.json`
   - Click **"Load"**
   - Select **"Prometheus"** as datasource
   - Click **"Import"**

### Option 2: Verify ConfigMap (Future Auto-Discovery)

The dashboard ConfigMap is deployed but won't auto-discover without the Grafana sidecar:

```bash
kubectl get configmap csm-dashboard -n monitoring
```

To enable auto-discovery, add the Grafana sidecar to the Helm values.

---

## 🔍 Verifying Metrics Collection

### Check Prometheus Targets

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# In another terminal, check targets
curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[] | select(.labels.job | contains("secret-service") or contains("audit-service"))'
```

### Check Service Endpoints

```bash
# Check if services expose metrics
kubectl port-forward -n csm svc/secret-service 8080:8080 &
curl http://localhost:8080/actuator/prometheus | head -20

kubectl port-forward -n csm svc/audit-service 8081:8081 &
curl http://localhost:8081/actuator/prometheus | head -20
```

### Verify ServiceMonitors

```bash
# Check ServiceMonitor status
kubectl describe servicemonitor secret-service-monitor -n monitoring
kubectl describe servicemonitor audit-service-monitor -n monitoring
```

---

## 📈 Dashboard Features

### Variables

- **Service**: Filter by `secret-service` or `audit-service` (or both)

### Refresh Intervals

- 5s, 10s, 30s, 1m, 5m, 15m, 30m, 1h, 2h, 1d

### Time Range

- Default: Last 6 hours
- Customizable via time picker

---

## 🐛 Troubleshooting

### Dashboard Shows "No Data"

1. **Check Prometheus is scraping**:
   ```bash
   kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
   # Visit http://localhost:9090/targets
   ```

2. **Verify ServiceMonitors**:
   ```bash
   kubectl get servicemonitors -n monitoring
   kubectl describe servicemonitor secret-service-monitor -n monitoring
   ```

3. **Check pod labels match ServiceMonitor selectors**:
   ```bash
   kubectl get pods -n csm -l app=secret-service --show-labels
   kubectl get pods -n csm -l app=audit-service --show-labels
   ```

4. **Verify metrics endpoint**:
   ```bash
   kubectl exec -n csm deployment/secret-service -- curl -s http://localhost:8080/actuator/prometheus | head -10
   ```

### Prometheus Not Discovering Targets

1. **Check Prometheus Operator logs**:
   ```bash
   kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus-operator
   ```

2. **Verify namespace selector**:
   - ServiceMonitors should have `namespaceSelector.matchNames: ["csm"]`
   - Prometheus should have permission to scrape from `csm` namespace

3. **Check Network Policies**:
   - Ensure Prometheus can reach pods in `csm` namespace

---

## 🔄 Updating the Dashboard

To update the dashboard:

1. Edit `infrastructure/monitoring/grafana/csm-dashboard.json`
2. Export updated JSON from Grafana UI (if modified there)
3. Update the ConfigMap:
   ```bash
   kubectl create configmap csm-dashboard \
     --from-file=csm-overview.json=infrastructure/monitoring/grafana/csm-dashboard.json \
     -n monitoring \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
4. Restart Grafana pod to reload (if sidecar enabled)

---

## 📚 Related Documentation

- [Monitoring & Observability Guide](../../docs/infrastructure/06-MONITORING-OBSERVABILITY.md)
- [ServiceMonitor Reference](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/api.md#servicemonitor)

---

*Last Updated: December 2025*
