# Scripts Directory 📜

This directory contains utility scripts for development and testing.

---

## 📁 Directory Structure

```
scripts/
├── dev/              # Development utilities
│   ├── set-java-21.sh
│   └── stop-app.sh
├── testing/          # Testing scripts
│   ├── test-auth.sh
│   └── test-google-cloud-setup.sh
├── deployment/       # Deployment setup scripts
│   └── setup-kubernetes-secrets.sh
└── README.md         # This file
```

---

## 🛠 Development Scripts (`dev/`)

### `set-java-21.sh`
Sets Java 21 environment for the current session.

**Usage:**
```bash
source scripts/dev/set-java-21.sh
```

**What it does:**
- Sets `JAVA_HOME` to Java 21
- Updates `PATH` to use Java 21
- Shows current Java version

**Note:** To make it permanent, add the export commands to your `~/.zshrc` or `~/.bashrc`.

---

### `stop-app.sh`
Stops the application running on port 8080.

**Usage:**
```bash
./scripts/dev/stop-app.sh
```

**What it does:**
- Finds process running on port 8080
- Kills the process
- Verifies the port is free

---

## 🚀 Deployment Scripts (`deployment/`)

### `setup-kubernetes-secrets.sh`

Automated setup of Kubernetes secrets for Google Identity Platform deployment.

**Usage:**
```bash
./scripts/deployment/setup-kubernetes-secrets.sh
```

**What it does:**
- ✅ Checks if kubectl is installed
- ✅ Verifies service account JSON file exists
- ✅ Creates `google-service-account` secret
- ✅ Generates secure JWT_SECRET and AES_KEY
- ✅ Creates `cloud-secrets-config` secret
- ✅ Verifies all secrets are created correctly

**Requirements:**
- kubectl installed and configured
- Service account JSON file at `apps/backend/secret-service/src/main/resources/service-account.json`
- Access to Kubernetes cluster

**Example:**
```bash
cd "/Users/amine/Developer/CSM-Project/Cloud Secrets Manager"
./scripts/deployment/setup-kubernetes-secrets.sh
```

---

## 🧪 Testing Scripts (`testing/`)

### `test-auth.sh`
Quick script to test authentication setup.

**Usage:**
```bash
./scripts/testing/test-auth.sh
```

**What it does:**
- Checks if application is running
- Checks health endpoint
- Provides next steps for authentication testing

**Environment Variables:**
- `BASE_URL` - API base URL (default: `http://localhost:8080`)

---

### `test-google-cloud-setup.sh`
Comprehensive script to verify Google Cloud Identity Platform setup.

**Usage:**
```bash
./scripts/testing/test-google-cloud-setup.sh
```

**What it does:**
- Checks service account file exists and is valid
- Verifies application configuration
- Checks if application is running
- Provides Google Cloud Console links
- Shows next steps

**Checks:**
1. ✅ Service account file exists
2. ✅ Application configuration
3. ✅ Application running
4. 📋 Google Cloud Console links

---

## 🚀 Quick Reference

### Development Workflow

```bash
# Set Java 21
source scripts/dev/set-java-21.sh

# Start application
docker-compose up

# Stop application
./scripts/dev/stop-app.sh
```

### Testing Workflow

```bash
# Test Google Cloud setup
./scripts/testing/test-google-cloud-setup.sh

# Test authentication
./scripts/testing/test-auth.sh
```

---

## 📚 Related Documentation

- **[Google Identity Setup](docs/current/GOOGLE_IDENTITY_SETUP.md)** - Complete setup guide
- **[Deployment Setup](docs/deployment/GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)** - Kubernetes/Helm deployment guide
- **[Postman Collection](../testing/postman/README.md)** - API testing with Postman

---

**Last Updated:** November 21, 2025

