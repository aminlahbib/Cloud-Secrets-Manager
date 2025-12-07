# Security & Secrets 101 for Cloud Secrets Manager

**Level:** Intermediate  
**Time:** 2-3 hours  
**Prerequisites:** Kubernetes 101, Terraform 101, Firebase 101

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Google Secret Manager](#2-google-secret-manager)
3. [External Secrets Operator](#3-external-secrets-operator)
4. [Workload Identity](#4-workload-identity)
5. [Network Policies](#5-network-policies)
6. [Pod Security Standards](#6-pod-security-standards)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Best Practices](#8-best-practices)

---

## 1. Security Overview

### Security Layers in Cloud Secrets Manager

```mermaid
graph TB
    subgraph "Security Layers"
        L1[Layer 1: Network Security]
        L2[Layer 2: Authentication]
        L3[Layer 3: Authorization]
        L4[Layer 4: Data Encryption]
        L5[Layer 5: Audit Logging]
    end
    
    L1 --> L2 --> L3 --> L4 --> L5
    
    subgraph "Implementations"
        I1[VPC, Network Policies<br/>Ingress rules]
        I2[Firebase Auth<br/>ID Tokens]
        I3[RBAC, Custom Claims<br/>Service Accounts]
        I4[AES-256-GCM<br/>TLS 1.3]
        I5[Audit Service<br/>Cloud Logging]
    end
    
    L1 --- I1
    L2 --- I2
    L3 --- I3
    L4 --- I4
    L5 --- I5
    
    style L1 fill:#EA4335,color:#fff
    style L2 fill:#FBBC04,color:#000
    style L3 fill:#34A853,color:#fff
    style L4 fill:#4285F4,color:#fff
    style L5 fill:#9334E6,color:#fff
```

### Zero Trust Architecture

```mermaid
graph LR
    subgraph "Zero Trust Principles"
        A[Never Trust]
        B[Always Verify]
        C[Least Privilege]
        D[Assume Breach]
    end
    
    subgraph "Implementation"
        A1[No implicit trust<br/>between services]
        B1[Validate every<br/>request with JWT]
        C1[Minimal IAM<br/>permissions]
        D1[Audit all access<br/>Encrypt at rest]
    end
    
    A --> A1
    B --> B1
    C --> C1
    D --> D1
```

---

## 2. Google Secret Manager

### What is Google Secret Manager?

Google Secret Manager is a fully managed service for storing API keys, passwords, certificates, and other sensitive data.

```mermaid
graph TB
    subgraph "Secret Manager"
        SM[Secret Manager API]
        
        subgraph "Secrets"
            S1[db-password]
            S2[jwt-secret]
            S3[firebase-key]
        end
        
        subgraph "Versions"
            V1[v1 - active]
            V2[v2 - active]
            V3[v3 - disabled]
        end
    end
    
    subgraph "Access"
        SA[Service Account]
        WI[Workload Identity]
        GKE[GKE Pods]
    end
    
    SM --> S1
    SM --> S2
    SM --> S3
    S1 --> V1
    S1 --> V2
    S1 --> V3
    
    GKE -->|WI| SA -->|IAM| SM
    
    style SM fill:#4285F4,color:#fff
    style WI fill:#34A853,color:#fff
```

### Creating Secrets with Terraform

```hcl
# infrastructure/terraform/modules/secrets/main.tf

# Create a secret
resource "google_secret_manager_secret" "db_password" {
  secret_id = "csm-db-password"
  project   = var.project_id
  
  replication {
    auto {}
  }
  
  labels = {
    environment = var.environment
    app         = "cloud-secrets-manager"
  }
}

# Add a version (the actual value)
resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password  # From tfvars or vault
}

# Grant access to service account
resource "google_secret_manager_secret_iam_member" "accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.service_account_email}"
}
```

### Accessing Secrets from Java

```java
// Using Google Cloud SDK
import com.google.cloud.secretmanager.v1.*;

@Service
public class SecretManagerService {
    
    private final SecretManagerServiceClient client;
    
    public String getSecret(String secretId) {
        String name = String.format(
            "projects/%s/secrets/%s/versions/latest",
            projectId, secretId
        );
        
        AccessSecretVersionResponse response = 
            client.accessSecretVersion(name);
            
        return response.getPayload().getData().toStringUtf8();
    }
}
```

---

## 3. External Secrets Operator

### Why External Secrets Operator?

ESO syncs secrets from Google Secret Manager to Kubernetes Secrets.

```mermaid
sequenceDiagram
    participant GSM as Google Secret Manager
    participant ESO as External Secrets Operator
    participant K8S as Kubernetes Secret
    participant POD as Application Pod
    
    Note over ESO: Runs in cluster
    
    loop Every 1 hour (configurable)
        ESO->>GSM: Fetch secret value
        GSM->>ESO: Return encrypted value
        ESO->>K8S: Create/Update Secret
    end
    
    POD->>K8S: Mount as env/volume
    K8S->>POD: Inject secret value
```

### Architecture

```mermaid
graph TB
    subgraph "Google Cloud"
        GSM[Secret Manager]
        SA[Service Account]
    end
    
    subgraph "Kubernetes Cluster"
        subgraph "external-secrets namespace"
            ESO[ESO Controller]
            CSS[ClusterSecretStore]
        end
        
        subgraph "csm namespace"
            ES[ExternalSecret]
            K8S_SEC[Kubernetes Secret]
            POD[secret-service Pod]
        end
    end
    
    ESO -->|Workload Identity| SA
    SA -->|IAM| GSM
    
    CSS -->|Config| ESO
    ES -->|References| CSS
    ESO -->|Creates| K8S_SEC
    POD -->|Mounts| K8S_SEC
    
    style ESO fill:#326CE5,color:#fff
    style GSM fill:#4285F4,color:#fff
```

### ClusterSecretStore Configuration

```yaml
# infrastructure/kubernetes/k8s/external-secrets.yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: gcp-secret-store
spec:
  provider:
    gcpsm:
      projectID: cloud-secrets-manager
      auth:
        workloadIdentity:
          clusterLocation: us-central1
          clusterName: csm-cluster
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

### ExternalSecret Definition

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: csm-secrets
  namespace: csm
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secret-store
    kind: ClusterSecretStore
  target:
    name: csm-secrets          # K8s Secret name
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD   # Key in K8s Secret
      remoteRef:
        key: csm-db-password   # Secret Manager secret name
        version: latest
    
    - secretKey: JWT_SECRET
      remoteRef:
        key: csm-jwt-secret
        version: latest
```

---

## 4. Workload Identity

### What is Workload Identity?

Workload Identity allows Kubernetes pods to authenticate as GCP service accounts without key files.

```mermaid
graph TB
    subgraph "Traditional (Insecure)"
        POD1[Pod]
        KEY1[Service Account<br/>Key JSON File]
        GCP1[GCP API]
        
        POD1 -->|Contains| KEY1
        KEY1 -->|Authenticate| GCP1
    end
    
    subgraph "Workload Identity (Secure)"
        POD2[Pod]
        KSA[K8s Service Account]
        GSA[GCP Service Account]
        GCP2[GCP API]
        
        POD2 -->|Uses| KSA
        KSA -->|Bound to| GSA
        GSA -->|Authenticate| GCP2
    end
    
    style KEY1 fill:#EA4335,color:#fff
    style KSA fill:#34A853,color:#fff
    style GSA fill:#4285F4,color:#fff
```

### Setup Flow

```mermaid
sequenceDiagram
    participant TF as Terraform
    participant GKE as GKE Cluster
    participant GSA as GCP Service Account
    participant KSA as K8s Service Account
    participant POD as Pod
    
    TF->>GKE: Enable Workload Identity
    TF->>GSA: Create GCP SA with IAM roles
    TF->>KSA: Create K8s SA with annotation
    TF->>GSA: Bind KSA to GSA
    
    POD->>KSA: Uses serviceAccountName
    KSA->>GSA: Workload Identity Federation
    GSA->>POD: Temporary credentials
```

### Terraform Configuration

```hcl
# Enable Workload Identity on cluster
resource "google_container_cluster" "primary" {
  name = "csm-cluster"
  
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

# GCP Service Account
resource "google_service_account" "secret_service" {
  account_id   = "secret-service-sa"
  display_name = "Secret Service SA"
}

# Grant Secret Manager access
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.secret_service.email}"
}

# Bind K8s SA to GCP SA
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.secret_service.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[csm/secret-service-sa]"
}
```

### Kubernetes Service Account

```yaml
# infrastructure/helm/cloud-secrets-manager/templates/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: secret-service-sa
  namespace: csm
  annotations:
    iam.gke.io/gcp-service-account: secret-service-sa@PROJECT_ID.iam.gserviceaccount.com
```

---

## 5. Network Policies

### Default Deny All

```mermaid
graph TB
    subgraph "Without Network Policy"
        A1[Pod A] <-->|Allowed| B1[Pod B]
        A1 <-->|Allowed| C1[Pod C]
        B1 <-->|Allowed| C1
    end
    
    subgraph "With Default Deny"
        A2[Pod A] x--x|Blocked| B2[Pod B]
        A2 x--x|Blocked| C2[Pod C]
        B2 x--x|Blocked| C2
    end
    
    style A1 fill:#EA4335,color:#fff
    style A2 fill:#34A853,color:#fff
```

### Network Policy Example

```yaml
# infrastructure/kubernetes/k8s/network-policies.yaml

# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: csm
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# Allow ingress to secret-service from ingress controller only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-secret-service
  namespace: csm
spec:
  podSelector:
    matchLabels:
      app: secret-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080

---
# Allow secret-service to audit-service
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-secret-to-audit
  namespace: csm
spec:
  podSelector:
    matchLabels:
      app: audit-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: secret-service
      ports:
        - protocol: TCP
          port: 8081
```

### Visualizing Policies

```mermaid
graph LR
    subgraph "External"
        CLIENT[Client]
    end
    
    subgraph "ingress-nginx namespace"
        ING[Ingress Controller]
    end
    
    subgraph "csm namespace"
        SS[secret-service<br/>:8080]
        AS[audit-service<br/>:8081]
        NS[notification-service<br/>:8082]
    end
    
    subgraph "Database"
        DB[(PostgreSQL<br/>:5432)]
    end
    
    CLIENT -->|HTTPS| ING
    ING -->|Policy: Allow| SS
    SS -->|Policy: Allow| AS
    SS -->|Policy: Allow| DB
    AS -->|Policy: Allow| DB
    
    ING x--x|Blocked| AS
    ING x--x|Blocked| NS
    
    style SS fill:#34A853,color:#fff
    style AS fill:#34A853,color:#fff
```

---

## 6. Pod Security Standards

### Security Levels

```mermaid
graph LR
    subgraph "Pod Security Standards"
        PRIV[Privileged<br/>No restrictions]
        BASE[Baseline<br/>Minimal restrictions]
        REST[Restricted<br/>Hardened]
    end
    
    PRIV -->|More Secure| BASE -->|Most Secure| REST
    
    style PRIV fill:#EA4335,color:#fff
    style BASE fill:#FBBC04,color:#000
    style REST fill:#34A853,color:#fff
```

### Namespace Labels

```yaml
# infrastructure/kubernetes/k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: csm
  labels:
    # Pod Security Standards
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### Secure Pod Specification

```yaml
# Deployment with security best practices
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-service
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      
      containers:
        - name: secret-service
          image: gcr.io/PROJECT/secret-service:latest
          
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          
          # Probes for health
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
```

---

## 7. Authentication & Authorization

### RBAC Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant FB as Firebase
    
    U->>FE: Login with Google
    FE->>FB: signInWithPopup()
    FB->>FE: ID Token (with claims)
    
    FE->>BE: Request + Bearer Token
    
    BE->>FB: verifyIdToken()
    FB->>BE: Decoded Token
    
    Note over BE: Check custom claims
    
    alt Has PLATFORM_ADMIN role
        BE->>BE: Grant all permissions
    else Has USER role
        BE->>BE: Check workflow membership
    else No valid role
        BE->>FE: 403 Forbidden
    end
    
    BE->>FE: Response
```

### Custom Claims for RBAC

```mermaid
graph TB
    subgraph "User Roles"
        PA[PLATFORM_ADMIN]
        WA[WORKFLOW_ADMIN]
        WU[WORKFLOW_USER]
        U[USER]
    end
    
    subgraph "Permissions"
        P1[Manage Users]
        P2[Create Workflows]
        P3[Manage Secrets]
        P4[View Secrets]
        P5[View Audit Logs]
    end
    
    PA --> P1
    PA --> P2
    PA --> P3
    PA --> P4
    PA --> P5
    
    WA --> P2
    WA --> P3
    WA --> P4
    WA --> P5
    
    WU --> P4
    WU --> P5
    
    U --> P5
    
    style PA fill:#EA4335,color:#fff
    style WA fill:#FBBC04,color:#000
    style WU fill:#34A853,color:#fff
```

### Backend Authorization

```java
// Spring Security configuration
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("PLATFORM_ADMIN")
                .requestMatchers("/api/secrets/**").hasAnyRole("PLATFORM_ADMIN", "WORKFLOW_ADMIN", "WORKFLOW_USER")
                .requestMatchers("/api/workflows/**").hasAnyRole("PLATFORM_ADMIN", "WORKFLOW_ADMIN")
                .requestMatchers("/api/audit/**").authenticated()
                .requestMatchers("/actuator/health/**").permitAll()
                .anyRequest().authenticated()
            )
            .build();
    }
}
```

---

## 8. Best Practices

### Security Checklist

```mermaid
graph TB
    subgraph "Infrastructure"
        I1[✓ Private GKE cluster]
        I2[✓ VPC with private subnets]
        I3[✓ Cloud NAT for egress]
        I4[✓ Cloud Armor WAF]
    end
    
    subgraph "Secrets"
        S1[✓ Google Secret Manager]
        S2[✓ External Secrets Operator]
        S3[✓ No secrets in code/git]
        S4[✓ Rotate secrets regularly]
    end
    
    subgraph "Access"
        A1[✓ Workload Identity]
        A2[✓ Least privilege IAM]
        A3[✓ Network policies]
        A4[✓ Pod Security Standards]
    end
    
    subgraph "Audit"
        AU1[✓ Audit logging enabled]
        AU2[✓ Cloud Logging export]
        AU3[✓ Alert on anomalies]
    end
```

### Never Do This

```yaml
# ❌ BAD - Secret in environment variable
env:
  - name: DB_PASSWORD
    value: "super-secret-password"

# ❌ BAD - Secret in ConfigMap
apiVersion: v1
kind: ConfigMap
data:
  password: "super-secret-password"

# ❌ BAD - Running as root
securityContext:
  runAsUser: 0

# ❌ BAD - Privileged container
securityContext:
  privileged: true
```

### Always Do This

```yaml
# ✅ GOOD - Secret from Secret Manager via ESO
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: csm-secrets
        key: DB_PASSWORD

# ✅ GOOD - Non-root user
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `infrastructure/terraform/modules/secrets/` | Secret Manager resources |
| `infrastructure/kubernetes/k8s/external-secrets.yaml` | ESO configuration |
| `infrastructure/kubernetes/k8s/network-policies.yaml` | Network isolation |
| `infrastructure/kubernetes/k8s/pod-security-standards.yaml` | Pod security |
| `infrastructure/helm/.../templates/serviceaccount.yaml` | Workload Identity |

### Common Commands

```bash
# Check External Secrets status
kubectl get externalsecrets -n csm
kubectl describe externalsecret csm-secrets -n csm

# Verify Workload Identity
kubectl run test --rm -it --image=google/cloud-sdk:slim \
  --serviceaccount=secret-service-sa -n csm \
  -- gcloud auth list

# Test network policy
kubectl run test --rm -it --image=busybox -n csm \
  -- wget -O- http://secret-service:8080/actuator/health

# Check pod security
kubectl get pods -n csm -o jsonpath='{.items[*].spec.securityContext}'
```

---

## Next Steps

1. **Review** the [Terraform 101](./03-TERRAFORM-101.md) for IaC security
2. **Practice** creating network policies
3. **Set up** External Secrets Operator locally
4. **Test** Workload Identity bindings
5. **Audit** your current security posture

---

**Document Version:** 1.0  
**Last Updated:** December 7, 2025
