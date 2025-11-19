# Dockerization Guide - Cloud Secrets Manager 🐳

Complete guide for containerizing and running the Cloud Secrets Manager locally with Docker Compose.

---

## Table of Contents

- [Docker Compose Configuration](#docker-compose-configuration)
- [Entity Models](#entity-models)
- [Encryption Service](#encryption-service)
- [Data Access Layer](#data-access-layer)
- [REST Controllers](#rest-controllers)
- [Audit Client](#audit-client)
- [Testing the API](#testing-the-api)

---

## Docker Compose Configuration

Create this file at the root of your project: `cloud-secrets-manager/docker-compose.yml`

```yaml
version: "3.8"

services:
  # ===============================
  # Secret Service
  # ===============================
  secret-service:
    build:
      context: ./secret-service
    container_name: secret-service
    depends_on:
      - secrets-db
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://secrets-db:5432/secrets
      SPRING_DATASOURCE_USERNAME: secret_user
      SPRING_DATASOURCE_PASSWORD: secret_pw
      JWT_SECRET: mySuperStrongSecretKeyForJWT
    ports:
      - "8080:8080"
    networks:
      - secrets-net

  # ===============================
  # Audit Service
  # ===============================
  audit-service:
    build:
      context: ./audit-service
    container_name: audit-service
    depends_on:
      - audit-db
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://audit-db:5432/audit
      SPRING_DATASOURCE_USERNAME: audit_user
      SPRING_DATASOURCE_PASSWORD: audit_pw
    ports:
      - "8081:8081"
    networks:
      - secrets-net

  # ===============================
  # Databases
  # ===============================
  secrets-db:
    image: postgres:15-alpine
    container_name: secrets-db
    environment:
      POSTGRES_DB: secrets
      POSTGRES_USER: secret_user
      POSTGRES_PASSWORD: secret_pw
    ports:
      - "5433:5432"
    volumes:
      - secrets-db-data:/var/lib/postgresql/data
    networks:
      - secrets-net

  audit-db:
    image: postgres:15-alpine
    container_name: audit-db
    environment:
      POSTGRES_DB: audit
      POSTGRES_USER: audit_user
      POSTGRES_PASSWORD: audit_pw
    ports:
      - "5434:5432"
    volumes:
      - audit-db-data:/var/lib/postgresql/data
    networks:
      - secrets-net

networks:
  secrets-net:

volumes:
  secrets-db-data:
  audit-db-data:
```

### Running the Stack

```bash
# Start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## Entity Models

### Secret Entity (with AES Encryption)

Location: `secret-service/src/main/java/.../entity/Secret.java`

```java
@Entity
@Table(name = "secrets")
public class Secret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String secretKey;

    @Column(nullable = false, length = 5000)
    private String encryptedValue;

    private String createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public Secret() {}

    public Secret(String secretKey, String encryptedValue, String createdBy) {
        this.secretKey = secretKey;
        this.encryptedValue = encryptedValue;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getEncryptedValue() {
        return encryptedValue;
    }

    public void setEncryptedValue(String encryptedValue) {
        this.encryptedValue = encryptedValue;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
```

---

## Encryption Service

### AES Encryption Implementation

Location: `secret-service/src/main/java/.../service/EncryptionService.java`

```java
@Service
public class EncryptionService {

    @Value("${encryption.key}")
    private String encryptionKey; // Must be 16/24/32 bytes for AES

    private Cipher getCipher(int mode) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(encryptionKey.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(mode, keySpec);
        return cipher;
    }

    public String encrypt(String plainText) {
        try {
            Cipher cipher = getCipher(Cipher.ENCRYPT_MODE);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting secret", e);
        }
    }

    public String decrypt(String encryptedText) {
        try {
            Cipher cipher = getCipher(Cipher.DECRYPT_MODE);
            byte[] decoded = Base64.getDecoder().decode(encryptedText);
            return new String(cipher.doFinal(decoded), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting secret", e);
        }
    }
}
```

### Configuration

Add to `application.properties` or `application.yml`:

```properties
# AES Encryption Key (MUST be 16, 24, or 32 bytes)
encryption.key=MySecure16ByteK1
```

**⚠️ Important:** In production, use a secure key management service (AWS KMS, Azure Key Vault, etc.) instead of hardcoding the key.

---

## Data Access Layer

### Spring Data JPA Repository

Location: `secret-service/src/main/java/.../repository/SecretRepository.java`

```java
public interface SecretRepository extends JpaRepository<Secret, Long> {
    Optional<Secret> findBySecretKey(String secretKey);
    void deleteBySecretKey(String secretKey);
}
```

---

## REST Controllers

### Secret Controller Example

Location: `secret-service/src/main/java/.../controller/SecretController.java`

```java
@RestController
@RequestMapping("/api/secrets")
public class SecretController {

    private final EncryptionService encryptionService;
    private final SecretRepository repo;
    private final AuditClient auditClient;

    public SecretController(EncryptionService encryptionService,
                            SecretRepository repo,
                            AuditClient auditClient) {
        this.encryptionService = encryptionService;
        this.repo = repo;
        this.auditClient = auditClient;
    }

    @PostMapping
    public ResponseEntity<?> createSecret(@RequestBody SecretRequest req,
                                          Principal principal) {
        Secret secret = new Secret();
        secret.setSecretKey(req.getKey());
        secret.setCreatedBy(principal.getName());
        secret.setEncryptedValue(encryptionService.encrypt(req.getValue()));

        repo.save(secret);

        auditClient.logEvent("CREATE", req.getKey(), principal.getName());

        return ResponseEntity.ok("Secret stored successfully");
    }

    @GetMapping("/{key}")
    public ResponseEntity<?> getSecret(@PathVariable String key,
                                       Principal principal) {
        return repo.findBySecretKey(key)
            .map(secret -> {
                String decrypted = encryptionService.decrypt(secret.getEncryptedValue());
                auditClient.logEvent("READ", key, principal.getName());
                return ResponseEntity.ok(Map.of("key", key, "value", decrypted));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<?> deleteSecret(@PathVariable String key,
                                          Principal principal) {
        repo.deleteBySecretKey(key);
        auditClient.logEvent("DELETE", key, principal.getName());
        return ResponseEntity.ok("Secret deleted");
    }
}
```

### Request DTO

```java
public class SecretRequest {
    private String key;
    private String value;

    // Constructors, Getters, Setters
    public SecretRequest() {}

    public SecretRequest(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
```

---

## Audit Client

### REST Client to Audit Service

Location: `secret-service/src/main/java/.../client/AuditClient.java`

```java
@Service
public class AuditClient {

    private final WebClient webClient;

    public AuditClient(WebClient.Builder builder) {
        this.webClient = builder
            .baseUrl("http://audit-service:8081/api/audit")
            .build();
    }

    public void logEvent(String action, String secretKey, String username) {
        webClient.post()
            .uri("/log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of(
                "action", action,
                "secretKey", secretKey,
                "username", username
            ))
            .retrieve()
            .bodyToMono(Void.class)
            .subscribe();
    }
}
```

### WebClient Configuration

Add this bean configuration:

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
```

### Dependencies

Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

---

## Testing the API

### Complete API Workflow (Live Demo)

#### 1. Login and Get Token

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Store a Secret

```bash
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key": "db.password", "value": "mySecretP@ss"}'
```

**Response:**
```json
"Secret stored successfully"
```

#### 3. Retrieve a Secret

```bash
curl -X GET http://localhost:8080/api/secrets/db.password \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
{
  "key": "db.password",
  "value": "mySecretP@ss"
}
```

#### 4. Delete a Secret

```bash
curl -X DELETE http://localhost:8080/api/secrets/db.password \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
"Secret deleted"
```

#### 5. Check Audit Logs

```bash
curl -X GET http://localhost:8081/api/audit \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "action": "CREATE",
    "secretKey": "db.password",
    "timestamp": "2025-11-19T10:30:00"
  },
  {
    "id": 2,
    "username": "admin",
    "action": "READ",
    "secretKey": "db.password",
    "timestamp": "2025-11-19T10:31:00"
  },
  {
    "id": 3,
    "username": "admin",
    "action": "DELETE",
    "secretKey": "db.password",
    "timestamp": "2025-11-19T10:32:00"
  }
]
```

---

## Troubleshooting

### Common Issues

#### Service Can't Connect to Database

```bash
# Check if database containers are running
docker-compose ps

# View logs
docker-compose logs secrets-db
docker-compose logs audit-db
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :8080
lsof -i :8081

# Kill the process or change port in docker-compose.yml
```

#### Encryption Key Error

Ensure your encryption key is exactly 16, 24, or 32 bytes:

```properties
# 16 bytes (AES-128)
encryption.key=MySecure16ByteK1

# 24 bytes (AES-192)
encryption.key=MySecure24ByteKey123456

# 32 bytes (AES-256)
encryption.key=MySecure32ByteKeyForAES256Enc!
```

---

## Best Practices

### Security
- Never commit encryption keys or JWT secrets to version control
- Use environment variables or secret management services
- Rotate encryption keys regularly
- Use HTTPS in production

### Performance
- Add database indexes on frequently queried columns
- Implement connection pooling
- Use caching for frequently accessed secrets
- Monitor resource usage

### Monitoring
- Add health check endpoints
- Implement logging with ELK stack
- Use Prometheus/Grafana for metrics
- Set up alerts for failed operations

---

## Next Steps

1. ✅ Set up the docker-compose environment
2. ✅ Test all API endpoints
3. 🔜 Add integration tests
4. 🔜 Configure production deployment
5. 🔜 Implement secret versioning
6. 🔜 Add secret expiration/rotation

**Happy containerizing!** 🐳🔐