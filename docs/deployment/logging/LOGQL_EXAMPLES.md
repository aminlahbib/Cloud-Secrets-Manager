# LogQL Query Examples

**Last Updated:** December 5, 2025  
**Purpose:** Practical LogQL queries for common use cases

---

## Table of Contents

1. [Basic Queries](#basic-queries)
2. [Filtering](#filtering)
3. [Parsing](#parsing)
4. [Aggregations](#aggregations)
5. [Service-Specific Queries](#service-specific-queries)
6. [Troubleshooting Queries](#troubleshooting-queries)
7. [Performance Queries](#performance-queries)
8. [Security Queries](#security-queries)

---

## Basic Queries

### View All Logs from a Service

```logql
{service="secret-service"}
```

### View Logs from a Namespace

```logql
{namespace="cloud-secrets-manager"}
```

### View Logs from Multiple Services

```logql
{service=~"secret-service|audit-service|notification-service"}
```

### View Logs from Last 5 Minutes

```logql
{service="secret-service"}[5m]
```

---

## Filtering

### Filter by Log Level

**Errors only:**
```logql
{service="secret-service"} |= "ERROR"
```

**Warnings and errors:**
```logql
{service="secret-service"} |~ "ERROR|WARN"
```

**Exclude debug logs:**
```logql
{service="secret-service"} != "DEBUG"
```

### Filter by Specific Text

**Contains "timeout":**
```logql
{service="secret-service"} |= "timeout"
```

**Contains "database" or "connection":**
```logql
{service="secret-service"} |~ "database|connection"
```

**Does not contain "health check":**
```logql
{service="secret-service"} != "health check"
```

### Case-Insensitive Search

```logql
{service="secret-service"} |~ "(?i)error"
```

### Multiple Filters

```logql
{service="secret-service"} 
  |= "ERROR" 
  |= "database" 
  != "health"
```

---

## Parsing

### Parse JSON Logs

```logql
{service="secret-service"} 
  | json
```

**Access parsed fields:**
```logql
{service="secret-service"} 
  | json 
  | level="ERROR"
```

### Parse Specific JSON Fields

```logql
{service="secret-service"} 
  | json level, message, user_id
```

### Parse Logfmt

```logql
{service="secret-service"} 
  | logfmt
```

### Parse with Pattern

```logql
{service="secret-service"} 
  | pattern `<timestamp> <level> <message>`
```

### Parse with Regex

```logql
{service="secret-service"} 
  | regexp `(?P<level>\\w+) (?P<message>.*)`
```

### Filter After Parsing

```logql
{service="secret-service"} 
  | json 
  | level="ERROR" 
  | status_code >= 500
```

---

## Aggregations

### Count Logs

**Total logs in last hour:**
```logql
count_over_time({service="secret-service"}[1h])
```

**Logs per minute:**
```logql
rate({service="secret-service"}[1m])
```

### Count by Label

**Logs per service:**
```logql
sum by (service) (
  count_over_time({namespace="cloud-secrets-manager"}[5m])
)
```

**Errors per service:**
```logql
sum by (service) (
  count_over_time({namespace="cloud-secrets-manager"} |= "ERROR" [5m])
)
```

### Top N Queries

**Top 10 services by log volume:**
```logql
topk(10, 
  sum by (service) (
    rate({namespace="cloud-secrets-manager"}[5m])
  )
)
```

**Top 5 error messages:**
```logql
topk(5, 
  sum by (message) (
    count_over_time({level="error"} | json [5m])
  )
)
```

### Average, Min, Max

**Average response time:**
```logql
avg_over_time(
  {service="secret-service"} 
  | json 
  | unwrap duration_ms [5m]
)
```

**Max response time:**
```logql
max_over_time(
  {service="secret-service"} 
  | json 
  | unwrap duration_ms [5m]
)
```

### Percentiles

**95th percentile response time:**
```logql
quantile_over_time(0.95,
  {service="secret-service"} 
  | json 
  | unwrap duration_ms [5m]
)
```

---

## Service-Specific Queries

### Secret Service

**All secret operations:**
```logql
{service="secret-service"} 
  | json 
  | action=~"CREATE_SECRET|UPDATE_SECRET|DELETE_SECRET"
```

**Failed secret operations:**
```logql
{service="secret-service"} 
  | json 
  | action=~"CREATE_SECRET|UPDATE_SECRET|DELETE_SECRET" 
  | status="FAILED"
```

**Secrets created by user:**
```logql
{service="secret-service"} 
  | json 
  | action="CREATE_SECRET" 
  | user_id="user-123"
```

**Secret operations per minute:**
```logql
sum by (action) (
  rate({service="secret-service"} | json [1m])
)
```

### Audit Service

**All audit events:**
```logql
{service="audit-service"}
```

**Failed login attempts:**
```logql
{service="audit-service"} 
  | json 
  | event_type="LOGIN_FAILED"
```

**Audit events by user:**
```logql
{service="audit-service"} 
  | json 
  | user_id="user-123"
```

**Suspicious activity:**
```logql
{service="audit-service"} 
  | json 
  | severity="HIGH" 
  | event_type=~"UNAUTHORIZED_ACCESS|PERMISSION_DENIED"
```

### Notification Service

**All notifications:**
```logql
{service="notification-service"}
```

**Failed notifications:**
```logql
{service="notification-service"} 
  | json 
  | status="FAILED"
```

**Notifications by type:**
```logql
sum by (notification_type) (
  count_over_time({service="notification-service"} | json [5m])
)
```

---

## Troubleshooting Queries

### Find Errors

**All errors:**
```logql
{namespace="cloud-secrets-manager"} |= "ERROR"
```

**Errors with stack traces:**
```logql
{namespace="cloud-secrets-manager"} 
  |= "ERROR" 
  |= "Exception"
```

**Errors by service:**
```logql
sum by (service) (
  count_over_time({namespace="cloud-secrets-manager"} |= "ERROR" [5m])
)
```

### Find Timeouts

**Database timeouts:**
```logql
{namespace="cloud-secrets-manager"} 
  |~ "timeout|timed out" 
  |= "database"
```

**API timeouts:**
```logql
{namespace="cloud-secrets-manager"} 
  | json 
  | status_code="504"
```

### Find Connection Issues

**Connection errors:**
```logql
{namespace="cloud-secrets-manager"} 
  |~ "connection refused|connection timeout|connection reset"
```

**Database connection pool:**
```logql
{service="secret-service"} 
  |= "connection pool" 
  |~ "exhausted|full"
```

### Find Memory Issues

**Out of memory:**
```logql
{namespace="cloud-secrets-manager"} 
  |~ "OutOfMemoryError|OOM|memory"
```

**Garbage collection:**
```logql
{namespace="cloud-secrets-manager"} 
  |= "GC" 
  |~ "pause|collection"
```

### Find Slow Queries

**Slow database queries:**
```logql
{service="secret-service"} 
  | json 
  | query_time_ms > 1000
```

**Slow API requests:**
```logql
{service="secret-service"} 
  | json 
  | duration_ms > 5000
```

---

## Performance Queries

### Request Rate

**Requests per second:**
```logql
sum(rate({service="secret-service"} | json | __error__="" [1m]))
```

**Requests per endpoint:**
```logql
sum by (endpoint) (
  rate({service="secret-service"} | json [1m])
)
```

### Error Rate

**Error percentage:**
```logql
sum(rate({service="secret-service"} |= "ERROR" [5m])) 
/ 
sum(rate({service="secret-service"}[5m])) 
* 100
```

**Errors per minute:**
```logql
sum(rate({service="secret-service"} |= "ERROR" [1m])) * 60
```

### Response Time

**Average response time:**
```logql
avg_over_time(
  {service="secret-service"} 
  | json 
  | unwrap duration_ms [5m]
)
```

**Response time by endpoint:**
```logql
avg by (endpoint) (
  avg_over_time(
    {service="secret-service"} 
    | json 
    | unwrap duration_ms [5m]
  )
)
```

### Throughput

**Bytes processed:**
```logql
sum(
  bytes_over_time({service="secret-service"}[5m])
)
```

**Logs per second:**
```logql
sum(rate({namespace="cloud-secrets-manager"}[1m]))
```

---

## Security Queries

### Failed Authentication

**Failed logins:**
```logql
{service="audit-service"} 
  | json 
  | event_type="LOGIN_FAILED"
```

**Failed logins by user:**
```logql
sum by (user_id) (
  count_over_time(
    {service="audit-service"} 
    | json 
    | event_type="LOGIN_FAILED" [1h]
  )
)
```

**Brute force attempts:**
```logql
sum by (user_id, ip_address) (
  count_over_time(
    {service="audit-service"} 
    | json 
    | event_type="LOGIN_FAILED" [5m]
  )
) > 5
```

### Unauthorized Access

**Permission denied:**
```logql
{namespace="cloud-secrets-manager"} 
  | json 
  | event_type="PERMISSION_DENIED"
```

**Unauthorized API calls:**
```logql
{service="secret-service"} 
  | json 
  | status_code="403"
```

### Suspicious Activity

**Access from unusual locations:**
```logql
{service="audit-service"} 
  | json 
  | country!="US"
```

**After-hours access:**
```logql
{service="audit-service"} 
  | json 
  | hour(timestamp) < 6 or hour(timestamp) > 22
```

**Multiple failed attempts:**
```logql
sum by (user_id) (
  count_over_time(
    {service="audit-service"} 
    | json 
    | event_type=~"LOGIN_FAILED|PERMISSION_DENIED" [10m]
  )
) > 3
```

---

## Advanced Patterns

### Correlate Logs with Metrics

**Find logs for high CPU:**
```logql
{service="secret-service"} 
  | json 
  | timestamp > <high_cpu_start_time> 
  | timestamp < <high_cpu_end_time>
```

### Find Logs Around an Incident

**Logs 5 minutes before and after:**
```logql
{service="secret-service"} 
  | json 
  | timestamp > <incident_time - 5m> 
  | timestamp < <incident_time + 5m>
```

### Compare Time Periods

**Current vs previous hour:**
```logql
# Current hour
sum(count_over_time({service="secret-service"}[1h]))

# Previous hour
sum(count_over_time({service="secret-service"}[1h] offset 1h))
```

### Detect Anomalies

**Sudden spike in errors:**
```logql
sum(rate({service="secret-service"} |= "ERROR" [5m])) 
> 
sum(rate({service="secret-service"} |= "ERROR" [5m] offset 1h)) * 2
```

---

## Query Optimization Tips

### DO: Use Specific Labels

```logql
# Good
{service="secret-service", namespace="production"}

# Bad
{}
```

### DO: Limit Time Range

```logql
# Good
{service="secret-service"}[5m]

# Bad
{service="secret-service"}[30d]
```

### DO: Filter Early

```logql
# Good
{service="secret-service"} |= "ERROR" | json

# Bad
{service="secret-service"} | json | level="ERROR"
```

### DON'T: Use Complex Regex

```logql
# Good
{service="secret-service"} |= "error"

# Bad
{service="secret-service"} |~ ".*error.*timeout.*database.*"
```

### DON'T: Query Too Many Streams

```logql
# Good
{service="secret-service"}

# Bad
{namespace=~".+"}
```

---

## Grafana Dashboard Queries

### Log Volume Panel

```logql
sum by (service) (
  rate({namespace="cloud-secrets-manager"}[1m])
)
```

### Error Rate Panel

```logql
sum by (service) (
  rate({namespace="cloud-secrets-manager"} |= "ERROR" [5m])
)
```

### Top Errors Panel

```logql
topk(10, 
  sum by (message) (
    count_over_time({level="error"} | json [5m])
  )
)
```

### Response Time Panel

```logql
quantile_over_time(0.95,
  {service="secret-service"} 
  | json 
  | unwrap duration_ms [5m]
)
```

---

## Testing Queries

### Generate Test Logs

```bash
# Send test log
curl -H "Content-Type: application/json" \
  -XPOST "http://localhost:3100/loki/api/v1/push" \
  --data-raw '{
    "streams": [{
      "stream": {
        "service": "test-service",
        "level": "info"
      },
      "values": [
        ["'$(date +%s)'000000000", "Test log message"]
      ]
    }]
  }'
```

### Query Test Logs

```bash
# Query via API
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={service="test-service"}' \
  --data-urlencode "start=$(date -u -v-1H +%s)000000000" \
  --data-urlencode "end=$(date -u +%s)000000000" \
  | jq '.data.result'
```

---

## Resources

- [LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [LogQL Cheat Sheet](https://grafana.com/docs/loki/latest/logql/log_queries/)
- [Grafana Explore](https://grafana.com/docs/grafana/latest/explore/)

---

**Need help?** Check the [Logging Runbook](./LOGGING_RUNBOOK.md) for troubleshooting.
