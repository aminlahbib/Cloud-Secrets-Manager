# Service Level Objectives (SLOs) & Error Budgets

**Version:** 1.0  
**Last Updated:** November 22, 2025  
**Owner:** SRE Team / Solo Developer

---

## Table of Contents

1. [Overview](#overview)
2. [SLO Definitions](#slo-definitions)
3. [Error Budgets](#error-budgets)
4. [Measurement & Monitoring](#measurement--monitoring)
5. [SLO Violations & Response](#slo-violations--response)
6. [Review & Updates](#review--updates)

---

## Overview

### What are SLOs?

**Service Level Objectives (SLOs)** are target values or ranges for service level indicators (SLIs) that define the expected reliability and performance of our services.

### Why SLOs?

- **Quantify Reliability**: Clear, measurable targets for service health
- **Balance Innovation vs Stability**: Error budgets allow controlled risk-taking
- **Prioritize Work**: Focus engineering effort where it matters most
- **Customer Expectations**: Align internal goals with user needs

### SLO Philosophy

- **Realistic**: Based on actual user needs, not perfection
- **Measurable**: Clear metrics and thresholds
- **Actionable**: Violations trigger specific responses
- **Balanced**: Allow room for innovation and deployment

---

## SLO Definitions

### 1. Availability SLO

**Objective:** Services should be available 99% of the time

| Service | Target Availability | Allowed Downtime (30d) | Measurement |
|---------|--------------------|-----------------------|-------------|
| Secret Service | 99.0% | 7h 18m | `up{job="secret-service"} == 1` |
| Audit Service | 99.0% | 7h 18m | `up{job="audit-service"} == 1` |

**Success Criteria:**
- Service responds to health checks (`/actuator/health`)
- Service can handle requests (not returning 503)

**Prometheus Query:**
```promql
1 - (
  sum(rate(up{job="secret-service"}[30d] == 0))
  /
  count(up{job="secret-service"}[30d])
)
```

---

### 2. Error Rate SLO

**Objective:** 99% of requests should succeed (< 1% error rate)

| Service | Target Success Rate | Allowed Error Rate | Error Budget (monthly) |
|---------|--------------------|--------------------|----------------------|
| Secret Service | 99.0% | < 1.0% | 43.2 minutes |
| Audit Service | 99.0% | < 1.0% | 43.2 minutes |

**Success Criteria:**
- HTTP status codes 2xx or 3xx (not 5xx)
- Request completes successfully without server errors

**Prometheus Query:**
```promql
1 - (
  sum(rate(http_server_requests_seconds_count{job="secret-service",status=~"5.."}[30d]))
  /
  sum(rate(http_server_requests_seconds_count{job="secret-service"}[30d]))
)
```

---

### 3. Latency SLO

**Objective:** Fast response times for good user experience

#### P95 Latency (95th percentile)

| Service | Target | Measurement Window |
|---------|--------|-------------------|
| Secret Service | < 500ms | 5 minutes |
| Audit Service | < 500ms | 5 minutes |

**Success Criteria:**
- 95% of requests complete within 500ms

**Prometheus Query:**
```promql
histogram_quantile(0.95,
  sum(rate(http_server_requests_seconds_bucket{job="secret-service"}[5m])) by (le)
)
```

#### P99 Latency (99th percentile)

| Service | Target | Measurement Window |
|---------|--------|-------------------|
| Secret Service | < 1s | 5 minutes |
| Audit Service | < 1s | 5 minutes |

**Success Criteria:**
- 99% of requests complete within 1 second

**Prometheus Query:**
```promql
histogram_quantile(0.99,
  sum(rate(http_server_requests_seconds_bucket{job="secret-service"}[5m])) by (le)
)
```

---

### 4. Secret Operations SLO

**Objective:** Critical secret operations must succeed reliably

| Operation | Target Success Rate | Allowed Failure Rate |
|-----------|--------------------|--------------------|
| Secret Create | 99.5% | < 0.5% |
| Secret Read | 99.9% | < 0.1% |
| Secret Update | 99.5% | < 0.5% |
| Secret Delete | 99.5% | < 0.5% |
| Secret Rotation | 95.0% | < 5.0% |

**Success Criteria:**
- Operation completes without errors
- Data consistency maintained
- Audit trail created

**Custom Metrics:**
```promql
# Secret read success rate
sum(rate(secret_read_success_total[30d]))
/
sum(rate(secret_read_total[30d]))

# Rotation success rate
sum(rate(secret_rotation_success_total[30d]))
/
sum(rate(secret_rotation_total[30d]))
```

---

### 5. Database SLO

**Objective:** Database operations should be fast and reliable

| Metric | Target | Threshold |
|--------|--------|-----------|
| Connection Pool Utilization | < 80% | Warning at 70%, Critical at 80% |
| Query P95 Latency | < 100ms | Warning at 100ms, Critical at 500ms |
| Connection Acquisition Time | < 50ms | Warning at 50ms, Critical at 200ms |

**Success Criteria:**
- Sufficient available connections
- Fast query execution
- No connection pool exhaustion

---

## Error Budgets

### What is an Error Budget?

An **error budget** is the allowed amount of failure derived from your SLO.

**Formula:**
```
Error Budget = 100% - SLO Target
```

**For 99% SLO:**
```
Error Budget = 100% - 99% = 1%
```

### Error Budget Calculations

#### Monthly Error Budget (30 days)

| SLO | Error Budget | Time Allowed |
|-----|-------------|--------------|
| 99.0% | 1.0% | 7h 18m (432 minutes) |
| 99.5% | 0.5% | 3h 39m (216 minutes) |
| 99.9% | 0.1% | 43.2 minutes |
| 99.99% | 0.01% | 4.32 minutes |

#### Request-Based Error Budget

For a service receiving **1000 requests/minute**:

| SLO | Error Budget | Allowed Errors (per hour) | Allowed Errors (per day) |
|-----|-------------|---------------------------|-------------------------|
| 99.0% | 1.0% | 600 errors | 14,400 errors |
| 99.5% | 0.5% | 300 errors | 7,200 errors |
| 99.9% | 0.1% | 60 errors | 1,440 errors |

---

### Error Budget Policy

#### When Error Budget is Healthy (> 50% remaining)

✅ **Normal Operations:**
- Deploy changes normally
- Test new features in production
- Acceptable level of risk-taking
- Focus on innovation and velocity

#### When Error Budget is Low (10-50% remaining)

⚠️ **Caution Mode:**
- Increase deployment scrutiny
- More thorough testing required
- Defer non-critical changes
- Focus on stability fixes
- Review recent changes for issues

#### When Error Budget is Exhausted (< 10% remaining)

🚫 **Freeze Mode:**
- **STOP non-critical deployments**
- Emergency fixes only
- All hands on deck for stability
- Root cause analysis required
- Incident post-mortems mandatory
- Focus 100% on reliability improvements

---

### Burn Rate

**Burn rate** measures how fast you're consuming your error budget.

#### Fast Burn (Critical)

- **1% error rate for 1 hour = ~2.3% of monthly budget consumed**
- Alert: `ErrorBudgetBurn` (Critical)
- Action: Immediate investigation required

#### Slow Burn (Warning)

- **0.5% error rate sustained = warning level**
- Alert: `ErrorBudgetBurn` (Warning)
- Action: Monitor closely, prepare to intervene

**Prometheus Queries:**

```promql
# Fast burn (1-hour window)
(
  sum(rate(http_server_requests_seconds_count{status=~"5.."}[1h]))
  /
  sum(rate(http_server_requests_seconds_count[1h]))
) > 0.01

# Slow burn (6-hour window)
(
  sum(rate(http_server_requests_seconds_count{status=~"5.."}[6h]))
  /
  sum(rate(http_server_requests_seconds_count[6h]))
) > 0.005
```

---

## Measurement & Monitoring

### SLI Sources

1. **Prometheus Metrics:**
   - Request rates, error rates, latency
   - Resource utilization
   - Database performance

2. **Custom Application Metrics:**
   - Secret operation counters
   - Rotation success/failure
   - Audit event processing

3. **Kubernetes Metrics:**
   - Pod availability
   - Container restarts
   - Resource limits

### Dashboards

**Primary Dashboard:** "Cloud Secrets Manager - Overview & SLOs"
- Real-time SLO compliance
- Error budget remaining
- Burn rate indicators
- Key metrics at a glance

**Location:** Grafana → Dashboards → Cloud Secrets Manager

### Automated Monitoring

All SLOs have corresponding Prometheus alerts:

| SLO | Alert Name | Severity |
|-----|-----------|----------|
| Availability | `ServiceDown` | Critical |
| Error Rate | `HighErrorRate` | Critical |
| Error Budget | `ErrorBudgetBurn` | Warning/Critical |
| Latency P95 | `HighLatencyP95` | Warning |
| Latency P99 | `HighLatencyP99` | Critical |

---

## SLO Violations & Response

### Response Levels

#### Level 1: Informational (SLO met)

- **Status:** ✅ Green
- **Action:** None required
- **Example:** 99.5% availability, well above target

#### Level 2: Warning (Approaching SLO)

- **Status:** ⚠️ Yellow
- **Action:** Monitor, investigate trends
- **Example:** 99.2% availability (near 99% target)
- **Response Time:** Within 2 hours
- **Owner:** On-call engineer

#### Level 3: Violation (Below SLO)

- **Status:** 🔴 Red
- **Action:** Immediate investigation and remediation
- **Example:** 98.5% availability (below 99% target)
- **Response Time:** Immediate
- **Owner:** On-call + Team lead

#### Level 4: Critical Violation (Far below SLO)

- **Status:** 🚨 Critical
- **Action:** All hands on deck
- **Example:** 95% availability or major outage
- **Response Time:** Immediate escalation
- **Owner:** Entire team

---

### Response Playbook

#### Step 1: Assess

- Check dashboards and alerts
- Identify which SLO is violated
- Determine scope and impact
- Check error budget status

#### Step 2: Mitigate

- Follow relevant runbook
- Implement immediate fixes if known
- Consider rollback if recent deployment
- Enable circuit breakers if applicable

#### Step 3: Communicate

- Update status page
- Notify stakeholders
- Document actions in incident log
- Provide ETR (Estimated Time to Resolution)

#### Step 4: Resolve

- Fix root cause
- Verify SLO returns to normal
- Confirm error budget stabilizes
- Run smoke tests

#### Step 5: Post-Mortem

- Conduct blameless post-mortem
- Document timeline and impact
- Identify prevention measures
- Update runbooks if needed
- Implement long-term fixes

---

## Review & Updates

### Quarterly SLO Review

**Schedule:** Every 3 months

**Review Items:**
- Are SLOs still realistic?
- Are we meeting targets consistently?
- Are SLOs too strict or too lenient?
- Do they align with user expectations?
- Should we add new SLOs?

**Adjustment Criteria:**
- **Consistently exceeding target (99.9%+ when target is 99%):**
  - Consider raising SLO target
  - Or invest effort elsewhere

- **Consistently missing target:**
  - Improve reliability
  - Or lower SLO target if unrealistic
  - Requires executive approval

### Documentation

- Update this document with any SLO changes
- Notify all stakeholders
- Update Prometheus alert thresholds
- Update dashboards

---

## Summary

| Service | Availability SLO | Error Rate SLO | Latency P95 SLO | Latency P99 SLO |
|---------|-----------------|---------------|----------------|----------------|
| **Secret Service** | 99.0% | < 1.0% | < 500ms | < 1s |
| **Audit Service** | 99.0% | < 1.0% | < 500ms | < 1s |

**Error Budget:** 1% (7h 18m per month)

**Key Principles:**
- SLOs are **targets**, not guarantees
- Error budgets enable **innovation**
- Violations require **action**
- Regular **review** ensures relevance

---

**Next Steps:**

1. ✅ Monitor SLO compliance in Grafana dashboards
2. ✅ Respond to SLO alerts per playbook
3. ✅ Review error budget weekly
4. ✅ Conduct quarterly SLO reviews
5. ✅ Update runbooks based on incidents

---

**Related Documentation:**
- [Prometheus Alert Rules](../../monitoring/alerts/prometheus-rules.yaml)
- [Grafana Dashboards](../../monitoring/grafana/dashboards/)
- [Runbooks](./RUNBOOKS.md)
- [Operations Guide](../OPERATIONS_GUIDE.md)

---

**Approval:**
- Solo Developer / Team Lead: [Your Name]
- Date: November 22, 2025

