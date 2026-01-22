# Cloud Run Monitoring Guide

Complete guide for monitoring Cloud Secrets Manager services deployed on Google Cloud Run.

## Overview

Cloud Run provides built-in monitoring through Google Cloud Monitoring. No additional setup is required - metrics are automatically collected for all Cloud Run services.

## Accessing Monitoring

### Cloud Console

1. **Dashboards:**
   - Go to [Monitoring > Dashboards](https://console.cloud.google.com/monitoring/dashboards?project=cloud-secrets-manager)
   - View pre-configured dashboards or create custom ones

2. **Metrics Explorer:**
   - Go to [Monitoring > Metrics Explorer](https://console.cloud.google.com/monitoring/metrics-explorer?project=cloud-secrets-manager)
   - Explore individual metrics

3. **Logs:**
   - Go to [Logging > Logs Explorer](https://console.cloud.google.com/logs/query?project=cloud-secrets-manager)
   - Filter by service: `resource.type="cloud_run_revision" resource.labels.service_name="secret-service"`

### gcloud CLI

```bash
# List services
gcloud run services list --region=europe-west10

# View logs
gcloud run logs read secret-service --region=europe-west10 --limit=50

# Stream logs
gcloud run logs tail secret-service --region=europe-west10

# View metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"' \
  --project=cloud-secrets-manager
```

## Key Metrics

### Request Metrics

- **Request Count:** Total requests per service
- **Request Latency:** p50, p95, p99 percentiles
- **Error Rate:** Percentage of 5xx errors
- **Status Codes:** Breakdown by 2xx, 3xx, 4xx, 5xx

### Resource Metrics

- **Memory Usage:** Percentage of allocated memory used
- **CPU Usage:** Percentage of allocated CPU used
- **Instance Count:** Number of running instances

### Custom Metrics

- **JVM Metrics:** Available via `/actuator/prometheus` (if enabled)
- **Database Metrics:** Connection pool usage, query latency
- **Business Metrics:** Secrets created, teams created, etc.

## Setting Up Dashboards

### Option 1: Use Pre-configured Dashboard

```bash
cd infrastructure/monitoring/cloudrun
gcloud monitoring dashboards create \
  --config-from-file=cloud-monitoring-dashboard.json \
  --project=cloud-secrets-manager
```

### Option 2: Create Custom Dashboard

1. Go to [Monitoring > Dashboards](https://console.cloud.google.com/monitoring/dashboards)
2. Click "Create Dashboard"
3. Add widgets for metrics you want to monitor
4. Save dashboard

## Setting Up Alerts

### Option 1: Use Pre-configured Alerts

```bash
cd infrastructure/monitoring/cloudrun
gcloud alpha monitoring policies create \
  --policy-from-file=alert-policy.yaml \
  --project=cloud-secrets-manager
```

### Option 2: Create Custom Alerts

1. Go to [Monitoring > Alerting](https://console.cloud.google.com/monitoring/alerting)
2. Click "Create Policy"
3. Define condition (e.g., error rate > 5%)
4. Configure notification channels
5. Save policy

## Recommended Alerts

1. **High Error Rate:** Alert when error rate > 5% for 5 minutes
2. **High Latency:** Alert when p95 latency > 2s for 5 minutes
3. **High Memory:** Alert when memory usage > 80% for 5 minutes
4. **Service Down:** Alert when no requests for 5 minutes

## Logging

### View Logs

```bash
# All services
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Specific service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=secret-service" --limit=50

# Errors only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50

# Time range
gcloud logging read "resource.type=cloud_run_revision" --limit=50 --format=json --freshness=1h
```

### Log Queries

Common log queries:

```bash
# Errors in secret-service
resource.type="cloud_run_revision" 
resource.labels.service_name="secret-service" 
severity>=ERROR

# Slow requests (>2s)
resource.type="cloud_run_revision" 
jsonPayload.latency>2000

# Authentication failures
resource.type="cloud_run_revision" 
jsonPayload.message=~"authentication.*failed"
```

## Cost Monitoring

### View Costs

1. Go to [Billing > Reports](https://console.cloud.google.com/billing/reports)
2. Filter by service: Cloud Run, Cloud SQL, etc.
3. Set time range to view costs

### Cost Breakdown

Typical monthly costs:
- Cloud Run: $5-15 (with optimized resources)
- Cloud SQL: $30
- Secret Manager: $1-2
- Artifact Registry: $1-5
- Monitoring/Logging: Free tier (usually $0)

## Best Practices

1. **Set up alerts early** - Don't wait for issues
2. **Monitor error rates** - Catch issues before users notice
3. **Track latency** - Ensure good user experience
4. **Review logs regularly** - Identify patterns
5. **Set up cost alerts** - Avoid surprise bills

## Troubleshooting

### No metrics showing

- Verify services are deployed and receiving traffic
- Check time range (metrics may take a few minutes)
- Verify project ID is correct

### Alerts not firing

- Check alert conditions match actual values
- Verify notification channels are configured
- Check alert policy is enabled

### High costs

- Review resource allocations
- Check for services not scaling to zero
- Review Cloud SQL usage
- Use `shutdown.sh` script when not in use

## Additional Resources

- [Cloud Run Monitoring Docs](https://cloud.google.com/run/docs/monitoring)
- [Cloud Monitoring API](https://cloud.google.com/monitoring/api)
- [Cloud Logging Docs](https://cloud.google.com/logging/docs)

---

**Last Updated:** January 2026
