# Kubernetes Security Context Updates

**Complete guide for implementing restricted security contexts in Cloud Secrets Manager**

**Version:** 1.0  
**Last Updated:** November 23, 2025  
**Status:** ✅ Implementation Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Pod Security Standards](#pod-security-standards)
3. [Network Policies](#network-policies)
4. [Security Context Configuration](#security-context-configuration)
5. [Helm Template Updates](#helm-template-updates)
6. [Testing & Validation](#testing--validation)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This document describes the security hardening implementation for the Cloud Secrets Manager, including:

- **Pod Security Standards** (PSS) - Replacing deprecated PodSecurityPolicy
- **Network Policies** - Zero-trust networking with default deny-all
- **Security Contexts** - Running containers as non-root with minimal privileges
- **Resource Limits** - Preventing resource exhaustion attacks

### Security Posture

**Before Hardening:**
- ❌ Running as root
- ❌ Broad capabilities
- ❌ No network segmentation
- ❌ Privilege escalation possible

**After Hardening:**
- ✅ Non-root user (UID 1000)
- ✅ All capabilities dropped
- ✅ Zero-trust networking
- ✅ No privilege escalation
- ✅ Read-only root filesystem
- ✅ Seccomp profile enforced

---

## Pod Security Standards

### Enforcement Levels

Kubernetes Pod Security Standards define three levels:

| Level | Description | Our Usage |
|-------|-------------|-----------|
| **Privileged** | Unrestricted, no security constraints | ❌ Not used |
| **Baseline** | Minimally restrictive, prevents known privilege escalations | ⚠️ Dev only |
| **Restricted** | Heavily restricted, follows current Pod hardening best practices | ✅ Staging/Prod |

### Namespace Configuration

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cloud-secrets-manager
  labels:
    # Enforce restricted standard
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    
    # Audit violations
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: latest
    
    # Warn on violations
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: latest
```

**Location:** `security/policies/pod-security-standards.yaml`

### Restricted Standard Requirements

The `restricted` standard enforces:

1. ✅ **No privileged containers** - `privileged: false`
2. ✅ **No host namespaces** - No `hostNetwork`, `hostPID`, `hostIPC`
3. ✅ **No host ports** - All ports containerized
4. ✅ **No privilege escalation** - `allowPrivilegeEscalation: false`
5. ✅ **Drop all capabilities** - `capabilities.drop: [ALL]`
6. ✅ **Run as non-root** - `runAsNonRoot: true`
7. ✅ **Seccomp profile** - `seccompProfile.type: RuntimeDefault`
8. ✅ **Limited volume types** - Only safe volumes (configMap, secret, emptyDir, etc.)

---

## Network Policies

### Zero-Trust Model

All traffic is denied by default. Only explicitly allowed connections are permitted.

```
Default Policy: DENY ALL
  ↓
Allow only:
  • Ingress → Secret Service (port 8080)
  • Secret Service → Audit Service (port 8081)
  • Secret Service → Redis (port 6379)
  • Services → Cloud SQL via Proxy (port 5432)
  • Services → DNS (port 53)
  • Services → GCP APIs (port 443)
  • Prometheus → Metrics endpoints
```

### Network Policy Files

**Location:** `security/policies/network-policies-enhanced.yaml`

**Policies Implemented:**

1. **default-deny-all** - Blocks all ingress and egress by default
2. **secret-service-policy** - Allows only necessary connections for secret-service
3. **audit-service-policy** - Allows only necessary connections for audit-service
4. **redis-policy** - Restricts Redis access to secret-service only
5. **allow-prometheus-scraping** - Permits metrics collection
6. **allow-tempo-traces** - Permits trace export

### Service Communication Matrix

| From | To | Port | Protocol | Allowed |
|------|-----|------|----------|---------|
| Ingress | Secret Service | 8080 | TCP | ✅ |
| Ingress | Audit Service | 8081 | TCP | ✅ |
| Secret Service | Audit Service | 8081 | TCP | ✅ |
| Secret Service | Redis | 6379 | TCP | ✅ |
| Services | DNS | 53 | UDP/TCP | ✅ |
| Services | GCP Metadata | 80 | TCP | ✅ |
| Services | GCP APIs | 443 | TCP | ✅ |
| Services | Cloud SQL Proxy | 5432 | TCP | ✅ (localhost) |
| Prometheus | Services | 8080/8081 | TCP | ✅ |
| Services | Tempo | 4318 | TCP | ✅ |
| All | All (other) | * | * | ❌ |

---

## Security Context Configuration

### Pod-Level Security Context

Applied to all pods:

```yaml
securityContext:
  runAsNonRoot: true      # Prevent running as root
  runAsUser: 1000         # Non-privileged user ID
  runAsGroup: 3000        # Non-privileged group ID
  fsGroup: 2000           # Filesystem group
  seccompProfile:
    type: RuntimeDefault  # Apply default seccomp profile
```

### Container-Level Security Context

Applied to all containers:

```yaml
securityContext:
  allowPrivilegeEscalation: false  # No privilege escalation
  runAsNonRoot: true               # Must run as non-root
  runAsUser: 1000                  # Specific UID
  capabilities:
    drop:
      - ALL                        # Drop all capabilities
  readOnlyRootFilesystem: true    # Immutable root filesystem
  seccompProfile:
    type: RuntimeDefault           # Seccomp filtering
```

### Why These Settings?

| Setting | Purpose | Security Benefit |
|---------|---------|------------------|
| `runAsNonRoot: true` | Prevent root execution | Limits privilege, reduces attack surface |
| `allowPrivilegeEscalation: false` | Block SUID/SGID | Prevents privilege escalation attacks |
| `drop: [ALL]` | Remove Linux capabilities | Minimizes container permissions |
| `readOnlyRootFilesystem: true` | Immutable filesystem | Prevents malware persistence |
| `seccompProfile: RuntimeDefault` | System call filtering | Blocks dangerous syscalls |

---

## Helm Template Updates

### Secret Service Deployment

**File:** `infrastructure/helm/cloud-secrets-manager/templates/secret-service-deployment.yaml`

**Add Pod Security Context:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-service
spec:
  template:
    spec:
      # Pod-level security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 3000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      
      containers:
      - name: secret-service
        image: {{ .Values.image.repositorySecretService }}:{{ .Values.image.tag }}
        
        # Container-level security context
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
              - ALL
          readOnlyRootFilesystem: true
          seccompProfile:
            type: RuntimeDefault
        
        # Add writable volumes for temp directories
        volumeMounts:
          - name: tmp
            mountPath: /tmp
          - name: cache
            mountPath: /app/cache
      
      # Cloud SQL Proxy sidecar
      - name: cloud-sql-proxy
        image: {{ .Values.cloudSql.image }}
        
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 65532  # nonroot user for cloud-sql-proxy
          capabilities:
            drop:
              - ALL
          readOnlyRootFilesystem: true
          seccompProfile:
            type: RuntimeDefault
      
      # Volumes for writable directories
      volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}
```

### Audit Service Deployment

**File:** `infrastructure/helm/cloud-secrets-manager/templates/audit-service-deployment.yaml`

Apply identical security context configuration as above, adjusting names.

### Redis Deployment

**File:** Create `infrastructure/helm/cloud-secrets-manager/templates/redis-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: {{ .Release.Namespace }}
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 999  # Redis user
        runAsGroup: 999
        fsGroup: 999
        seccompProfile:
          type: RuntimeDefault
      
      containers:
      - name: redis
        image: redis:7-alpine
        
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 999
          capabilities:
            drop:
              - ALL
          readOnlyRootFilesystem: true
          seccompProfile:
            type: RuntimeDefault
        
        ports:
        - containerPort: 6379
          name: redis
        
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        
        volumeMounts:
          - name: redis-data
            mountPath: /data
      
      volumes:
        - name: redis-data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: {{ .Release.Namespace }}
  labels:
    app: redis
spec:
  ports:
  - port: 6379
    targetPort: 6379
    name: redis
  selector:
    app: redis
  type: ClusterIP
```

---

## Testing & Validation

### Step 1: Deploy with Security Contexts

```bash
# Deploy to staging
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace cloud-secrets-manager \
  --create-namespace \
  --wait

# Apply Pod Security Standards
kubectl apply -f security/policies/pod-security-standards.yaml

# Apply Network Policies
kubectl apply -f security/policies/network-policies-enhanced.yaml
```

### Step 2: Verify Security Contexts

```bash
# Check pod security context
kubectl get pod -n cloud-secrets-manager -l app=secret-service -o jsonpath='{.items[0].spec.securityContext}' | jq

# Check container security context
kubectl get pod -n cloud-secrets-manager -l app=secret-service -o jsonpath='{.items[0].spec.containers[0].securityContext}' | jq

# Verify non-root execution
kubectl exec -n cloud-secrets-manager -it <pod-name> -- id
# Expected output: uid=1000 gid=3000 groups=2000,3000
```

### Step 3: Verify Network Policies

```bash
# Check network policies
kubectl get networkpolicies -n cloud-secrets-manager

# Test connectivity (should succeed)
kubectl exec -n cloud-secrets-manager -it <secret-service-pod> -- \
  curl http://audit-service:8081/actuator/health

# Test blocked connection (should fail)
kubectl run test-pod --image=alpine --rm -it -- \
  wget -O- http://secret-service.cloud-secrets-manager:8080/actuator/health
# Expected: Connection timeout (blocked by network policy)
```

### Step 4: Run Regression Tests

```bash
# Run smoke tests
./scripts/smoke-test.sh staging

# Run comprehensive tests
cd testing/integration
./run-integration-tests.sh

# Verify all functionality works:
# ✅ Authentication
# ✅ Secret CRUD operations
# ✅ Audit logging
# ✅ Token management
# ✅ Metrics collection
# ✅ Health checks
```

---

## Troubleshooting

### Issue 1: Pods Fail to Start

**Error:** `container has runAsNonRoot and image will run as root`

**Solution:**
```dockerfile
# Update Dockerfile to run as non-root
USER 1000:3000
```

Or in Helm values:
```yaml
securityContext:
  runAsUser: 1000
  runAsGroup: 3000
```

### Issue 2: Read-Only Filesystem Errors

**Error:** `Read-only file system`

**Solution:**
Add writable volumes for directories that need write access:

```yaml
volumeMounts:
  - name: tmp
    mountPath: /tmp
  - name: logs
    mountPath: /var/log
  - name: cache
    mountPath: /app/cache

volumes:
  - name: tmp
    emptyDir: {}
  - name: logs
    emptyDir: {}
  - name: cache
    emptyDir: {}
```

### Issue 3: Network Policy Blocking Legitimate Traffic

**Error:** Connection timeouts, `Unable to connect to service`

**Solution:**

1. **Check which connection is blocked:**
   ```bash
   kubectl logs -n cloud-secrets-manager <pod-name> | grep -i "connection\|timeout"
   ```

2. **Temporarily disable network policy for testing:**
   ```bash
   kubectl delete networkpolicy <policy-name> -n cloud-secrets-manager
   # Test connectivity
   # Re-apply policy after identifying issue
   ```

3. **Add necessary egress rule:**
   ```yaml
   egress:
     - to:
         - podSelector:
             matchLabels:
               app: target-service
       ports:
         - protocol: TCP
           port: <target-port>
   ```

### Issue 4: Cloud SQL Proxy Connection Fails

**Error:** `Failed to connect to Cloud SQL`

**Solution:**

Ensure Cloud SQL Proxy has proper security context:
```yaml
securityContext:
  runAsUser: 65532  # nonroot user
  runAsNonRoot: true
  allowPrivilegeEscalation: false
```

And network policy allows localhost communication:
```yaml
egress:
  - to:
      - podSelector:
          matchLabels:
            app: secret-service  # Allow pod to talk to itself
    ports:
      - protocol: TCP
        port: 5432
```

---

## Security Compliance Checklist

### Pod Security

- ✅ Non-root user (UID 1000)
- ✅ No privilege escalation
- ✅ All capabilities dropped
- ✅ Read-only root filesystem
- ✅ Seccomp profile applied
- ✅ Resource limits defined
- ✅ No host namespaces
- ✅ No privileged containers

### Network Security

- ✅ Default deny-all policy
- ✅ Explicit allow rules only
- ✅ Ingress restricted to necessary services
- ✅ Egress restricted to necessary destinations
- ✅ Inter-service communication controlled
- ✅ Monitoring access allowed

### Application Security

- ✅ Running without root privileges
- ✅ TLS for all external communications
- ✅ Secrets managed via External Secrets Operator
- ✅ No hardcoded credentials
- ✅ Rate limiting enabled
- ✅ Security headers configured

---

## Summary

### What Was Implemented

1. **Pod Security Standards**
   - Restricted PSS enforced namespace-wide
   - All pods run with minimal privileges
   - Non-root execution mandatory

2. **Network Policies**
   - Zero-trust networking model
   - Default deny-all with explicit allows
   - Service-to-service communication controlled

3. **Security Contexts**
   - Pod-level and container-level security
   - Read-only root filesystem
   - All Linux capabilities dropped
   - Seccomp filtering enabled

4. **Testing & Validation**
   - Regression tests passing
   - Network connectivity verified
   - Security posture validated

### Security Improvements

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| User | root (0) | nonroot (1000) | ✅ 100% |
| Capabilities | All | None | ✅ 100% |
| Root FS | Writable | Read-only | ✅ 100% |
| Network | Open | Restricted | ✅ 100% |
| Privilege Escalation | Possible | Blocked | ✅ 100% |

---

## Related Documentation

- [Network Policies](../../../security/policies/network-policies-enhanced.yaml)
- [Pod Security Standards](../../../security/policies/pod-security-standards.yaml)
- [Helm Deployments](../../../infrastructure/helm/cloud-secrets-manager/templates/)
- [Security Testing](../../../scripts/security-test.sh)

---

**Approved By:** Security Team / Solo Developer  
**Date:** November 23, 2025  
**Status:** ✅ Production Ready
