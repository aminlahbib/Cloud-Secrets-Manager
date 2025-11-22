#!/bin/bash

# Setup script for GitHub Actions CI/CD Service Account
# This script creates a service account with the required permissions for CI/CD

set -e

PROJECT_ID="cloud-secrets-manager"
SERVICE_ACCOUNT_NAME="github-actions-ci"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo "=== GitHub Actions CI/CD Service Account Setup ==="
echo ""

# Check if service account already exists
if gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "Service account ${SERVICE_ACCOUNT_EMAIL} already exists."
    read -p "Do you want to continue and update permissions? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "Creating service account: ${SERVICE_ACCOUNT_NAME}"
    gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
        --display-name="GitHub Actions CI/CD" \
        --project="${PROJECT_ID}"
    echo "✅ Service account created"
fi

echo ""
echo "Granting required IAM roles..."

# Grant Artifact Registry Writer role
echo "  - roles/artifactregistry.writer (push images)"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/artifactregistry.writer" \
    --condition=None \
    --quiet

# Grant Container Developer role (for GKE deployment)
echo "  - roles/container.developer (deploy to GKE)"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/container.developer" \
    --condition=None \
    --quiet

# Grant Service Account User role
echo "  - roles/iam.serviceAccountUser (use service accounts)"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/iam.serviceAccountUser" \
    --condition=None \
    --quiet

echo "✅ IAM roles granted"
echo ""

# Create and download key
echo "Creating service account key..."
if [ -f "${KEY_FILE}" ]; then
    read -p "Key file ${KEY_FILE} already exists. Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping key creation. Using existing file."
    else
        gcloud iam service-accounts keys create "${KEY_FILE}" \
            --iam-account="${SERVICE_ACCOUNT_EMAIL}" \
            --project="${PROJECT_ID}"
        echo "✅ Key created: ${KEY_FILE}"
    fi
else
    gcloud iam service-accounts keys create "${KEY_FILE}" \
        --iam-account="${SERVICE_ACCOUNT_EMAIL}" \
        --project="${PROJECT_ID}"
    echo "✅ Key created: ${KEY_FILE}"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Add the key to GitHub Secrets:"
echo "   - Go to: https://github.com/YOUR_REPO/settings/secrets/actions"
echo "   - Click 'New repository secret'"
echo "   - Name: GCP_SA_KEY"
echo "   - Value: Copy the entire contents of ${KEY_FILE}"
echo ""
echo "2. The key file contains sensitive credentials. Keep it secure!"
echo "   - Do NOT commit ${KEY_FILE} to Git"
echo "   - Delete it after adding to GitHub Secrets"
echo ""
echo "3. Test the pipeline by pushing to the main branch"
echo ""
echo "Key file location: $(pwd)/${KEY_FILE}"
echo ""

