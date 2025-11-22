# Deployment Verification Guide

## 1. Deploy Monitoring Stack
Apply the Prometheus rules and Grafana dashboard to your Kubernetes cluster.

```bash
kubectl apply -f monitoring/alerts/prometheus-rules.yaml
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml
```

## 2. Verify Prometheus Targets
Check if the services are being scraped correctly by Prometheus.

1. Port-forward Prometheus:
   ```bash
   kubectl port-forward svc/prometheus-operated 9090:9090 -n monitoring
   ```
2. Open http://localhost:9090/targets in your browser.
3. Verify `secret-service` and `audit-service` are listed and their status is `UP`.

## 3. Verify OpenTelemetry Metrics
Query Prometheus for the new traces metrics to ensure data flow.

1. Go to http://localhost:9090/graph
2. Execute the following query:
   ```promql
   rate(http_server_requests_seconds_count[1m])
   ```
3. Ensure you see time-series data for your services.

## 4. Trigger Alerts
To verify the alerting pipeline:

1. Generate high error rate:
   ```bash
   # Call a non-existent endpoint repeatedly
   for i in {1..50}; do curl -I http://localhost:8080/api/secrets/non-existent; done
   ```
2. Check Prometheus Alerts at http://localhost:9090/alerts.
3. `HighErrorRate` should be in `PENDING` or `FIRING` state.

