# Security Infrastructure

This directory contains security policies and configurations for production deployment.

## Contents

```
security/
├── policies/              # Kubernetes security policies
│   ├── network-policies-enhanced.yaml
│   └── pod-security-standards.yaml
└── scans/                 # Security scan results (gitignored)
```

## Policies

### Network Policies
- Ingress/egress rules
- Service-to-service communication restrictions
- Database access controls

### Pod Security Standards
- Container security contexts
- Privilege restrictions
- Resource limits

## Security Checklist

- [ ] Network policies applied
- [ ] Pod security standards enforced
- [ ] Secrets encrypted at rest
- [ ] TLS enabled for all services
- [ ] RBAC configured
- [ ] Audit logging enabled

