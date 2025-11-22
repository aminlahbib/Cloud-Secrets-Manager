# Contributing to Cloud Secrets Manager

Thank you for your interest in contributing to Cloud Secrets Manager! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Review Process](#review-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect everyone to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- **JDK 21** - Java Development Kit
- **Maven 3.8+** - Build tool
- **Docker** - For containerization
- **kubectl** - Kubernetes CLI
- **Helm 3.13+** - Kubernetes package manager
- **Git** - Version control
- **gcloud CLI** - Google Cloud SDK (optional, for deployment)

### Setting Up Development Environment

1. **Clone the repository**

```bash
git clone https://github.com/<your-org>/cloud-secrets-manager.git
cd cloud-secrets-manager
```

2. **Set up local development**

```bash
# Build the services
cd apps/backend/secret-service
./mvnw clean install

cd ../audit-service
./mvnw clean install
```

3. **Run tests**

```bash
# Run all tests
./mvnw verify

# Run specific tests
./mvnw test -Dtest=SecretServiceTest
```

4. **Start services locally**

See [docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md](docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md) for detailed instructions.

---

## Development Workflow

### Branch Strategy

We follow a **Git Flow** branching model:

- **`main`** - Production-ready code, protected
- **`develop`** - Integration branch for features, protected
- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes for develop
- **`hotfix/*`** - Critical fixes for production
- **`release/*`** - Release preparation (optional)

### Creating a Feature Branch

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements
- `ci:` - CI/CD changes

**Examples:**

```bash
feat(secret-service): add secret rotation functionality

fix(audit-service): resolve null pointer exception in event logging

docs(readme): update installation instructions

ci(workflow): add Trivy image scanning
```

---

## Coding Standards

### Java Code Style

- **Follow Google Java Style Guide**
- Use meaningful variable and method names
- Write self-documenting code
- Add comments for complex logic
- Keep methods small and focused (< 50 lines)
- Use proper exception handling

### Code Formatting

```bash
# Format code with Maven
./mvnw spotless:apply

# Check formatting
./mvnw spotless:check
```

### Best Practices

1. **Dependency Injection**: Use Spring's dependency injection
2. **Exception Handling**: Use custom exceptions and proper error responses
3. **Logging**: Use SLF4J with appropriate log levels
4. **Security**: Never log sensitive data (passwords, tokens, secrets)
5. **Validation**: Validate all input parameters
6. **Documentation**: Add JavaDoc for public APIs

### Example

```java
/**
 * Retrieves a secret by its unique identifier.
 *
 * @param secretId the unique identifier of the secret
 * @return the secret data
 * @throws SecretNotFoundException if the secret does not exist
 * @throws UnauthorizedException if the user lacks permission
 */
@GetMapping("/{secretId}")
public ResponseEntity<SecretResponse> getSecret(
    @PathVariable String secretId,
    @AuthenticationPrincipal UserDetails userDetails) {
    
    logger.debug("Fetching secret with ID: {}", secretId);
    
    SecretResponse secret = secretService.getSecret(secretId, userDetails);
    
    return ResponseEntity.ok(secret);
}
```

---

## Testing Guidelines

### Test Coverage Requirements

- **Minimum coverage**: 80% for new code
- **Unit tests**: Test individual components
- **Integration tests**: Test component interactions
- **E2E tests**: Test complete user flows (where applicable)

### Writing Tests

```java
@SpringBootTest
class SecretServiceTest {
    
    @Autowired
    private SecretService secretService;
    
    @MockBean
    private SecretRepository secretRepository;
    
    @Test
    void testCreateSecret_Success() {
        // Arrange
        SecretRequest request = new SecretRequest("key", "value");
        when(secretRepository.save(any())).thenReturn(new Secret());
        
        // Act
        SecretResponse response = secretService.createSecret(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("key", response.getKey());
        verify(secretRepository, times(1)).save(any());
    }
    
    @Test
    void testCreateSecret_InvalidInput_ThrowsException() {
        // Arrange
        SecretRequest request = new SecretRequest(null, "value");
        
        // Act & Assert
        assertThrows(ValidationException.class, 
            () -> secretService.createSecret(request));
    }
}
```

### Running Tests

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw verify jacoco:report

# Run specific test class
./mvnw test -Dtest=SecretServiceTest

# Run specific test method
./mvnw test -Dtest=SecretServiceTest#testCreateSecret_Success
```

---

## Pull Request Process

### Before Creating a PR

1. ✅ Write tests for your changes
2. ✅ Run all tests locally (`./mvnw verify`)
3. ✅ Update documentation if needed
4. ✅ Follow code style guidelines
5. ✅ Rebase on latest develop
6. ✅ Write clear commit messages

### Creating a Pull Request

1. **Push your branch**

```bash
git push origin feature/your-feature-name
```

2. **Create PR on GitHub**

- Go to the repository on GitHub
- Click "New Pull Request"
- Select your branch
- Fill out the PR template completely
- Link related issues

3. **PR Template Checklist**

```markdown
## Description
[Clear description of changes]

## Type of Change
- [x] Bug fix / New feature / etc.

## Related Issues
Fixes #123

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added where needed
- [x] Documentation updated
- [x] Tests added/updated
- [x] All tests pass
```

4. **Request Reviews**

- Automatic reviewers will be assigned based on CODEOWNERS
- Request additional reviewers if needed
- Tag reviewers with `@username` in comments if urgent

### PR Requirements

#### For PRs to `develop` (Solo Developer)

- ⬜ PR approval (optional - can push directly for solo dev)
- ✅ All CI checks must pass:
  - Build and Test
  - Trivy Code Security Scan
- ✅ Branch up to date with develop

#### For PRs to `main` (Solo Developer)

- ⬜ PR approval (optional - automated checks are the main quality gate)
- ✅ All CI checks must pass:
  - Build and Test
  - Trivy Code Security Scan
  - Docker Build and Push
- ✅ Branch up to date with main

**Note:** As a solo developer, the automated CI/CD checks are your primary quality gates. Manual PR approvals are optional but can serve as a deliberate pause point for self-review.

---

## CI/CD Pipeline

### Pipeline Overview

All pull requests and pushes trigger automated pipelines:

1. **Build and Test** - Builds code and runs all tests
2. **Security Scan** - Scans for vulnerabilities
3. **Docker Build** - Builds and scans Docker images (main/develop only)
4. **Deploy** - Deploys to appropriate environment (main/develop only)

### Viewing Pipeline Status

- Check the "Checks" tab on your PR
- View detailed logs in the "Actions" tab
- Pipeline must pass before PR can be merged

### If Pipeline Fails

1. **Review the logs** in GitHub Actions
2. **Fix the issues** locally
3. **Run tests** locally to verify fix
4. **Push the fix** - pipeline will re-run automatically

```bash
# Fix the issue
# ...

# Test locally
./mvnw verify

# Commit and push
git add .
git commit -m "fix: resolve pipeline failure"
git push origin feature/your-feature-name
```

### Required Status Checks

The following checks must pass:

- ✅ **Build and Test** - All tests pass
- ✅ **Trivy Code Security Scan** - No critical vulnerabilities
- ✅ **Build, Scan and Push Docker Images** - Images build successfully (main/develop)

See [docs/deployment/ci-cd/CI_CD_SETUP.md](docs/deployment/ci-cd/CI_CD_SETUP.md) for detailed pipeline documentation.

---

## Review Process

### As an Author

**After creating PR:**
1. Monitor CI checks
2. Respond to review comments promptly
3. Make requested changes
4. Mark conversations as resolved when addressed
5. Request re-review after changes

**Responding to feedback:**
```markdown
Thanks for the feedback! I've made the following changes:
- ✅ Updated error handling as suggested
- ✅ Added additional test cases
- ✅ Refactored the method for clarity

Please take another look when you have a chance.
```

### As a Reviewer

**Review checklist:**
- [ ] Code follows project standards
- [ ] Logic is correct and efficient
- [ ] Tests adequately cover changes
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Error handling is appropriate
- [ ] No hardcoded values or secrets

**Providing feedback:**

**Good:**
```markdown
The logic here looks good, but consider extracting this into a separate method for better readability:

[code suggestion]

This would make the code easier to test and maintain.
```

**Not ideal:**
```markdown
This is wrong. Change it.
```

**Approval guidelines:**
- ✅ Approve if changes are good to merge
- 💬 Comment if you have suggestions but no blocking issues
- 🚫 Request changes if there are issues that must be addressed

---

## Development Guidelines by Component

### Backend Services

**Secret Service:**
- Handles secret CRUD operations
- Enforces encryption and access control
- Located in: `apps/backend/secret-service/`

**Audit Service:**
- Logs all actions and events
- Provides audit trail for compliance
- Located in: `apps/backend/audit-service/`

### Infrastructure Changes

**Terraform:**
- Test changes with `terraform plan`
- Document any new resources
- Located in: `infrastructure/terraform/`

**Helm Charts:**
- Test with `helm lint`
- Update values files for all environments
- Located in: `infrastructure/helm/`

**Kubernetes:**
- Validate manifests with `kubectl apply --dry-run`
- Test in dev environment first
- Located in: `infrastructure/kubernetes/`

---

## Getting Help

### Resources

- **Documentation**: [docs/](docs/)
- **CI/CD Guide**: [docs/deployment/ci-cd/CI_CD_SETUP.md](docs/deployment/ci-cd/CI_CD_SETUP.md)
- **Local Development**: [docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md](docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md)
- **Architecture**: [docs/current/](docs/current/)

### Communication

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue with bug template
- **Feature Requests**: Open a GitHub Issue with feature template
- **Security Issues**: Email security@yourdomain.com (do NOT open public issue)

### Team Contacts

- **DevOps**: @devops-team
- **Backend**: @backend-team
- **Security**: @security-team
- **Platform**: @platform-team

---

## License

By contributing to Cloud Secrets Manager, you agree that your contributions will be licensed under the project's license.

---

## Thank You!

Thank you for contributing to Cloud Secrets Manager! Your efforts help make this project better for everyone.

---

**Last Updated:** November 22, 2025

