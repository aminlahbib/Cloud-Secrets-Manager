# Operations Runbooks

**Quick reference guide for responding to alerts and incidents**

---

## Table of Contents

1. [Service Down](#runbook-service-down)
2. [High Error Rate](#runbook-high-error-rate)
3. [High Latency](#runbook-high-latency)
4. [Database Connection Pool Issues](#runbook-database-connection-pool-issues)
5. [Secret Rotation Failure](#runbook-secret-rotation-failure)
6. [High Memory Usage](#runbook-high-memory-usage)
7. [High CPU Usage](#runbook-high-cpu-usage)
8. [Audit Event Processing Lag](#runbook-audit-event-processing-lag)

---

## Runbook: Service Down

**Alert:** `ServiceDown`  
**Severity:** 🚨 Critical  
**SLO Impact:** Availability

### Symptoms

- Prometheus target shows DOWN
- Health checks failing
- Service not responding to requests
- Users cannot access the service

### Investigation Steps

1. **Check pod status:**
   ```bash
   kubectl get pods -n cloud-secrets-manager -l app=secret-service
   # or
   kubectl get pods -n cloud-secrets-manager -l app=audit-service
   ```

2. **Check recent events:**
   ```bash
   kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp' | tail -20
   ```

3. **Check pod logs:**
   ```bash
   kubectl logs -n cloud-secrets-manager -l app=secret-service --tail=100
   ```

4. **Describe pod for details:**
   ```bash
   kubectl describe pod <pod-name> -n cloud-secrets-manager
   ```

### Common Causes & Solutions

#### Cause 1: Pod CrashLoopBackOff

**Symptoms:** Pod restarts repeatedly

**Solution:**
```bash
# Check logs for errors
kubectl logs <pod-name> -n cloud-secrets-manager --previous

# Common issues:
# - Database connection failure → Check DB credentials, Cloud SQL proxy
# - Configuration error → Check ConfigMaps and Secrets
# - OOM Kill → Increase memory limits
```

#### Cause 2: Image Pull Error

**Symptoms:** `ImagePullBackOff` or `ErrImagePull`

**Solution:**
```bash
# Verify image exists
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images

# Check image pull secret
kubectl get secret artifact-registry-secret -n cloud-secrets-manager

# Recreate secret if needed (run from CI/CD or locally)
./scripts/create-image-pull-secret.sh
```

#### Cause 3: Resource Limits

**Symptoms:** Pod evicted due to resource pressure

**Solution:**
```bash
# Check resource usage
kubectl top pods -n cloud-secrets-manager

# Increase limits in Helm values
helm upgrade cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --set secretService.resources.limits.memory=1Gi \
  --set secretService.resources.limits.cpu=1000m \
  -n cloud-secrets-manager
```

#### Cause 4: Health Check Failures

**Symptoms:** Readiness probe failing

**Solution:**
```bash
# Test health endpoint manually
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager
curl http://localhost:8080/actuator/health

# Check database connectivity
# Check external dependencies
# Adjust probe timeouts if service is slow to start
```

### Escalation

- If issue persists > 15 minutes: Escalate to team lead
- If critical business impact: Escalate to director
- Consider rollback if related to recent deployment

---

## Runbook: High Error Rate

**Alert:** `HighErrorRate`  
**Severity:** 🔴 Critical  
**SLO Impact:** Error Rate (99% success)

### Symptoms

- Error rate > 1% (SLO violation)
- Increased 5xx responses
- Error budget depleting rapidly
- Users experiencing failures

### Investigation Steps

1. **Check Grafana dashboard:**
   - Navigate to "Overview & SLOs" dashboard
   - Identify which endpoints have errors
   - Check error rate by status code

2. **Query Prometheus for error details:**
   ```promql
   # Top error endpoints
   topk(5,
     sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (uri, method)
   )
   
   # Error rate by status code
   sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (status)
   ```

3. **Check application logs:**
   ```bash
   # Filter for errors
   kubectl logs -n cloud-secrets-manager -l app=secret-service \
     --tail=200 | grep -i error
   
   # Check for exceptions
   kubectl logs -n cloud-secrets-manager -l app=secret-service \
     --tail=200 | grep -i exception
   ```

### Common Causes & Solutions

#### Cause 1: Database Connection Issues

**Symptoms:** `Connection refused`, `Too many connections`, `Timeout`

**Solution:**
```bash
# Check Cloud SQL proxy logs
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy

# Check connection pool metrics
# Grafana → JVM & Database dashboard → Connection Pool section

# Increase connection pool size if needed
# Edit application.yml or Helm values
```

#### Cause 2: Dependent Service Failure

**Symptoms:** Audit service calls failing, external API timeouts

**Solution:**
```bash
# Check audit service health
kubectl get pods -n cloud-secrets-manager -l app=audit-service

# Check network policies
kubectl get networkpolicies -n cloud-secrets-manager

# Implement circuit breaker or graceful degradation
```

#### Cause 3: Resource Exhaustion

**Symptoms:** OOM errors, thread pool exhaustion

**Solution:**
```bash
# Check JVM metrics
# Grafana → JVM & Database dashboard

# Check for memory leaks
kubectl top pods -n cloud-secrets-manager

# Restart pod if memory leak suspected
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
```

#### Cause 4: Bad Deployment

**Symptoms:** Errors started after recent deployment

**Solution:**
```bash
# Rollback immediately
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Or rollback to specific version
helm history cloud-secrets-manager -n cloud-secrets-manager
helm rollback cloud-secrets-manager <revision> -n cloud-secrets-manager

# Verify rollback successful
kubectl rollout status deployment/secret-service -n cloud-secrets-manager
```

### Mitigation

1. **Immediate:** Rollback if recent deployment
2. **Short-term:** Implement circuit breaker, increase timeouts
3. **Long-term:** Fix root cause, improve error handling

---

## Runbook: High Latency

**Alert:** `HighLatencyP95` or `HighLatencyP99`  
**Severity:** ⚠️ Warning / 🔴 Critical  
**SLO Impact:** Latency (P95 < 500ms, P99 < 1s)

### Symptoms

- Response times exceeding SLO thresholds
- Users experiencing slow responses
- P95 > 500ms or P99 > 1s

### Investigation Steps

1. **Check latency dashboard:**
   ```promql
   # P95 latency by endpoint
   histogram_quantile(0.95,
     sum(rate(http_server_requests_seconds_bucket[5m])) by (le, uri)
   )
   ```

2. **Identify slow endpoints:**
   ```promql
   # Slowest endpoints
   topk(5,
     histogram_quantile(0.99,
       sum(rate(http_server_requests_seconds_bucket[5m])) by (le, uri)
     )
   )
   ```

3. **Check database query performance:**
   ```bash
   # Check slow queries in logs
   kubectl logs -n cloud-secrets-manager -l app=secret-service \
     | grep -i "slow query"
   
   # Check database connection acquisition time
   # Grafana → JVM & Database → Connection Acquisition Time
   ```

### Common Causes & Solutions

#### Cause 1: Slow Database Queries

**Solution:**
- Add missing indexes
- Optimize N+1 queries
- Implement caching
- Review query execution plans

#### Cause 2: High CPU Usage

**Solution:**
```bash
# Check CPU metrics
kubectl top pods -n cloud-secrets-manager

# Scale horizontally if needed
kubectl scale deployment/secret-service --replicas=3 -n cloud-secrets-manager

# Or use HPA (Horizontal Pod Autoscaler)
```

#### Cause 3: External API Latency

**Solution:**
- Implement caching
- Increase timeouts with circuit breaker
- Make external calls async
- Consider degraded mode

#### Cause 4: Lock Contention

**Solution:**
- Review synchronized blocks
- Optimize locking strategy
- Consider optimistic locking
- Profile application for contention

---

## Runbook: Database Connection Pool Issues

**Alert:** `HighDatabaseConnectionUsage` or `DatabaseConnectionPoolExhausted`  
**Severity:** ⚠️ Warning / 🔴 Critical

### Symptoms

- Connection pool utilization > 80%
- Pending connection requests
- Timeouts acquiring connections

### Investigation Steps

```bash
# Check connection pool metrics in Grafana
# Navigate to: JVM & Database dashboard

# Check for connection leaks
kubectl logs -n cloud-secrets-manager -l app=secret-service \
  | grep -i "connection.*leak"
```

**Prometheus Queries:**
```promql
# Pool utilization
hikaricp_connections_active / hikaricp_connections_max

# Pending connections
hikaricp_connections_pending
```

### Solutions

#### Solution 1: Increase Pool Size

```yaml
# In application.yml or via Helm values
spring:
  datasource:
    hikari:
      maximum-pool-size: 20  # Increase from 10
```

#### Solution 2: Fix Connection Leaks

- Review code for unclosed connections
- Ensure proper use of try-with-resources
- Check for long-running transactions

#### Solution 3: Optimize Queries

- Reduce query execution time
- Implement connection pooling best practices
- Consider read replicas for read-heavy workloads

---

## Runbook: Secret Rotation Failure

**Alert:** `SecretRotationFailed`  
**Severity:** ⚠️ Warning

### Symptoms

- Secret rotation job failures
- Metrics show rotation errors
- Old secrets not being rotated

### Investigation Steps

```bash
# Check logs for rotation errors
kubectl logs -n cloud-secrets-manager -l app=secret-service \
  | grep -i rotation

# Check rotation metrics
# Prometheus query:
increase(secret_rotation_failed_total[10m])
```

### Common Causes & Solutions

#### Cause 1: Encryption Key Issues

**Solution:**
- Verify KMS key accessibility
- Check service account permissions
- Validate key rotation policy

#### Cause 2: Database Lock Timeout

**Solution:**
- Increase lock timeout
- Retry with exponential backoff
- Schedule rotations during low-traffic periods

---

## Runbook: High Memory Usage

**Alert:** `HighMemoryUsage` or `PodNearOOMKilled`  
**Severity:** ⚠️ Warning / 🔴 Critical

### Investigation Steps

```bash
# Check current memory usage
kubectl top pods -n cloud-secrets-manager

# Check JVM heap usage
# Grafana → JVM & Database dashboard → Memory Usage

# Get heap dump if needed
kubectl exec <pod-name> -n cloud-secrets-manager -- \
  jmap -dump:live,format=b,file=/tmp/heap.hprof 1
```

### Solutions

#### Solution 1: Increase Memory Limits

```bash
helm upgrade cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --set secretService.resources.limits.memory=1Gi \
  -n cloud-secrets-manager
```

#### Solution 2: Optimize Memory Usage

- Review object lifecycles
- Implement caching strategies
- Tune JVM garbage collection
- Profile for memory leaks

#### Solution 3: Restart Pod (Temporary)

```bash
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
```

---

## Runbook: High CPU Usage

**Alert:** `HighCPUUsage`  
**Severity:** ⚠️ Warning

### Investigation Steps

```bash
# Check CPU usage
kubectl top pods -n cloud-secrets-manager

# Check for infinite loops or intensive operations
kubectl logs -n cloud-secrets-manager -l app=secret-service --tail=100
```

### Solutions

#### Solution 1: Scale Horizontally

```bash
kubectl scale deployment/secret-service --replicas=3 -n cloud-secrets-manager
```

#### Solution 2: Optimize Code

- Profile CPU hotspots
- Optimize algorithms
- Reduce unnecessary computations
- Implement caching

---

## Runbook: Audit Event Processing Lag

**Alert:** `AuditEventProcessingLag`  
**Severity:** ⚠️ Warning

### Symptoms

- Growing audit event queue
- Delayed audit logging
- Backlog of events

### Investigation Steps

```bash
# Check audit service logs
kubectl logs -n cloud-secrets-manager -l app=audit-service --tail=200

# Check queue size metric
# Prometheus: audit_event_queue_size
```

### Solutions

#### Solution 1: Scale Audit Service

```bash
kubectl scale deployment/audit-service --replicas=2 -n cloud-secrets-manager
```

#### Solution 2: Increase Processing Rate

- Optimize audit event processing
- Batch database inserts
- Increase thread pool size

#### Solution 3: Implement Dead Letter Queue

- Move failed events to DLQ
- Process DLQ separately
- Prevent blocking of new events

---

## General Response Workflow

### 1. Acknowledge

- Check alert in Grafana/Prometheus
- Assess severity and impact
- Acknowledge alert (if using alertmanager)

### 2. Investigate

- Follow runbook for specific alert
- Gather relevant data
- Identify root cause

### 3. Mitigate

- Apply immediate fix
- Consider rollback if needed
- Communicate with stakeholders

### 4. Resolve

- Fix root cause
- Verify metrics return to normal
- Close alert

### 5. Document

- Update incident log
- Conduct post-mortem if needed
- Update runbook if necessary

---

## Useful Commands

### Quick Diagnostics

```bash
# Check all pods
kubectl get pods -n cloud-secrets-manager

# Check all services
kubectl get svc -n cloud-secrets-manager

# Check recent events
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp' | tail -20

# Check logs
kubectl logs -n cloud-secrets-manager -l app=secret-service --tail=100 -f

# Check resource usage
kubectl top pods -n cloud-secrets-manager

# Port forward for local testing
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager
```

### Helm Commands

```bash
# Check release status
helm status cloud-secrets-manager -n cloud-secrets-manager

# View history
helm history cloud-secrets-manager -n cloud-secrets-manager

# Rollback
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Upgrade with new values
helm upgrade cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --values ./infrastructure/helm/cloud-secrets-manager/values.yaml \
  -n cloud-secrets-manager
```

---

## Escalation Contacts

| Severity | Contact | Response Time |
|----------|---------|---------------|
| Info | Solo Dev / On-call | Next business day |
| Warning | Solo Dev / On-call | Within 2 hours |
| Critical | Solo Dev + Team Lead | Immediate |
| Emergency | All hands | Immediate |

---

**Related Documentation:**
- [SLOs & Error Budgets](./SLOS_AND_ERROR_BUDGETS.md)
- [Operations Guide](../OPERATIONS_GUIDE.md)
- [Monitoring Setup](./MONITORING_SETUP.md)

---

**Last Updated:** November 22, 2025

