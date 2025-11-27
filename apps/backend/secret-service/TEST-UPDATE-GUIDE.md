# Test Update Guide

## Overview

The following test files need to be updated to use v3 project-scoped API after removing deprecated v2 methods:

## Test Files to Update

### 1. AuditAsyncIntegrationTest.java
**Location**: `src/test/java/com/secrets/integration/AuditAsyncIntegrationTest.java`

**Error**: Line 55 uses `findBySecretKey(String)`

**Fix**:
```java
// OLD (v2):
Secret secret = secretRepository.findBySecretKey("test-key")
    .orElseThrow();

// NEW (v3):
UUID projectId = // get or create test project
Secret secret = secretRepository.findByProjectIdAndSecretKey(projectId, "test-key")
    .orElseThrow();
```

### 2. SecretVersionIntegrationTest.java
**Location**: `src/test/java/com/secrets/integration/SecretVersionIntegrationTest.java`

**Errors**: Lines 76, 108, 202 use `findBySecretKeyOrderByVersionNumberDesc(String)`

**Fix**:
```java
// OLD (v2):
List<SecretVersion> versions = secretVersionRepository
    .findBySecretKeyOrderByVersionNumberDesc("test-key");

// NEW (v3):
UUID secretId = secret.getId(); // Get from test secret
List<SecretVersion> versions = secretVersionRepository
    .findBySecretIdOrderByVersionNumberDesc(secretId);
```

### 3. SecretVersionServiceTest.java
**Location**: `src/test/java/com/secrets/service/SecretVersionServiceTest.java`

**Multiple errors** - Uses removed methods:
- `existsBySecretKey(String)`
- `getVersions(String)`
- `getVersion(String, Integer)`
- `rollbackToVersion(String, Integer, String)`
- `getCurrentVersionNumber(String)`
- `getVersionCount(String)`

**Recommendation**: 
Since `SecretVersionService` now only has `createVersion(Secret, UUID, String)`, these tests should either:

1. **Test the remaining method**:
   ```java
   @Test
   void testCreateVersion() {
       Secret secret = createTestSecret();
       UUID userId = UUID.randomUUID();
       
       SecretVersion version = secretVersionService.createVersion(
           secret, userId, "Test change"
       );
       
       assertNotNull(version);
       assertEquals(1, version.getVersionNumber());
       assertEquals(userId, version.getCreatedBy());
   }
   ```

2. **Test repository methods directly** (if needed):
   ```java
   @Test
   void testGetVersionsBySecretId() {
       UUID secretId = secret.getId();
       List<SecretVersion> versions = secretVersionRepository
           .findBySecretIdOrderByVersionNumberDesc(secretId);
       
       assertFalse(versions.isEmpty());
   }
   ```

3. **Remove tests** for deprecated functionality that no longer exists

## Quick Fix Script

Since test files are gitignored, you'll need to update them manually. Here's a template:

```java
// Add this helper method to test classes:
private UUID getOrCreateTestProject() {
    Project project = new Project();
    project.setName("Test Project");
    project.setOwnerId(testUserId);
    return projectRepository.save(project).getId();
}

// Update test setup:
@BeforeEach
void setUp() {
    testProjectId = getOrCreateTestProject();
    // ... rest of setup
}

// Update secret creation in tests:
Secret secret = new Secret();
secret.setProjectId(testProjectId); // Add this line
secret.setSecretKey("test-key");
// ... rest of secret setup
```

## Running Tests

After updating:

```bash
cd apps/backend/secret-service

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=SecretVersionServiceTest

# Run with verbose output
./mvnw test -X
```

## Alternative: Skip Tests Temporarily

If you want to proceed without fixing tests immediately:

```bash
# Build without tests
./mvnw clean package -DskipTests

# Or add to pom.xml:
<properties>
    <maven.test.skip>true</maven.test.skip>
</properties>
```

## Notes

- Tests are in `.gitignore`, so changes won't be tracked
- Consider removing `.gitignore` entry for test files if you want to version them
- All test failures are expected after removing v2 API methods
- Tests were testing deprecated functionality that's been intentionally removed
