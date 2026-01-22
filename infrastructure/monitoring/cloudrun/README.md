# Cloud Run Monitoring

Monitoring setup for Cloud Secrets Manager deployed on Google Cloud Run.

## Overview

This directory contains Cloud Monitoring dashboards and alert policies for Cloud Run services. Unlike GKE monitoring (Prometheus/Grafana), Cloud Run uses Google Cloud's native monitoring solution.

## Components

### Dashboard

**File:** `cloud-monitoring-dashboard.json`

A comprehensive dashboard showing:
- Request rate by service
- Error rate
- Request latency (p50, p95, p99)
- Memory usage
- CPU usage
- Instance count
- Requests by status code

### Alert Policies

**File:** `alert-policy.yaml`

Alert policies for:
- High error rate (>5%)
- High latency (p95 > 2s)
- High memory usage (>80%)
- Service unavailable

## Deployment

### Option 1: Using gcloud CLI

```bash
# Create dashboard
gcloud monitoring dashboards create \
  --config-from-file=cloud-monitoring-dashboard.json \
  --project=cloud-secrets-manager

# Create alert policies
gcloud alpha monitoring policies create \
  --policy-from-file=alert-policy.yaml \
  --project=cloud-secrets-manager
```

### Option 2: Using Cloud Console

1. **Dashboard:**
   - Go to [Cloud Console > Monitoring > Dashboards](https://console.cloud.google.com/monitoring/dashboards)
   - Click "Create Dashboard"
   - Click "Import JSON" and paste contents of `cloud-monitoring-dashboard.json`

2. **Alerts:**
   - Go to [Cloud Console > Monitoring > Alerting](https://console.cloud.google.com/monitoring/alerting)
   - Click "Create Policy"
   - For each alert in `alert-policy.yaml`, create manually or use the YAML import

## Accessing Dashboards

After deployment:

1. **Cloud Console:**
   - Go to [Monitoring > Dashboards](https://console.cloud.google.com/monitoring/dashboards)
   - Select "Cloud Secrets Manager - Cloud Run Dashboard"

2. **Direct URL:**
   ```
   https://console.cloud.google.com/monitoring/dashboards?project=cloud-secrets-manager
   ```

## Metrics Available

Cloud Run automatically exports these metrics:

- `run.googleapis.com/request_count` - Request count by status code
- `run.googleapis.com/request_latencies` - Request latency percentiles
- `run.googleapis.com/container/memory/utilizations` - Memory usage
- `run.googleapis.com/container/cpu/utilizations` - CPU usage
- `run.googleapis.com/container/instance_count` - Number of instances

## Custom Metrics

To add custom metrics (e.g., from application code):

1. Use Cloud Monitoring API in your application
2. Export metrics via `/actuator/prometheus` endpoint (if enabled)
3. Use Cloud Monitoring client libraries

## Cost

Cloud Monitoring is included in GCP's free tier:
- First 150MB of logs/month: Free
- First 50GB of metrics/month: Free
- Additional usage: Very low cost (~$0.01-0.05/month for typical usage)

## Troubleshooting

### Dashboard not showing data

1. Verify services are deployed:
   ```bash
   gcloud run services list --region=europe-west10
   ```

2. Check metrics are being collected:
   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="run.googleapis.com/request_count"' \
     --project=cloud-secrets-manager
   ```

3. Verify time range (metrics may take a few minutes to appear)

### Alerts not firing

1. Check alert policy is active:
   ```bash
   gcloud alpha monitoring policies list --project=cloud-secrets-manager
   ```

2. Verify notification channels are configured (if using)

3. Check alert conditions match actual metric values

## Next Steps

1. Configure notification channels (email, Slack, PagerDuty)
2. Set up log-based metrics for custom events
3. Create additional dashboards for specific use cases
4. Set up SLO monitoring

---

**Last Updated:** January 2026
