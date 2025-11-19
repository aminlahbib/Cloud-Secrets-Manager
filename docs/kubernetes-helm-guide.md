# Kubernetes & Helm Deployment Guide ☸️

Complete guide for deploying Cloud Secrets Manager to Kubernetes with health probes, Ingress, and Helm charts.

---

## Table of Contents

- [Health Probes Configuration](#health-probes-configuration)
- [Kubernetes Deployments](#kubernetes-deployments)
- [Ingress Setup with Nginx](#ingress-setup-with-nginx)
- [Helm Chart Deployment](#helm-chart-deployment)
- [Updated README](#updated-readme)

---

## 1️⃣ Health Probes Configuration

### Enable Spring Boot Actuator

Add to `application.yml` in both services:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      probes:
        enabled: true
```

This exposes:
- `/actuator/health/liveness` - Liveness probe
- `/actuator/health/readiness` - Readiness probe

### Secret Service Deployment with Probes

File: `k8s/secret-service-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: secret-service
  template:
    metadata:
      labels:
        app: secret-service
    spec:
      containers:
        - name: secret-service
          image: <YOUR_DOCKER_USERNAME>/secret-service:latest
          env:
            - name: SPRING_DATASOURCE_URL
              value: jdbc:postgresql://secrets-db:5432/secrets
            - name: SPRING_DATASOURCE_USERNAME
              value: secret_user
            - name: SPRING_DATASOURCE_PASSWORD
              value: secret_pw
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: cloud-secrets-config
                  key: JWT_SECRET
            - name: ENCRYPTION_KEY
              valueFrom:
                secretKeyRef:
                  name: cloud-secrets-config
                  key: AES_KEY
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
```

### Audit Service Deployment with Probes

File: `k8s/audit-service-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audit-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: audit-service
  template:
    metadata:
      labels:
        app: audit-service
    spec:
      containers:
        - name: audit-service
          image: <YOUR_DOCKER_USERNAME>/audit-service:latest
          env:
            - name: SPRING_DATASOURCE_URL
              value: jdbc:postgresql://audit-db:5432/audit
            - name: SPRING_DATASOURCE_USERNAME
              value: audit_user
            - name: SPRING_DATASOURCE_PASSWORD
              value: audit_pw
          ports:
            - containerPort: 8081
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8081
            initialDelaySeconds: 30
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8081
            initialDelaySeconds: 15
            periodSeconds: 10
```

### Apply Changes

```bash
kubectl apply -f k8s/secret-service-deployment.yaml
kubectl apply -f k8s/audit-service-deployment.yaml
```

---

## 2️⃣ Ingress + Nginx Domain Access (Minikube)

### Enable Ingress in Minikube

```bash
minikube addons enable ingress
```

Wait until ingress controller is running:

```bash
kubectl get pods -n ingress-nginx
```

### Create Ingress Resource

File: `k8s/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secrets-manager-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  ingressClassName: nginx
  rules:
    - host: secrets.local
      http:
        paths:
          - path: /(.*)
            pathType: Prefix
            backend:
              service:
                name: secret-service
                port:
                  number: 8080
```

Apply it:

```bash
kubectl apply -f k8s/ingress.yaml
```

### Add /etc/hosts Entry

Get Minikube IP:

```bash
minikube ip
# Example output: 192.168.49.2
```

Edit `/etc/hosts` (with sudo):

```bash
sudo nano /etc/hosts
```

Add:

```
192.168.49.2   secrets.local
```

### Access Through Ingress

Now you can access:

```bash
http://secrets.local/auth/login
http://secrets.local/api/secrets/...
```

---

## 3️⃣ Helm Chart for Cloud Deployment

### Directory Structure

At repo root:

```
helm/
 └─ cloud-secrets-manager/
      ├─ Chart.yaml
      ├─ values.yaml
      └─ templates/
           ├─ secret-config.yaml
           ├─ secret-service-deployment.yaml
           ├─ secret-service-service.yaml
           ├─ audit-service-deployment.yaml
           ├─ audit-service-service.yaml
           ├─ secrets-db.yaml
           ├─ audit-db.yaml
           └─ ingress.yaml
```

### Chart.yaml

```yaml
apiVersion: v2
name: cloud-secrets-manager
description: Cloud Secrets Manager (secret-service + audit-service + Postgres DBs)
type: application
version: 0.1.0
appVersion: "1.0.0"
```

### values.yaml

```yaml
image:
  repositorySecretService: "<YOUR_DOCKER_USERNAME>/secret-service"
  repositoryAuditService: "<YOUR_DOCKER_USERNAME>/audit-service"
  tag: "latest"
  pullPolicy: IfNotPresent

secretService:
  replicaCount: 1
  port: 8080

auditService:
  replicaCount: 1
  port: 8081

postgres:
  secretsDb:
    user: secret_user
    password: secret_pw
    db: secrets
  auditDb:
    user: audit_user
    password: audit_pw
    db: audit

jwtSecret: "mySuperStrongSecretKeyForJWT"
aesKey: "1234567890123456"

ingress:
  enabled: true
  host: "secrets.local"
```

### templates/secret-config.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cloud-secrets-config
type: Opaque
data:
  JWT_SECRET: {{ .Values.jwtSecret | b64enc }}
  AES_KEY: {{ .Values.aesKey | b64enc }}
```

### templates/secret-service-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-service
spec:
  replicas: {{ .Values.secretService.replicaCount }}
  selector:
    matchLabels:
      app: secret-service
  template:
    metadata:
      labels:
        app: secret-service
    spec:
      containers:
        - name: secret-service
          image: "{{ .Values.image.repositorySecretService }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          env:
            - name: SPRING_DATASOURCE_URL
              value: jdbc:postgresql://secrets-db:5432/{{ .Values.postgres.secretsDb.db }}
            - name: SPRING_DATASOURCE_USERNAME
              value: {{ .Values.postgres.secretsDb.user }}
            - name: SPRING_DATASOURCE_PASSWORD
              value: {{ .Values.postgres.secretsDb.password }}
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: cloud-secrets-config
                  key: JWT_SECRET
            - name: ENCRYPTION_KEY
              valueFrom:
                secretKeyRef:
                  name: cloud-secrets-config
                  key: AES_KEY
          ports:
            - containerPort: {{ .Values.secretService.port }}
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: {{ .Values.secretService.port }}
            initialDelaySeconds: 30
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: {{ .Values.secretService.port }}
            initialDelaySeconds: 15
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: secret-service
spec:
  selector:
    app: secret-service
  ports:
    - port: {{ .Values.secretService.port }}
      targetPort: {{ .Values.secretService.port }}
  type: ClusterIP
```

### templates/ingress.yaml

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secrets-manager-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  ingressClassName: nginx
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /(.*)
            pathType: Prefix
            backend:
              service:
                name: secret-service
                port:
                  number: {{ .Values.secretService.port }}
{{- end }}
```

### Install with Helm

From repo root:

```bash
cd helm
helm install secrets-manager ./cloud-secrets-manager

# Or upgrade after changes:
helm upgrade secrets-manager ./cloud-secrets-manager
```

Check deployment:

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```

### Override Values

```bash
helm install secrets-manager ./cloud-secrets-manager \
  --set image.repositorySecretService=myuser/secret-service \
  --set image.repositoryAuditService=myuser/audit-service \
  --set ingress.host=secrets.local
```

---

## 4️⃣ Updated README.md

# Cloud Secrets Manager (MVP)

A cloud-native **Secrets Manager** that allows developers to securely store and retrieve confidential information such as API keys, database passwords, and access tokens.  

The system is built as a set of containerized Spring Boot microservices and demonstrates:

- **12-Factor App** principles  
- **JWT-based authentication** & role-based access  
- **Encryption at rest** (AES)  
- **Automated CI/CD** using GitHub Actions  
- **Kubernetes deployment** (Minikube) with health probes & ingress  
- Optional **Helm chart** for cloud deployment

---

## ✨ Features

- 🔐 Secure storage of secrets (encrypted at rest with AES)
- ✅ JWT-based authentication and role-based access control
- 📜 Audit logging of all secret operations (create/read/delete)
- 🐳 Fully containerized with Docker & Docker Compose
- ☸️ Deployable to Kubernetes (Minikube, AKS, etc.)
- 🌐 Nginx Ingress with custom domain (e.g. `secrets.local`)

---

## 🧱 Architecture Overview

**Services:**

- **Secret Service**
  - REST API for managing secrets
  - JWT authentication & authorization
  - AES encryption/decryption
  - Writes audit events to the Audit Service

- **Audit Service**
  - Receives audit events from Secret Service
  - Persists logs to an Audit database
  - Provides API endpoint to query audit logs

**Databases:**

- `secrets-db` (PostgreSQL) – stores encrypted secrets  
- `audit-db` (PostgreSQL) – stores audit log entries  

**CI/CD & Infrastructure:**

- GitHub Actions builds & tests services
- Docker images pushed to Docker Hub
- Kubernetes deployment via manifests or Helm
- Optional Nginx Ingress for hostname routing

Architecture is documented in `docs/architecture.puml`.

---

## 🛠 Tech Stack

- Java 17/21, Spring Boot
- Spring Web, Spring Security, Spring Data JPA
- JWT (JSON Web Tokens)
- AES encryption
- PostgreSQL
- Docker & Docker Compose
- Kubernetes (Minikube) + Nginx Ingress
- Helm (optional)
- GitHub Actions (CI/CD)

---

## 📂 Repository Structure

```text
cloud-secrets-manager/
 ├─ secret-service/
 ├─ audit-service/
 ├─ k8s/
 │   ├─ secrets-db-deployment.yaml
 │   ├─ audit-db-deployment.yaml
 │   ├─ secret-service-deployment.yaml
 │   ├─ audit-service-deployment.yaml
 │   ├─ ingress.yaml
 │   └─ k8s-secrets.yaml
 ├─ helm/
 │   └─ cloud-secrets-manager/
 │        ├─ Chart.yaml
 │        ├─ values.yaml
 │        └─ templates/
 ├─ docs/
 │   └─ architecture.puml
 ├─ docker-compose.yml
 ├─ README.md
 └─ .github/workflows/ci-cd.yml
```

---

## 🚀 Getting Started (Local with Docker Compose)

### Prerequisites

- Java 17+
- Maven or Gradle
- Docker & Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/cloud-secrets-manager.git
cd cloud-secrets-manager
```

### 2. Build the services

```bash
cd secret-service
mvn clean package -DskipTests
cd ../audit-service
mvn clean package -DskipTests
cd ..
```

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

This starts:
- Secret Service → http://localhost:8080
- Audit Service → http://localhost:8081
- PostgreSQL databases for secrets and audit

### 4. Example API usage

```bash
# 1) Authenticate to get JWT
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# 2) Store a secret
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key": "db.password", "value": "myS3cretPw"}'

# 3) Retrieve a secret
curl -X GET "http://localhost:8080/api/secrets/db.password" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## ☸️ Kubernetes Deployment (Minikube)

### 1. Start Minikube

```bash
minikube start --memory=4096 --cpus=2
```

### 2. Build & Push Docker Images

```bash
# From repo root
cd secret-service
mvn clean package -DskipTests
docker build -t <DOCKER_USER>/secret-service:latest .
docker push <DOCKER_USER>/secret-service:latest

cd ../audit-service
mvn clean package -DskipTests
docker build -t <DOCKER_USER>/audit-service:latest .
docker push <DOCKER_USER>/audit-service:latest
```

### 3. Apply Kubernetes Secrets & Deployments

```bash
cd ../k8s
kubectl apply -f k8s-secrets.yaml
kubectl apply -f secrets-db-deployment.yaml
kubectl apply -f audit-db-deployment.yaml
kubectl apply -f audit-service-deployment.yaml
kubectl apply -f secret-service-deployment.yaml
```

Health probes are configured via:
- `livenessProbe` → `/actuator/health/liveness`
- `readinessProbe` → `/actuator/health/readiness`

You can check resources:

```bash
kubectl get pods
kubectl get svc
```

---

## 🌐 Ingress via Nginx (secrets.local)

### 1. Enable Ingress in Minikube

```bash
minikube addons enable ingress
```

Wait for ingress controller:

```bash
kubectl get pods -n ingress-nginx
```

### 2. Apply Ingress

```bash
kubectl apply -f ingress.yaml
kubectl get ingress
```

### 3. Edit /etc/hosts

Get Minikube IP:

```bash
minikube ip
```

Add entry (example):

```
192.168.49.2   secrets.local
```

### 4. Access through Ingress

Now you can call:

```bash
curl http://secrets.local/auth/login
curl http://secrets.local/api/secrets/...
```

---

## ⎈ Helm Chart Deployment

The project includes a Helm chart for deploying all components as a single release.

### 1. Install Helm (if needed)

```bash
# macOS (brew example)
brew install helm
```

### 2. Install the chart

From repo root:

```bash
cd helm
helm install secrets-manager ./cloud-secrets-manager

# or upgrade later
helm upgrade secrets-manager ./cloud-secrets-manager
```

You can override values:

```bash
helm install secrets-manager ./cloud-secrets-manager \
  --set image.repositorySecretService=<DOCKER_USER>/secret-service \
  --set image.repositoryAuditService=<DOCKER_USER>/audit-service \
  --set ingress.host=secrets.local
```

### 3. Verify

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```

---

## 🔁 CI/CD with GitHub Actions

CI/CD pipeline (`.github/workflows/ci-cd.yml`) provides:
- Build & test for both services on every push/PR
- Docker image build & push on main branch
- Optional webhook call to trigger deployment (e.g. Render/Railway/Azure)

Secrets used:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- optional: `DEPLOY_HOOK_URL`

---

## ✅ Tests

Run tests locally:

```bash
cd secret-service
mvn test

cd ../audit-service
mvn test
```

---

## 📜 License

MIT (or your chosen license)

---

## 🎯 Next Steps

- Add **Helm values** for different environments (dev/prod)  
- Add **role-based authorization** (e.g. USER vs ADMIN)  
- Draft a **presentation outline** for your final project demo

**Happy deploying!** 🚀☸️