# Docker Build Architecture Fix

## Problem
The Docker images were built for ARM64 (Apple Silicon), but GKE nodes run x86_64/amd64, causing "exec format error".

## Solution: Rebuild for linux/amd64

Rebuild both images with the `--platform` flag:

```bash
# Rebuild secret-service for linux/amd64
cd apps/backend/secret-service
docker build --platform linux/amd64 -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

# Rebuild audit-service for linux/amd64
cd ../audit-service
docker build --platform linux/amd64 -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest
```

## Alternative: Use Docker Buildx for Multi-Arch

If you want to support both architectures:

```bash
docker buildx create --use --name multiarch
docker buildx build --platform linux/amd64,linux/arm64 -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest --push .
```

## After Rebuilding

Once images are rebuilt and pushed, delete the pods to force them to pull the new images:

```bash
kubectl delete pods -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service
kubectl delete pods -n cloud-secrets-manager -l app.kubernetes.io/name=audit-service
```

The deployments will automatically create new pods with the correct architecture images.

