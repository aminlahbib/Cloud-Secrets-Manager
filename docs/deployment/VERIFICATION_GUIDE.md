# Deployment Verification Guide

This guide explains how to verify that your Cloud Secrets Manager deployment is working correctly and all security features are properly configured.

## Quick Verification

Run the comprehensive verification script:

```bash
./scripts/verify-deployment.sh
```

This script checks:
- ✅ Prerequisites (kubectl, helm, cluster connection)
- ✅ Namespace and Pod Security Standards
- ✅ Helm release status
- ✅ Pod status and readiness
- ✅ Security context compliance (restricted mode)
- ✅ Network policies
- ✅ Services
- ✅ Secrets and External Secrets Operator
- ✅ Monitoring (ServiceMonitors, PrometheusRules)
- ✅ Application health
- ✅ Cloud SQL Proxy
- ✅ Ingress configuration
- ✅ Workload Identity
- ✅ Rolling update status

## Manual Verification Steps

### 1. Check Pod Status

```bash
kubectl get pods -n cloud-secrets-manager
```

Expected output:
- All pods should be in `Running` state
- Ready status should be `2/2` (application + Cloud SQL Proxy)
- No `CrashLoopBackOff` or `Error` states

### 2. Verify Security Contexts

Check that pods are running with restricted security contexts:

```bash
# Check pod-level security context
kubectl get pod <pod-name> -n cloud-secrets-manager -o jsonpath='{.spec.securityContext}'

# Check container-level security context
kubectl get pod <pod-name> -n cloud-secrets-manager -o jsonpath='{.spec.containers[*].securityContext}'
```

Expected:
- `runAsNonRoot: true`
- `runAsUser: 1000`
- `allowPrivilegeEscalation: false`
- `capabilities.drop: ["ALL"]`
- `seccompProfile.type: RuntimeDefault`

### 3. Verify Network Policies

```bash
kubectl get networkpolicies -n cloud-secrets-manager
```

Expected:
- `default-deny-all-ingress` - Denies all ingress by default
- `allow-ingress-to-secret-service` - Allows ingress to secret-service
- `allow-ingress-to-audit-service` - Allows ingress to audit-service
- `allow-egress-essential` - Allows essential egress (DNS, HTTPS, Cloud SQL)

### 4. Verify Pod Security Standards

```bash
kubectl get namespace cloud-secrets-manager -o jsonpath='{.metadata.labels}'
```

Expected labels:
- `pod-security.kubernetes.io/enforce: restricted`
- `pod-security.kubernetes.io/audit: restricted`
- `pod-security.kubernetes.io/warn: restricted`

### 5. Verify Workload Identity

```bash
# Check secret-service service account
kubectl get serviceaccount secret-service -n cloud-secrets-manager -o jsonpath='{.metadata.annotations}'

# Check audit-service service account
kubectl get serviceaccount audit-service -n cloud-secrets-manager -o jsonpath='{.metadata.annotations}'
```

Expected annotations:
- `iam.gke.io/gcp-service-account: secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
- `iam.gke.io/gcp-service-account: audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`

### 6. Verify Monitoring

```bash
# Check ServiceMonitors
kubectl get servicemonitors -n cloud-secrets-manager

# Check PrometheusRules
kubectl get prometheusrules -n cloud-secrets-manager
```

Expected:
- `secret-service-metrics` ServiceMonitor
- `audit-service-metrics` ServiceMonitor
- `cloud-secrets-manager-alerts` PrometheusRule

### 7. Verify Ingress Configuration

```bash
kubectl get ingress -n cloud-secrets-manager
kubectl get ingress secrets-manager-ingress -n cloud-secrets-manager -o jsonpath='{.metadata.annotations}'
```

Expected annotations:
- `nginx.ingress.kubernetes.io/limit-rps: "100"`
- `nginx.ingress.kubernetes.io/limit-connections: "10"`
- `nginx.ingress.kubernetes.io/force-ssl-redirect: "true"`
- `nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"`

### 8. Verify Application Health

```bash
# Port-forward to secret-service
kubectl port-forward -n cloud-secrets-manager svc/secret-service 8080:8080

# In another terminal, check health
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{
  "status": "UP"
}
```

### 9. Verify Cloud SQL Proxy

```bash
# Check Cloud SQL Proxy logs
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy --tail=20
```

Expected logs:
- `Authorizing with Application Default Credentials`
- `Listening on 127.0.0.1:5432`
- `The proxy has started successfully and is ready for new connections!`

### 10. Verify Secrets

```bash
# Check Kubernetes secrets
kubectl get secrets -n cloud-secrets-manager

# Check External Secrets
kubectl get externalsecrets -n cloud-secrets-manager
```

Expected secrets:
- `csm-db-secrets` - Database credentials
- `csm-app-config` - Application configuration

## Troubleshooting

### Pods Not Starting

**Symptom**: Pods in `CrashLoopBackOff` or `Error` state

**Check**:
```bash
kubectl describe pod <pod-name> -n cloud-secrets-manager
kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service
```

**Common causes**:
1. **Permission denied**: Docker image may not support non-root user (UID 1000)
   - **Solution**: Update Dockerfiles to create and use non-root user
2. **Database connection**: Application connecting before Cloud SQL Proxy is ready
   - **Solution**: Wait for Cloud SQL Proxy to be ready (normal during startup)
3. **Missing secrets**: Required secrets not found
   - **Solution**: Verify External Secrets Operator is syncing secrets

### Security Context Violations

**Symptom**: Warnings about Pod Security Standards violations

**Check**:
```bash
kubectl get pods -n cloud-secrets-manager -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext.runAsNonRoot}{"\n"}{end}'
```

**Solution**: Ensure Helm templates include proper security contexts (already configured in latest version)

### Network Policy Issues

**Symptom**: Pods cannot communicate

**Check**:
```bash
kubectl get networkpolicies -n cloud-secrets-manager
kubectl describe networkpolicy <policy-name> -n cloud-secrets-manager
```

**Solution**: Verify network policies allow required traffic

### Workload Identity Issues

**Symptom**: Cloud SQL Proxy authentication failures

**Check**:
```bash
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy
```

**Solution**: Verify service account annotations and GCP IAM bindings

## Continuous Monitoring

After initial verification, set up continuous monitoring:

1. **Prometheus**: Monitor application metrics
   ```bash
   kubectl port-forward -n monitoring svc/prometheus-k8s 9090:9090
   # Open http://localhost:9090
   ```

2. **Grafana**: Visualize metrics (if installed)
   ```bash
   kubectl port-forward -n monitoring svc/grafana 3000:3000
   # Open http://localhost:3000
   ```

3. **Alerts**: Check Prometheus alerts
   ```bash
   kubectl get prometheusrules -n cloud-secrets-manager
   ```

## Next Steps

- Review [Security Context Update Guide](./SECURITY_CONTEXT_UPDATE.md) for Docker image requirements
- Review [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md) for full deployment procedures
- Review [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) for all implemented features

---

**Last Updated**: November 22, 2025

