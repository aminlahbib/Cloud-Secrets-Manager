# Grafana + Loki Integration Guide

**Last Updated:** December 5, 2025  
**Status:** Ready for Implementation  
**Prerequisites:** Loki deployed, Grafana deployed

---

## Overview

This guide explains how to integrate Loki with Grafana for log visualization and create comprehensive logging dashboards.

---

## Table of Contents

1. [Add Loki Data Source](#add-loki-data-source)
2. [Create Dashboards](#create-dashboards)
3. [Dashboard Examples](#dashboard-examples)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Add Loki Data Source

### Step 1: Access Grafana

```bash
# If Grafana is in the cluster
kubectl port-forward -n monitoring svc/grafana 3000:80

# Open browser
open http://localhost:3000

# Default credentials (change after first login)
# Username: admin
# Password: admin
```

### Step 2: Add Data Source

1. **Navigate to Configuration**
   - Click the gear icon (⚙️) in the left sidebar
   - Select "Data Sources"

2. **Add Loki**
   - Click "Add data source"
   - Search for "Loki"
   - Click "Loki"

3. **Configure Connection**
   ```
   Name: Loki
   URL: http://loki.logging.svc.cluster.local:3100
   Access: Server (default)
   ```

4. **Configure Derived Fields** (Optional - for trace correlation)
   ```json
   {
     "datasourceUid": "tempo",
     "matcherRegex": "traceID=(\\w+)",
     "name": "TraceID",
     "url": "${__value.raw}"
   }
   ```

5. **Save & Test**
   - Click "Save & Test"
   - Should see "Data source connected and labels found"

### Step 3: Verify Connection

```bash
# Test query in Explore
# Navigate to Explore (compass icon)
# Select Loki data source
# Enter query: {namespace="logging"}
# Should see logs
```

---

## Create Dashboards

### Dashboard 1: Logs Overview

**Purpose:** High-level view of all logs across services

**Panels:**

1. **Log Volume by Service**
   ```json
   {
     "title": "Log Volume by Service",
     "type": "timeseries",
     "targets": [{
       "expr": "sum by (service) (rate({namespace=\"cloud-secrets-manager\"}[1m]))",
       "legendFormat": "{{service}}"
     }]
   }
   ```

2. **Log Level Distribution**
   ```json
   {
     "title": "Log Level Distribution",
     "type": "piechart",
     "targets": [{
       "expr": "sum by (level) (count_over_time({namespace=\"cloud-secrets-manager\"} | json [5m]))"
     }]
   }
   ```

3. **Error Rate Trends**
   ```json
   {
     "title": "Error Rate",
     "type": "graph",
     "targets": [{
       "expr": "sum(rate({namespace=\"cloud-secrets-manager\"} |= \"ERROR\" [5m]))"
     }]
   }
   ```

4. **Recent Errors**
   ```json
   {
     "title": "Recent Errors",
     "type": "logs",
     "targets": [{
       "expr": "{namespace=\"cloud-secrets-manager\"} |= \"ERROR\""
     }],
     "options": {
       "showTime": true,
       "showLabels": true,
       "wrapLogMessage": true
     }
   }
   ```

### Dashboard 2: Secret Service Logs

**Purpose:** Detailed logs for Secret Service

**Panels:**

1. **Secret Service Log Stream**
   ```logql
   {service="secret-service"}
   ```

2. **Error Count**
   ```logql
   sum(count_over_time({service="secret-service"} |= "ERROR" [5m]))
   ```

3. **Request Duration**
   ```logql
   histogram_quantile(0.95,
     sum by (le) (
       rate({service="secret-service"} 
         | json 
         | unwrap duration_ms [5m])
     )
   )
   ```

4. **Top Error Messages**
   ```logql
   topk(10,
     sum by (message) (
       count_over_time({service="secret-service"} |= "ERROR" | json [5m])
     )
   )
   ```

### Dashboard 3: Error Analysis

**Purpose:** Deep dive into errors across all services

**Panels:**

1. **Error Logs with Context**
   ```logql
   {namespace="cloud-secrets-manager"} |= "ERROR"
   ```

2. **Error Frequency by Service**
   ```logql
   sum by (service) (
     rate({namespace="cloud-secrets-manager"} |= "ERROR" [5m])
   )
   ```

3. **Error Patterns**
   ```logql
   topk(20,
     sum by (message) (
       count_over_time({level="error"} | json [1h])
     )
   )
   ```

4. **Error Timeline**
   ```logql
   sum(count_over_time({namespace="cloud-secrets-manager"} |= "ERROR" [1m]))
   ```

---

## Dashboard Examples

### Complete Dashboard JSON

Save this as `logs-overview-dashboard.json`:

```json
{
  "dashboard": {
    "title": "Logs Overview",
    "tags": ["logs", "loki"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Log Volume by Service",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [{
          "expr": "sum by (service) (rate({namespace=\"cloud-secrets-manager\"}[1m]))",
          "refId": "A"
        }],
        "options": {
          "legend": {"displayMode": "table", "placement": "right"}
        }
      },
      {
        "id": 2,
        "title": "Log Level Distribution",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [{
          "expr": "sum by (level) (count_over_time({namespace=\"cloud-secrets-manager\"} | json [5m]))",
          "refId": "A"
        }]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
        "targets": [{
          "expr": "sum(rate({namespace=\"cloud-secrets-manager\"} |= \"ERROR\" [5m]))",
          "refId": "A"
        }]
      },
      {
        "id": 4,
        "title": "Recent Errors",
        "type": "logs",
        "gridPos": {"h": 12, "w": 24, "x": 0, "y": 16},
        "targets": [{
          "expr": "{namespace=\"cloud-secrets-manager\"} |= \"ERROR\"",
          "refId": "A"
        }],
        "options": {
          "showTime": true,
          "showLabels": true,
          "wrapLogMessage": true,
          "prettifyLogMessage": true
        }
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
```

### Import Dashboard

1. **Navigate to Dashboards**
   - Click "+" icon in left sidebar
   - Select "Import"

2. **Upload JSON**
   - Click "Upload JSON file"
   - Select `logs-overview-dashboard.json`
   - Click "Load"

3. **Configure**
   - Select Loki data source
   - Click "Import"

---

## Best Practices

### Dashboard Design

1. **Use Consistent Time Ranges**
   - Set dashboard-wide time range
   - Use relative times (last 1h, last 24h)
   - Add refresh interval (30s, 1m)

2. **Organize Panels Logically**
   - Overview at top
   - Details below
   - Logs at bottom

3. **Add Descriptions**
   - Panel descriptions
   - Dashboard description
   - Variable descriptions

4. **Use Variables**
   ```
   Name: namespace
   Type: Query
   Query: label_values(namespace)
   ```

5. **Link Related Dashboards**
   - Add links in dashboard settings
   - Use drill-down links in panels

### Query Optimization

1. **Use Specific Labels**
   ```logql
   # Good
   {service="secret-service", level="error"}
   
   # Bad
   {namespace=~".+"}
   ```

2. **Limit Time Range**
   ```logql
   # Good
   {service="secret-service"}[5m]
   
   # Bad
   {service="secret-service"}[30d]
   ```

3. **Filter Early**
   ```logql
   # Good
   {service="secret-service"} |= "ERROR" | json
   
   # Bad
   {service="secret-service"} | json | level="ERROR"
   ```

### Alert Configuration

1. **Create Alert Rules**
   ```yaml
   alert: HighErrorRate
   expr: |
     sum(rate({namespace="cloud-secrets-manager"} |= "ERROR" [5m])) 
     > 10
   for: 5m
   annotations:
     summary: "High error rate detected"
     description: "Error rate is {{ $value }} errors/sec"
   ```

2. **Configure Notifications**
   - Email
   - Slack
   - PagerDuty

---

## Troubleshooting

### Data Source Not Working

**Issue:** "Data source connected but no labels found"

**Solution:**
```bash
# Check Loki is accessible
kubectl port-forward -n logging svc/loki 3100:3100
curl http://localhost:3100/ready

# Check labels exist
curl http://localhost:3100/loki/api/v1/labels | jq

# Verify URL in Grafana
# Should be: http://loki.logging.svc.cluster.local:3100
```

### No Data in Panels

**Issue:** Panels show "No data"

**Solutions:**

1. **Check Time Range**
   - Adjust time range to include data
   - Use "Last 15 minutes" for testing

2. **Check Query**
   - Test query in Explore first
   - Verify labels exist
   - Check for typos

3. **Check Data Source**
   - Verify data source is selected
   - Test data source connection

### Slow Queries

**Issue:** Queries timeout or are very slow

**Solutions:**

1. **Optimize Query**
   - Add more specific labels
   - Reduce time range
   - Use filters early

2. **Check Loki Performance**
   ```bash
   kubectl top pod -n logging loki-0
   ```

3. **Increase Timeout**
   - In data source settings
   - Set timeout to 60s or more

---

## Dashboard Provisioning

### Automatic Dashboard Loading

Create `grafana-dashboard-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  logs-overview.json: |
    {
      "dashboard": {
        "title": "Logs Overview",
        ...
      }
    }
```

Apply:
```bash
kubectl apply -f grafana-dashboard-configmap.yaml
```

Update Grafana Helm values:
```yaml
grafana:
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'default'
        orgId: 1
        folder: 'Logs'
        type: file
        options:
          path: /var/lib/grafana/dashboards
  
  dashboardsConfigMaps:
    default: grafana-dashboards
```

---

## Resources

- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/getting-started/grafana/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/best-practices-for-creating-dashboards/)
- [LogQL in Grafana](https://grafana.com/docs/loki/latest/logql/)
- [Dashboard Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#dashboards)

---

**Next Steps:**
- Deploy Grafana if not already deployed
- Add Loki data source
- Import example dashboards
- Customize for your needs
