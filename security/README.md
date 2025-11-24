# Security

This directory contains security policies, configurations, and security-related resources for Cloud Secrets Manager.

## Directory Structure

```
security/
├── policies/          # Kubernetes security policies
└── scans/             # Security scan results and reports
```

## Components

### 🛡️ `policies/`
Kubernetes security policies and configurations:
- **Network Policies** - Network isolation and traffic rules
- **Pod Security Standards** - Pod security context configurations
- **Security Context** - Container security settings

These policies enforce security best practices at the Kubernetes level.

**Key Policies:**
- **Network Policies** - Restrict pod-to-pod communication
- **Pod Security Standards** - Enforce restricted security contexts
- **RBAC Policies** - Role-based access control

**Deployment:**
```bash
kubectl apply -f security/policies/
```

### 🔍 `scans/`
Security scan results and vulnerability reports:
- Trivy scan results
- Dependency vulnerability reports
- Container image scan results

**Note:** Scan results are typically generated during CI/CD and may be gitignored.

## Security Features

### Network Security
- **Network Policies** - Isolate services and restrict communication
- **Ingress Security** - TLS termination and rate limiting
- **Service Mesh** - Optional service-to-service encryption

### Pod Security
- **Pod Security Standards** - Restricted security contexts
- **Non-root Containers** - Containers run as non-root users
- **Read-only Root Filesystem** - Where possible
- **Capability Dropping** - Minimal Linux capabilities

### Secrets Management
- **External Secrets Operator** - Integrate with Google Secret Manager
- **Encryption at Rest** - AES-256 encryption for secrets
- **Encryption in Transit** - TLS for all communications
- **JWT Token Security** - Secure token generation and validation

### Authentication & Authorization
- **Google Identity Platform** - Firebase Authentication
- **JWT Tokens** - Secure token-based authentication
- **RBAC** - Role-based access control
- **Token Blacklisting** - Redis-based token revocation

## Security Best Practices

### ✅ Implemented
- ✅ Network policies for service isolation
- ✅ Pod security standards (restricted)
- ✅ Non-root container execution
- ✅ TLS/HTTPS for all external communications
- ✅ AES-256 encryption at rest
- ✅ JWT token blacklisting
- ✅ Rate limiting and DDoS protection
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Dependency vulnerability scanning (Trivy)
- ✅ Regular security updates

### 🔒 Security Hardening

#### Container Security
- Containers run as non-root users
- Minimal base images (Alpine Linux)
- Regular security updates
- Vulnerability scanning in CI/CD

#### Network Security
- Network policies restrict pod communication
- Ingress with TLS termination
- Rate limiting on API endpoints
- DDoS protection

#### Secrets Security
- Secrets encrypted at rest (AES-256)
- External Secrets Operator for production
- No secrets in environment variables
- Secure secret rotation

## Deployment

### Deploy Security Policies

```bash
# Deploy all security policies
kubectl apply -f security/policies/

# Or use the deployment script
./scripts/deploy-security-policies.sh
```

### Verify Security Policies

```bash
# Check network policies
kubectl get networkpolicies -n cloud-secrets-manager

# Check pod security standards
kubectl get podsecuritypolicies

# Verify security contexts
kubectl describe pod <pod-name> -n cloud-secrets-manager
```

## Security Scanning

### Container Image Scanning
```bash
# Scan container images with Trivy
trivy image <image-name>:<tag>
```

#### Install Trivy Quickly
- macOS: `brew install trivy`
- Docker: `docker run aquasec/trivy`
- Direct binary: download from the Trivy GitHub releases

See the [Trivy “First steps” guide](https://trivy.dev/docs/latest/getting-started/) for more install channels and integrations.

### Dependency Scanning
```bash
# Scan Maven dependencies
trivy fs apps/backend/secret-service/
```

### Kubernetes Manifest Scanning
```bash
# Scan Kubernetes manifests
trivy k8s cluster
```

#### Recommended Workflow
1. Run `trivy image "$REGION-docker.pkg.dev/$PROJECT_ID/csm/secret-service:$TAG"` after each build to block vulnerable images.
2. Run `trivy fs --scanners vuln,secret,misconfig .` as part of CI for repository checks.
3. After deployment, execute `trivy k8s --report summary cluster` to validate the running cluster.

Examples and CLI syntax come directly from the Trivy getting-started documentation.参考: [Trivy docs](https://trivy.dev/docs/latest/getting-started/)

## Security Testing

### Run Security Tests
```bash
# Run security test suite
./scripts/security-test.sh
```

### Penetration Testing
- Regular security audits
- Vulnerability assessments
- Penetration testing reports

## Compliance

### Security Standards
- **OWASP Top 10** - Web application security risks
- **CIS Benchmarks** - Kubernetes security benchmarks
- **NIST Framework** - Security framework alignment

### Audit & Compliance
- Security audit logs
- Compliance reports
- Security incident response procedures

## Incident Response

### Security Incident Procedures
1. **Detection** - Monitor alerts and logs
2. **Containment** - Isolate affected systems
3. **Eradication** - Remove threat
4. **Recovery** - Restore services
5. **Post-Incident** - Review and improve

See [Runbooks](../../docs/deployment/monitoring/RUNBOOKS.md) for detailed procedures.

## Related Documentation

- **[Security Context Update](../../docs/deployment/kubernetes/SECURITY_CONTEXT_UPDATE.md)** - Pod security configuration
- **[Network Policies](../../infrastructure/kubernetes/k8s/network-policies.yaml)** - Network isolation
- **[Pod Security Standards](../../infrastructure/kubernetes/k8s/pod-security-standards.yaml)** - Security contexts
- **[Operations Guide](../../docs/deployment/OPERATIONS_GUIDE.md)** - Security operations

## Security Contacts

For security issues or vulnerabilities:
- **Security Team:** [Contact Information]
- **Incident Response:** Follow runbook procedures
- **Vulnerability Reports:** [Reporting Process]

## Maintenance

- **Regular Updates:** Keep dependencies and base images updated
- **Security Scans:** Run scans regularly in CI/CD
- **Policy Reviews:** Review and update security policies quarterly
- **Audit Logs:** Monitor and review security audit logs

---

**Last Updated:** December 2024  
**Security Status:** ✅ All security policies enforced

