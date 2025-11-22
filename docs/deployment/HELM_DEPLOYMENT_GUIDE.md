# Application Deployment Guide (Helm)

This guide explains how to deploy the Cloud Secrets Manager application using Helm.

## Prerequisites

1.  **Infrastructure Ready**: Kubernetes cluster, Database, and Artifact Registry must be set up (via Terraform).
2.  **Secrets Synced**: External Secrets Operator must be installed and secrets (`csm-db-secrets`, `csm-app-config`, etc.) must be present in the `cloud-secrets-manager` namespace.
3.  **Docker Images**: `secret-service` and `audit-service` images must be pushed to Artifact Registry.

## Deployment Command

Run the following command from the project root to deploy the application:

```bash
helm upgrade --install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --namespace cloud-secrets-manager \
  --create-namespace \
  --values ./infrastructure/helm/cloud-secrets-manager/values.yaml
```

**Explanation of the command:**
- `helm upgrade --install`: This installs the chart if it's not there, or updates it if it already exists.
- `cloud-secrets-manager`: This is the name of the release.
- `./infrastructure/helm/cloud-secrets-manager`: The path to the Helm chart directory.
- `--namespace cloud-secrets-manager`: The Kubernetes namespace to deploy into.
- `--create-namespace`: Creates the namespace if it doesn't exist.
- `--values ...`: Uses the specified configuration file.

## Verification

After running the deployment command, you need to verify that everything started correctly.

### 1. Check Pod Status

```bash
kubectl get pods -n cloud-secrets-manager
```

**What to look for:**
- You should see pods named `secret-service-xxx` and `audit-service-xxx`.
- Status should be `Running`.
- Ready column should say `2/2` (meaning both the application and the Cloud SQL proxy sidecar are ready).

### 2. Check Application Logs

To confirm the application started successfully without errors:

```bash
# Check Secret Service logs
kubectl logs -l app=secret-service -n cloud-secrets-manager -c secret-service

# Check Audit Service logs
kubectl logs -l app=audit-service -n cloud-secrets-manager -c audit-service
```

**What to look for:**
- "Started SecretServiceApplication in ..."
- No connection errors to the database.

### 3. Verify Database Connection

If the logs show no errors, the application successfully connected to the database using the credentials from External Secrets.

## Management Commands

### Restarting the Application

If you pushed a new Docker image and need to restart the pods to pick it up:

```bash
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
kubectl rollout restart deployment/audit-service -n cloud-secrets-manager
```

### Scaling the Application

To increase the number of replicas (e.g., to 3):

```bash
kubectl scale deployment/secret-service --replicas=3 -n cloud-secrets-manager
```

### Uninstalling

To remove the application entirely:

```bash
helm uninstall cloud-secrets-manager -n cloud-secrets-manager
```

## Troubleshooting

**Issue: Pods stuck in `ContainerCreating`**
- Check if Artifact Registry permissions are correct.
- Check if `artifact-registry-secret` exists (if used) or if Workload Identity is set up on the nodes.

**Issue: Pods in `CrashLoopBackOff`**
- Check logs: `kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service`
- Check sidecar logs: `kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy`
- Verify secrets exist: `kubectl get secrets -n cloud-secrets-manager`

**Issue: "Secret not found"**
- Ensure you followed the External Secrets Setup guide.
- Run `kubectl get externalsecrets -n cloud-secrets-manager` to check sync status.

