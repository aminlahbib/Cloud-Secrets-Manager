# External Secrets Operator Setup

This guide explains how to replace local Kubernetes secrets (or Sealed Secrets) with **External Secrets Operator (ESO)**, using **Google Secret Manager** as the backend.

## Architecture

1.  **Google Secret Manager (GSM)**: Stores the actual secret values (Source of Truth).
2.  **External Secrets Operator (ESO)**: Runs in the cluster, authenticates to GSM via Workload Identity.
3.  **ExternalSecret Resources**: Define which secrets to fetch from GSM.
4.  **Kubernetes Secrets**: Automatically created and kept in sync by ESO.

## Prerequisites

The infrastructure is managed via Terraform. Ensure you have applied the latest Terraform configuration which includes:
- Enabling `secretmanager.googleapis.com`.
- Creating the `external-secrets` Service Account with `roles/secretmanager.secretAccessor`.
- Installing the `external-secrets` Helm chart.
- Configuring Workload Identity.

## Step 1: Create Secrets in Google Secret Manager

Before applying the Kubernetes manifests, you must create the secrets in your Google Cloud Project.

Run the following commands (or use the Console):

```bash
# Database Credentials
printf "secret_user" | gcloud secrets create secrets-db-user --data-file=-
printf "secret_pw" | gcloud secrets create secrets-db-password --data-file=-
printf "audit_user" | gcloud secrets create audit-db-user --data-file=-
printf "audit_pw" | gcloud secrets create audit-db-password --data-file=-

# App Config
printf "your-jwt-secret-here" | gcloud secrets create jwt-secret --data-file=-
printf "your-aes-key-here" | gcloud secrets create aes-key --data-file=-
printf "your-project-id" | gcloud secrets create google-project-id --data-file=-
# Optional
printf "your-api-key" | gcloud secrets create google-api-key --data-file=-

# Service Account JSON
gcloud secrets create google-service-account-json --data-file=path/to/service-account.json
```

## Step 2: Apply Terraform

Update your infrastructure to install ESO and the ClusterSecretStore.

```bash
cd infrastructure/terraform/environments/dev
terraform apply
```

This will:
1. Install External Secrets Operator via Helm.
2. Configure IAM permissions.
3. Create the `ClusterSecretStore` named `gcp-secret-manager`.

## Step 3: Migrate to External Secrets

1.  **Delete existing secrets** to allow ESO to take over:

    ```bash
    kubectl delete secret csm-db-secrets -n cloud-secrets-manager
    kubectl delete secret csm-app-config -n cloud-secrets-manager
    kubectl delete secret csm-google-service-account -n cloud-secrets-manager
    ```

2.  **Apply the ExternalSecret manifests**:

    ```bash
    kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml
    ```

## Step 4: Verification

Check if the ExternalSecrets are synchronized:

```bash
kubectl get externalsecrets -n cloud-secrets-manager
```

You should see status `SecretSynced`.

Check if the Kubernetes Secrets are created:

```bash
kubectl get secrets -n cloud-secrets-manager
```

