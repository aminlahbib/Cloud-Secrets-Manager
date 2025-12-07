# Cloud Secrets Manager - Project Wiki

**Last Updated:** December 5, 2025  
**Purpose:** Comprehensive project documentation and knowledge base

---

## 📚 Wiki Structure

This wiki serves as the central knowledge base for the Cloud Secrets Manager project, containing comprehensive documentation on workflows, features, architecture, and user guides.

---

## 🗂️ Wiki Sections

### 1. [Workflows](./workflows/)

Step-by-step guides for common development and operational workflows:

- **[Development Workflow](./workflows/DEVELOPMENT_WORKFLOW.md)** - Daily development tasks
- **[Deployment Workflow](./workflows/DEPLOYMENT_WORKFLOW.md)** - Deploying to environments
- **[Testing Workflow](./workflows/TESTING_WORKFLOW.md)** - Running and writing tests
- **[Monitoring Workflow](./workflows/MONITORING_WORKFLOW.md)** - Observability practices
- **[Incident Response Workflow](./workflows/INCIDENT_RESPONSE.md)** - Handling incidents

### 2. [Features](./features/)

Detailed documentation for each feature:

- **[Secret Management](./features/SECRET_MANAGEMENT.md)** - Core secret operations
- **[Project Management](./features/PROJECT_MANAGEMENT.md)** - Project organization
- **[User Management](./features/USER_MANAGEMENT.md)** - User and team management
- **[Audit Logging](./features/AUDIT_LOGGING.md)** - Audit trail and compliance
- **[Notifications](./features/NOTIFICATIONS.md)** - Alert and notification system
- **[Two-Factor Authentication](./features/TWO_FACTOR_AUTH.md)** - 2FA implementation

### 3. [Architecture](./architecture/)

System architecture and design documentation:

- **[System Overview](./architecture/SYSTEM_OVERVIEW.md)** - High-level architecture
- **[Microservices Architecture](./architecture/MICROSERVICES.md)** - Service design
- **[Data Model](./architecture/DATA_MODEL.md)** - Database schema and relationships
- **[API Design](./architecture/API_DESIGN.md)** - RESTful API patterns
- **[Security Architecture](./architecture/SECURITY.md)** - Security model
- **[Infrastructure](./architecture/INFRASTRUCTURE.md)** - Cloud infrastructure

### 4. [User Guides](./user-guides/)

End-user documentation:

- **[Getting Started](./user-guides/GETTING_STARTED.md)** - Quick start guide
- **[Creating Secrets](./user-guides/CREATING_SECRETS.md)** - Secret creation guide
- **[Managing Projects](./user-guides/MANAGING_PROJECTS.md)** - Project management
- **[Team Collaboration](./user-guides/TEAM_COLLABORATION.md)** - Working with teams
- **[Security Best Practices](./user-guides/SECURITY_BEST_PRACTICES.md)** - Security guidelines

---

## 🎯 Quick Navigation

### For Developers

1. Start with [Development Workflow](./workflows/DEVELOPMENT_WORKFLOW.md)
2. Review [System Overview](./architecture/SYSTEM_OVERVIEW.md)
3. Explore [Features](./features/) you'll be working on
4. Check [API Design](./architecture/API_DESIGN.md) patterns

### For DevOps Engineers

1. Review [Deployment Workflow](./workflows/DEPLOYMENT_WORKFLOW.md)
2. Study [Infrastructure](./architecture/INFRASTRUCTURE.md)
3. Learn [Monitoring Workflow](./workflows/MONITORING_WORKFLOW.md)
4. Prepare for [Incident Response](./workflows/INCIDENT_RESPONSE.md)

### For Product Managers

1. Understand [System Overview](./architecture/SYSTEM_OVERVIEW.md)
2. Review all [Features](./features/)
3. Check [User Guides](./user-guides/) for user experience
4. Review [Security Architecture](./architecture/SECURITY.md)

### For End Users

1. Start with [Getting Started](./user-guides/GETTING_STARTED.md)
2. Learn [Creating Secrets](./user-guides/CREATING_SECRETS.md)
3. Explore [Managing Projects](./user-guides/MANAGING_PROJECTS.md)
4. Follow [Security Best Practices](./user-guides/SECURITY_BEST_PRACTICES.md)

---

## 📊 Architecture Diagrams

### System Architecture

```mermaid
graph TB
    subgraph "Frontend"
        UI[React Application<br/>Port 3000]
    end
    
    subgraph "Backend Services"
        SECRET[Secret Service<br/>Port 8080]
        AUDIT[Audit Service<br/>Port 8081]
        NOTIF[Notification Service<br/>Port 8082]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database)]
        CACHE[(Redis<br/>Cache)]
    end
    
    subgraph "Infrastructure"
        K8S[Kubernetes<br/>GKE]
        PROM[Prometheus<br/>Metrics]
        LOKI[Loki<br/>Logs]
        GRAF[Grafana<br/>Dashboards]
    end
    
    subgraph "External Services"
        FIREBASE[Firebase<br/>Authentication]
        GCS[Google Cloud<br/>Storage]
    end
    
    UI -->|REST API| SECRET
    UI -->|REST API| AUDIT
    UI -->|REST API| NOTIF
    
    SECRET --> DB
    AUDIT --> DB
    NOTIF --> DB
    
    SECRET --> CACHE
    
    SECRET --> FIREBASE
    AUDIT --> FIREBASE
    
    K8S --> PROM
    K8S --> LOKI
    PROM --> GRAF
    LOKI --> GRAF
    
    style UI fill:#61dafb,stroke:#333
    style SECRET fill:#f9f,stroke:#333
    style AUDIT fill:#f9f,stroke:#333
    style NOTIF fill:#f9f,stroke:#333
    style DB fill:#336791,stroke:#333,color:#fff
    style K8S fill:#326ce5,stroke:#333,color:#fff
    style GRAF fill:#f46800,stroke:#333,color:#fff
```

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SecretService
    participant AuditService
    participant Database
    participant Cache
    
    User->>Frontend: Create Secret
    Frontend->>SecretService: POST /api/secrets
    SecretService->>Database: Save Secret
    Database-->>SecretService: Success
    SecretService->>AuditService: Log Event
    AuditService->>Database: Save Audit Log
    SecretService->>Cache: Cache Secret
    SecretService-->>Frontend: 201 Created
    Frontend-->>User: Success Message
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "GKE Cluster"
        subgraph "Namespace: cloud-secrets-manager"
            FE[Frontend Deployment<br/>3 replicas]
            SS[Secret Service<br/>3 replicas]
            AS[Audit Service<br/>2 replicas]
            NS[Notification Service<br/>2 replicas]
        end
        
        subgraph "Namespace: monitoring"
            PROM[Prometheus]
            GRAF[Grafana]
        end
        
        subgraph "Namespace: logging"
            LOKI[Loki]
            PROMTAIL[Promtail DaemonSet]
        end
    end
    
    subgraph "External"
        LB[Load Balancer]
        DB[(Cloud SQL<br/>PostgreSQL)]
        REDIS[(Memorystore<br/>Redis)]
    end
    
    LB --> FE
    FE --> SS
    FE --> AS
    FE --> NS
    
    SS --> DB
    AS --> DB
    NS --> DB
    
    SS --> REDIS
    
    PROMTAIL --> LOKI
    PROM --> GRAF
    LOKI --> GRAF
    
    style FE fill:#61dafb,stroke:#333
    style SS fill:#f9f,stroke:#333
    style AS fill:#f9f,stroke:#333
    style NS fill:#f9f,stroke:#333
    style PROM fill:#e6522c,stroke:#333,color:#fff
    style LOKI fill:#f46800,stroke:#333,color:#fff
    style GRAF fill:#f46800,stroke:#333,color:#fff
```

---

## 🔄 Common Workflows

### Development Workflow

```mermaid
graph LR
    A[Clone Repo] --> B[Create Branch]
    B --> C[Make Changes]
    C --> D[Run Tests]
    D --> E{Tests Pass?}
    E -->|No| C
    E -->|Yes| F[Commit]
    F --> G[Push]
    G --> H[Create PR]
    H --> I[Code Review]
    I --> J{Approved?}
    J -->|No| C
    J -->|Yes| K[Merge]
    K --> L[Deploy]
    
    style A fill:#90EE90,stroke:#333
    style L fill:#90EE90,stroke:#333
    style E fill:#FFD700,stroke:#333
    style J fill:#FFD700,stroke:#333
```

### Deployment Workflow

```mermaid
graph TB
    A[Code Merged] --> B[CI Pipeline]
    B --> C[Build Docker Images]
    C --> D[Push to Registry]
    D --> E[Update Helm Charts]
    E --> F{Environment?}
    F -->|Dev| G[Deploy to Dev]
    F -->|Staging| H[Deploy to Staging]
    F -->|Prod| I[Deploy to Production]
    G --> J[Run Smoke Tests]
    H --> K[Run Integration Tests]
    I --> L[Run Health Checks]
    J --> M[Monitor]
    K --> M
    L --> M
    
    style A fill:#90EE90,stroke:#333
    style M fill:#90EE90,stroke:#333
    style F fill:#FFD700,stroke:#333
```

---

## 📝 Documentation Standards

### Document Structure

All wiki documents should follow this structure:

```markdown
# Document Title

**Last Updated:** YYYY-MM-DD  
**Status:** Draft | Review | Published  
**Owner:** Team/Person

---

## Overview

Brief description of the document's purpose.

## Content Sections

Detailed content organized logically.

## Examples

Practical examples and code snippets.

## References

Links to related documentation.
```

### Diagram Standards

- Use Mermaid for all diagrams
- Keep diagrams simple and focused
- Use consistent colors and styles
- Include legends when necessary

### Code Examples

- Use syntax highlighting
- Include comments
- Show expected output
- Provide context

---

## 🔗 Related Documentation

### Technical Documentation

- [Architecture Specification](../101/Architecture_Specification_v3.md)
- [API Documentation](http://localhost:8080/swagger-ui.html)
- [Database Schema](../04_DATA_MODEL_AND_DB_DIAGRAMS.md)

### Operational Documentation

- [Deployment Guide](../deployment/FIRST_TIME_DEPLOYMENT.md)
- [Operations Guide](../deployment/operations/OPERATIONS_GUIDE.md)
- [Logging Setup](../deployment/logging/LOGGING_SETUP.md)

### Learning Resources

- [Kubernetes 101](../101/01-KUBERNETES-101.md)
- [Helm 101](../101/02-HELM-101.md)
- [Loki & Promtail 101](../101/08-LOKI-PROMTAIL-101.md)

---

## 🤝 Contributing to the Wiki

### Adding New Documentation

1. Create document in appropriate section
2. Follow documentation standards
3. Add entry to this README
4. Update related documents
5. Submit PR for review

### Updating Existing Documentation

1. Update "Last Updated" date
2. Mark outdated sections clearly
3. Maintain backward compatibility
4. Update related documents
5. Submit PR for review

### Archiving Documentation

1. Move to `../archive/` directory
2. Add "ARCHIVED" prefix to title
3. Add archive date and reason
4. Update references in other docs
5. Remove from this index

---

## 📧 Contact

**Documentation Team:** DevOps Team  
**Questions:** Create an issue in the repository  
**Suggestions:** Submit a PR with improvements

---

**Last Review:** December 5, 2025  
**Next Review:** January 5, 2026
