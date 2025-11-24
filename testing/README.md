# Testing

This directory contains all testing resources, test suites, and testing configurations for Cloud Secrets Manager.

## Directory Structure

```
testing/
├── e2e/               # End-to-end tests
├── integration/       # Integration tests
├── performance/       # Performance and load tests
├── postman/           # Postman collections for API testing
├── test-data/         # Test data and fixtures
├── unit/              # Unit tests (typically in src/test/)
├── test-auth.sh       # Authentication testing script
└── test-google-cloud-setup.sh  # GCP setup verification
```

## Test Types

### 🧪 Unit Tests
Located in `apps/backend/*/src/test/java/`:
- Service layer tests
- Controller tests
- Security tests
- Utility function tests

**Run Unit Tests:**
```bash
# Secret Service
cd apps/backend/secret-service
./mvnw test

# Audit Service
cd apps/backend/audit-service
./mvnw test
```

**Coverage:** 80%+ code coverage (JaCoCo reports)

### 🔗 Integration Tests
Located in `testing/integration/`:
- Database integration tests
- Service-to-service communication tests
- External service integration tests

**Run Integration Tests:**
```bash
# Requires Docker for Testcontainers
cd apps/backend/secret-service
./mvnw test -Dtest=*IntegrationTest
```

### 🎭 End-to-End Tests
Located in `testing/e2e/`:
- Full workflow tests
- User journey tests
- Cross-service tests

**Run E2E Tests:**
```bash
# Start services first
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Run E2E tests
./testing/e2e/run-e2e-tests.sh
```

### ⚡ Performance Tests
Located in `testing/performance/`:
- Load testing with k6
- Stress testing
- Performance benchmarks

**Run Performance Tests:**
```bash
# Install k6 first: https://k6.io/docs/getting-started/installation/
k6 run testing/performance/load-test.js
```

**Test Scenarios:**
- Baseline load (100 RPS)
- Stress test (500 RPS)
- Spike test (1000 RPS)

### 📮 Postman Collections
Located in `testing/postman/`:
- API endpoint testing
- Request/response examples
- Test scenarios

**Import into Postman:**
1. Open Postman
2. Import `testing/postman/cloud-secrets-manager.postman_collection.json`
3. Set environment variables
4. Run collection

## Test Scripts

### `test-auth.sh`
Tests authentication flow:
- Google OAuth login
- JWT token generation
- Token validation
- Token refresh

**Usage:**
```bash
./testing/test-auth.sh
```

### `test-google-cloud-setup.sh`
Verifies Google Cloud setup:
- Service account configuration
- Firebase Admin SDK setup
- GCP project configuration

**Usage:**
```bash
./testing/test-google-cloud-setup.sh
```

## Test Data

### `test-data/`
Contains test data and fixtures:
- Sample secrets
- Test user accounts
- Mock data for testing

**Note:** Test data should never contain real secrets or credentials.

## Test Coverage

### Current Coverage
- **Backend Services:** 80%+ code coverage
- **Unit Tests:** Comprehensive coverage
- **Integration Tests:** Database and service integration
- **E2E Tests:** Critical user workflows

### Coverage Reports
Generate coverage reports:
```bash
# Secret Service
cd apps/backend/secret-service
./mvnw test jacoco:report

# View report
open target/site/jacoco/index.html
```

## Running All Tests

### Local Development
```bash
# Run all unit tests
cd apps/backend/secret-service && ./mvnw test
cd apps/backend/audit-service && ./mvnw test

# Run integration tests (requires Docker)
./mvnw test -Dtest=*IntegrationTest

# Run E2E tests
./testing/e2e/run-e2e-tests.sh
```

### CI/CD Pipeline
Tests run automatically in CI/CD:
- Unit tests on every commit
- Integration tests on pull requests
- E2E tests on merge to main
- Performance tests on release

## Test Environments

### Local Testing
- Docker Compose for local services
- Testcontainers for database testing
- Mock external services

### Staging Testing
- Staging Kubernetes cluster
- Real GCP services (staging project)
- Production-like environment

### Production Testing
- Smoke tests only
- Read-only operations
- Health checks

## Performance Benchmarks

### Load Test Results
- **Baseline (100 RPS):** ✅ Pass
- **Stress (500 RPS):** ✅ Pass
- **Spike (1000 RPS):** ⚠️ Monitor

### Latency Targets
- **P50:** < 100ms
- **P95:** < 500ms
- **P99:** < 1000ms

## Test Maintenance

### Adding New Tests
1. **Unit Tests:** Add to `src/test/java/` in respective service
2. **Integration Tests:** Add to `testing/integration/`
3. **E2E Tests:** Add to `testing/e2e/`
4. **Performance Tests:** Add scenarios to `testing/performance/`

### Test Data Management
- Keep test data in `testing/test-data/`
- Never commit real secrets
- Use environment variables for test configuration

## Related Documentation

- **[Testing Strategy](../../docs/features/TESTING_STRATEGY_UPDATE.md)** - Overall testing approach
- **[Testing Status](../../docs/features/TESTING_STATUS.md)** - Current test coverage
- **[Testing Checklist](../../docs/features/TESTING_CHECKLIST.md)** - QA checklist
- **[Testing Setup Summary](../../docs/features/TESTING_SETUP_SUMMARY.md)** - Test environment setup

## Best Practices

### ✅ Do
- Write tests for all new features
- Maintain 80%+ code coverage
- Test edge cases and error scenarios
- Use meaningful test names
- Keep tests independent and isolated
- Mock external dependencies

### ❌ Don't
- Commit tests with real secrets
- Skip tests in CI/CD
- Write flaky tests
- Test implementation details
- Share test data between tests

## Troubleshooting

### Tests Failing Locally
1. Check Docker is running (for Testcontainers)
2. Verify database connections
3. Check environment variables
4. Review test logs

### Integration Test Issues
1. Ensure Testcontainers can access Docker
2. Check port conflicts
3. Verify database migrations
4. Review service dependencies

### Performance Test Failures
1. Check system resources
2. Verify network connectivity
3. Review test configuration
4. Check for resource limits

---

**Last Updated:** December 2024  
**Test Coverage:** 80%+ (Backend Services)

