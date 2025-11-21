# Backend Services

This directory contains the backend microservices for Cloud Secrets Manager.

## Services

- **secret-service/** - Secret management service (Port 8080)
  - Handles secret CRUD operations
  - JWT authentication
  - AES-256 encryption
  - RBAC authorization

- **audit-service/** - Audit logging service (Port 8081)
  - Receives and stores audit events
  - Provides audit log query endpoints

## Building

```bash
# Build secret-service
cd secret-service
./mvnw clean package

# Build audit-service
cd ../audit-service
./mvnw clean package
```

## Running Locally

```bash
# Secret Service
cd secret-service
./mvnw spring-boot:run

# Audit Service (in another terminal)
cd audit-service
./mvnw spring-boot:run
```

## Testing

```bash
# Run tests
cd secret-service && ./mvnw test
cd ../audit-service && ./mvnw test
```
