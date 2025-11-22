# Pod Security Context Update

## Overview

The Helm deployment templates have been updated to comply with Kubernetes Pod Security Standards (restricted mode). This ensures all pods meet the most restrictive security requirements.

## Changes Made

### Security Contexts Added

Both `secret-service-deployment.yaml` and `audit-service-deployment.yaml` have been updated with:

#### Pod-Level Security Context
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault
```

#### Container-Level Security Context (for all containers)
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  seccompProfile:
    type: RuntimeDefault
```

## Important Notes

### Docker Image Requirements

**⚠️ Critical**: The Docker images must support running as a non-root user (UID 1000). If your images are currently built to run as root, you may need to update the Dockerfiles.

#### Option 1: Update Dockerfiles (Recommended)

Add to your Dockerfiles before the `ENTRYPOINT`:

```dockerfile
# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Change ownership of app directory
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser
```

#### Option 2: Test Current Images

If your images already support non-root execution, you can test by deploying:

```bash
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager
```

If pods fail to start with permission errors, you'll need to update the Dockerfiles.

## Deployment

### Apply Updated Templates

```bash
# Upgrade Helm release with new security contexts
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager

# Restart pods to apply new security contexts
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
kubectl rollout restart deployment/audit-service -n cloud-secrets-manager

# Verify pods start successfully
kubectl get pods -n cloud-secrets-manager -w
```

### Verify Compliance

```bash
# Run verification script
./scripts/verify-deployment.sh

# Or manually check
kubectl get pods -n cloud-secrets-manager
kubectl describe pod <pod-name> -n cloud-secrets-manager | grep -A 10 "Security Context"
```

## Troubleshooting

### Pods Fail to Start

**Symptom**: Pods show `CreateContainerConfigError` or `Error` status.

**Possible Causes**:
1. Docker image requires root permissions
2. File system permissions issues
3. Missing user in container image

**Solution**:
1. Check pod logs: `kubectl logs <pod-name> -n cloud-secrets-manager`
2. Check pod events: `kubectl describe pod <pod-name> -n cloud-secrets-manager`
3. Update Dockerfiles to support non-root user (see above)

### Permission Denied Errors

**Symptom**: Application logs show "Permission denied" errors.

**Solution**:
- Ensure Dockerfiles create and use a non-root user
- Verify file permissions in the container
- Check that `/app` directory is owned by UID 1000

### Cloud SQL Proxy Issues

**Symptom**: Cloud SQL Proxy fails to connect.

**Solution**:
- Cloud SQL Proxy should work with non-root user
- Verify Workload Identity is configured correctly
- Check service account permissions

## Verification

After deployment, verify security compliance:

```bash
# Check pod security compliance
kubectl get pods -n cloud-secrets-manager -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext.runAsNonRoot}{"\n"}{end}'

# Check container security contexts
kubectl get pod <pod-name> -n cloud-secrets-manager -o jsonpath='{.spec.containers[*].securityContext}'

# Run comprehensive verification
./scripts/verify-deployment.sh
```

## Rollback

If you need to rollback to the previous version:

```bash
# Rollback Helm release
helm rollback cloud-secrets-manager -n cloud-secrets-manager

# Or manually remove security contexts from templates and redeploy
```

## Related Documentation

- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Security Contexts](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)
- [Next Steps Guide](./NEXT_STEPS.md)

---

**Last Updated**: November 22, 2025  
**Status**: Security contexts added, Docker image updates may be required

