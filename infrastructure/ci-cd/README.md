# CI/CD Infrastructure

This directory contains CI/CD pipeline configurations.

## Contents

```
ci-cd/
├── cloudbuild.yaml              # Google Cloud Build (main)
├── cloudbuild-dev.yaml          # Development environment
├── cloudbuild-staging.yaml      # Staging environment
├── cloudbuild-production.yaml   # Production environment
└── scripts/
    └── setup-kubernetes-secrets.sh
```

## Pipelines

### Development
- Triggered on push to `develop` branch
- Builds and deploys to dev environment
- Runs integration tests

### Staging
- Triggered on push to `main` branch
- Builds and deploys to staging
- Runs full test suite
- Manual approval for production

### Production
- Triggered manually or after staging approval
- Blue-green deployment
- Automated rollback on failure

## Setup

1. Configure Google Cloud Build triggers
2. Set up required secrets in Secret Manager
3. Configure Kubernetes service accounts

See `docs/deployment/ci-cd/` for detailed setup instructions.

