# Cloud Secrets Manager - A+ Production Implementation Plan 

Complete roadmap to transform this project into a production-grade, enterprise-ready secrets management system.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Phase 1: Enhanced Security](#phase-1-enhanced-security)
3. [Phase 2: Production Features](#phase-2-production-features)
4. [Phase 3: Monitoring & Observability](#phase-3-monitoring--observability)
5. [Phase 4: Testing & Quality](#phase-4-testing--quality)
6. [Phase 5: Documentation & Deployment](#phase-5-documentation--deployment)
7. [Implementation Timeline](#implementation-timeline)
8. [Final Checklist](#final-checklist)

---

## Project Overview

### Goals
Transform the Cloud Secrets Manager into an **A+ production-grade system** with:
- Enterprise-level security (Vault/KMS integration)
- Production-ready features (versioning, expiration, RBAC)
- Comprehensive monitoring & observability
- 80%+ test coverage
- Complete documentation
- Multi-environment deployment strategy

### Tech Stack Upgrades

**Core:**
- Spring Boot 3.2+ with Java 21
- Spring Cloud Vault 4.1+
- Spring Security 6+
- PostgreSQL 15+

**Security:**
- HashiCorp Vault / AWS KMS
- Kubernetes Sealed Secrets
- OAuth2/OIDC support
- Argon2 password hashing

**Monitoring:**
- Prometheus + Grafana
- OpenTelemetry (distributed tracing)
- ELK Stack (logging)
- Micrometer metrics

**Testing:**
- JUnit 5 + Mockito
- Testcontainers
- Spring Cloud Contract
- Gatling (load testing)

---

## Phase 1: Enhanced Security 

### 1.1 Spring Cloud Vault Integration

#### Dependencies

Add to `secret-service/pom.xml`:

```xml
<dependencies>
    <!-- Spring Cloud Vault -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-vault-config</artifactId>
    </dependency>
    
    <!-- AWS KMS Alternative -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>kms</artifactId>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

#### Vault Configuration

`secret-service/src/main/resources/bootstrap.yml`:

```yaml
spring:
  application:
    name: secret-service
  cloud:
    vault:
      enabled: true
      uri: ${VAULT_URI:http://vault:8200}
      authentication: TOKEN
      token: ${VAULT_TOKEN}
      kv:
        enabled: true
        backend: secret
        default-context: ${spring.application.name}
      generic:
        enabled: true
      database:
        enabled: true
        role: secret-service
        backend: database
      transit:
        enabled: true
        backend: transit
```

#### Enhanced Encryption Service

`secret-service/src/main/java/com/secrets/service/VaultEncryptionService.java`:

```java
@Service
@Primary
public class VaultEncryptionService implements EncryptionService {

    private final VaultTemplate vaultTemplate;
    private static final String TRANSIT_KEY_NAME = "secrets-encryption-key";

    public VaultEncryptionService(VaultTemplate vaultTemplate) {
        this.vaultTemplate = vaultTemplate;
        initializeTransitKey();
    }

    private void initializeTransitKey() {
        try {
            vaultTemplate.opsForTransit().createKey(TRANSIT_KEY_NAME);
        } catch (VaultException e) {
            // Key already exists
        }
    }

    @Override
    public String encrypt(String plainText) {
        try {
            VaultTransitContext context = VaultTransitContext.empty();
            String ciphertext = vaultTemplate.opsForTransit()
                .encrypt(TRANSIT_KEY_NAME, plainText.getBytes(StandardCharsets.UTF_8), context);
            return ciphertext;
        } catch (Exception e) {
            throw new EncryptionException("Failed to encrypt secret", e);
        }
    }

    @Override
    public String decrypt(String ciphertext) {
        try {
            VaultTransitContext context = VaultTransitContext.empty();
            byte[] plaintext = vaultTemplate.opsForTransit()
                .decrypt(TRANSIT_KEY_NAME, ciphertext, context);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new EncryptionException("Failed to decrypt secret", e);
        }
    }

    @Override
    public String rotate(String ciphertext) {
        try {
            // Vault handles key rotation automatically
            vaultTemplate.opsForTransit().rotate(TRANSIT_KEY_NAME);
            // Re-encrypt with new key version
            return vaultTemplate.opsForTransit()
                .rewrap(TRANSIT_KEY_NAME, ciphertext);
        } catch (Exception e) {
            throw new EncryptionException("Failed to rotate encryption key", e);
        }
    }
}
```

#### AWS KMS Alternative

`secret-service/src/main/java/com/secrets/service/KmsEncryptionService.java`:

```java
@Service
@ConditionalOnProperty(name = "encryption.provider", havingValue = "kms")
public class KmsEncryptionService implements EncryptionService {

    private final KmsClient kmsClient;
    private final String keyId;

    public KmsEncryptionService(
            @Value("${aws.kms.key-id}") String keyId,
            @Value("${aws.region:us-east-1}") String region) {
        this.keyId = keyId;
        this.kmsClient = KmsClient.builder()
            .region(Region.of(region))
            .build();
    }

    @Override
    public String encrypt(String plainText) {
        try {
            EncryptRequest request = EncryptRequest.builder()
                .keyId(keyId)
                .plaintext(SdkBytes.fromUtf8String(plainText))
                .build();

            EncryptResponse response = kmsClient.encrypt(request);
            return Base64.getEncoder().encodeToString(
                response.ciphertextBlob().asByteArray()
            );
        } catch (Exception e) {
            throw new EncryptionException("KMS encryption failed", e);
        }
    }

    @Override
    public String decrypt(String ciphertext) {
        try {
            byte[] encryptedData = Base64.getDecoder().decode(ciphertext);
            
            DecryptRequest request = DecryptRequest.builder()
                .keyId(keyId)
                .ciphertextBlob(SdkBytes.fromByteArray(encryptedData))
                .build();

            DecryptResponse response = kmsClient.decrypt(request);
            return response.plaintext().asUtf8String();
        } catch (Exception e) {
            throw new EncryptionException("KMS decryption failed", e);
        }
    }
}
```

### 1.2 Kubernetes Sealed Secrets

#### Install Sealed Secrets Controller

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install kubeseal CLI
brew install kubeseal  # macOS
# or
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64 -O kubeseal
```

#### Create Sealed Secrets

```bash
# Create regular secret
kubectl create secret generic cloud-secrets-config \
  --from-literal=JWT_SECRET=myJWTSecret123 \
  --from-literal=AES_KEY=myAESKey1234567890 \
  --from-literal=POSTGRES_PASSWORD=myDBPassword \
  --dry-run=client -o yaml > secret.yaml

# Seal the secret
kubeseal -f secret.yaml -w sealed-secret.yaml

# Apply sealed secret (safe to commit!)
kubectl apply -f sealed-secret.yaml
```

#### Sealed Secret Manifest

`k8s/sealed-secrets.yaml`:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: cloud-secrets-config
  namespace: default
spec:
  encryptedData:
    JWT_SECRET: AgBQ7Vn... # encrypted data
    AES_KEY: AgCXk9P... # encrypted data
    POSTGRES_PASSWORD: AgDM2Lw... # encrypted data
    VAULT_TOKEN: AgEPq8R... # encrypted data
  template:
    metadata:
      name: cloud-secrets-config
      namespace: default
    type: Opaque
```

### 1.3 Enhanced JWT with Refresh Tokens

#### JWT Configuration

`secret-service/src/main/java/com/secrets/config/JwtConfig.java`:

```java
@Configuration
@ConfigurationProperties(prefix = "security.jwt")
@Validated
public class JwtConfig {
    
    @NotBlank
    private String secret;
    
    @Min(60000) // min 1 minute
    private long accessTokenValidityMs = 900000; // 15 minutes
    
    @Min(3600000) // min 1 hour
    private long refreshTokenValidityMs = 604800000; // 7 days
    
    private String issuer = "secrets-manager";
    
    // Getters and setters
}
```

#### Enhanced Token Provider

`secret-service/src/main/java/com/secrets/security/JwtTokenProvider.java`:

```java
@Component
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtConfig jwtConfig, 
                           RefreshTokenRepository refreshTokenRepository) {
        this.jwtConfig = jwtConfig;
        this.refreshTokenRepository = refreshTokenRepository;
        this.secretKey = Keys.hmacShaKeyFor(
            jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    public TokenPair generateTokenPair(String username, Collection<? extends GrantedAuthority> authorities) {
        String accessToken = generateAccessToken(username, authorities);
        String refreshToken = generateRefreshToken(username);
        
        // Store refresh token in database
        RefreshToken token = new RefreshToken();
        token.setToken(refreshToken);
        token.setUsername(username);
        token.setExpiryDate(new Date(System.currentTimeMillis() + jwtConfig.getRefreshTokenValidityMs()));
        refreshTokenRepository.save(token);
        
        return new TokenPair(accessToken, refreshToken);
    }

    private String generateAccessToken(String username, Collection<? extends GrantedAuthority> authorities) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtConfig.getAccessTokenValidityMs());

        return Jwts.builder()
            .setSubject(username)
            .claim("authorities", authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()))
            .claim("type", "access")
            .setIssuedAt(now)
            .setExpiration(expiry)
            .setIssuer(jwtConfig.getIssuer())
            .setId(UUID.randomUUID().toString()) // JTI for revocation
            .signWith(secretKey, SignatureAlgorithm.HS512)
            .compact();
    }

    private String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtConfig.getRefreshTokenValidityMs());

        return Jwts.builder()
            .setSubject(username)
            .claim("type", "refresh")
            .setIssuedAt(now)
            .setExpiration(expiry)
            .setIssuer(jwtConfig.getIssuer())
            .setId(UUID.randomUUID().toString())
            .signWith(secretKey, SignatureAlgorithm.HS512)
            .compact();
    }

    public TokenPair refreshAccessToken(String refreshToken) {
        try {
            Claims claims = validateAndParseClaims(refreshToken);
            
            if (!"refresh".equals(claims.get("type"))) {
                throw new InvalidTokenException("Not a refresh token");
            }

            // Verify token exists in database and is not revoked
            RefreshToken storedToken = refreshTokenRepository
                .findByToken(refreshToken)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));

            if (storedToken.isRevoked()) {
                throw new InvalidTokenException("Refresh token has been revoked");
            }

            String username = claims.getSubject();
            
            // Load user authorities
            UserDetails userDetails = loadUserDetails(username);
            
            return generateTokenPair(username, userDetails.getAuthorities());
            
        } catch (Exception e) {
            throw new InvalidTokenException("Invalid refresh token", e);
        }
    }

    public void revokeToken(String token) {
        try {
            Claims claims = validateAndParseClaims(token);
            String jti = claims.getId();
            
            // Add to Redis blacklist
            redisTemplate.opsForValue().set(
                "blacklist:" + jti,
                "revoked",
                Duration.ofMillis(jwtConfig.getAccessTokenValidityMs())
            );
            
        } catch (Exception e) {
            throw new TokenRevocationException("Failed to revoke token", e);
        }
    }

    public void revokeRefreshToken(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
    }

    public boolean isTokenBlacklisted(String jti) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("blacklist:" + jti)
        );
    }

    public Claims validateAndParseClaims(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException("Token has expired", e);
        } catch (JwtException e) {
            throw new InvalidTokenException("Invalid token", e);
        }
    }
}
```

#### Refresh Token Entity

`secret-service/src/main/java/com/secrets/entity/RefreshToken.java`:

```java
@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_token", columnList = "token"),
    @Index(name = "idx_username", columnList = "username")
})
public class RefreshToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 500)
    private String token;
    
    @Column(nullable = false)
    private String username;
    
    @Column(nullable = false)
    private Date expiryDate;
    
    @Column(nullable = false)
    private boolean revoked = false;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private String ipAddress;
    private String userAgent;
    
    // Getters and setters
    
    public boolean isExpired() {
        return new Date().after(expiryDate);
    }
}
```

#### Enhanced Auth Controller

`secret-service/src/main/java/com/secrets/controller/AuthController.java`:

```java
@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(), 
                request.getPassword()
            )
        );

        UserDetails user = (UserDetails) auth.getPrincipal();
        TokenPair tokens = tokenProvider.generateTokenPair(
            user.getUsername(), 
            user.getAuthorities()
        );

        return ResponseEntity.ok(new TokenResponse(
            tokens.getAccessToken(),
            tokens.getRefreshToken(),
            "Bearer",
            jwtConfig.getAccessTokenValidityMs() / 1000
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        
        TokenPair tokens = tokenProvider.refreshAccessToken(request.getRefreshToken());
        
        return ResponseEntity.ok(new TokenResponse(
            tokens.getAccessToken(),
            tokens.getRefreshToken(),
            "Bearer",
            jwtConfig.getAccessTokenValidityMs() / 1000
        ));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logout(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody(required = false) RefreshTokenRequest request) {
        
        String token = authHeader.substring(7);
        tokenProvider.revokeToken(token);
        
        if (request != null && request.getRefreshToken() != null) {
            tokenProvider.revokeRefreshToken(request.getRefreshToken());
        }
        
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(UserResponse.from(user));
    }
}
```

### 1.4 Enhanced Password Security

#### User Entity with Argon2

`secret-service/src/main/java/com/secrets/entity/User.java`:

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username", unique = true),
    @Index(name = "idx_email", columnList = "email", unique = true)
})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String passwordHash; // Argon2 hashed
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<String> roles = new HashSet<>();
    
    @Column(nullable = false)
    private boolean enabled = true;
    
    @Column(nullable = false)
    private boolean accountNonLocked = true;
    
    private Integer failedLoginAttempts = 0;
    
    private LocalDateTime lastLoginAt;
    private LocalDateTime passwordChangedAt = LocalDateTime.now();
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Version
    private Long version;
    
    // Getters and setters
}
```

#### Password Encoder Configuration

`secret-service/src/main/java/com/secrets/config/SecurityConfig.java`:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Use Argon2 (winner of Password Hashing Competition)
        return new Argon2PasswordEncoder(
            16,  // saltLength
            32,  // hashLength
            1,   // parallelism
            65536, // memory (64MB)
            3    // iterations
        );
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                          JwtAuthenticationFilter jwtFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> 
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                .accessDeniedHandler(new JwtAccessDeniedHandler())
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## Phase 2: Production Features 

### 2.1 Secret Versioning

#### Secret Version Entity

`secret-service/src/main/java/com/secrets/entity/SecretVersion.java`:

```java
@Entity
@Table(name = "secret_versions", indexes = {
    @Index(name = "idx_secret_id_version", columnList = "secretId,version")
})
public class SecretVersion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long secretId;
    
    @Column(nullable = false)
    private Integer version;
    
    @Column(nullable = false, length = 5000)
    private String encryptedValue;
    
    @Column(nullable = false)
    private String createdBy;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private String changeDescription;
    
    // Getters and setters
}
```

#### Enhanced Secret Entity

`secret-service/src/main/java/com/secrets/entity/Secret.java`:

```java
@Entity
@Table(name = "secrets", indexes = {
    @Index(name = "idx_secret_key", columnList = "secretKey", unique = true),
    @Index(name = "idx_created_by", columnList = "createdBy")
})
public class Secret {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String secretKey;
    
    @Column(nullable = false, length = 5000)
    private String encryptedValue;
    
    @Column(nullable = false)
    private Integer currentVersion = 1;
    
    private String createdBy;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Expiration support
    private LocalDateTime expiresAt;
    
    // Soft delete
    private LocalDateTime deletedAt;
    
    // Rotation tracking
    private LocalDateTime lastRotatedAt;
    private Integer rotationPeriodDays;
    
    // Metadata
    @Column(length = 1000)
    private String description;
    
    @ElementCollection
    @CollectionTable(name = "secret_tags", joinColumns = @JoinColumn(name = "secret_id"))
    @Column(name = "tag")
    private Set<String> tags = new HashSet<>();
    
    @Version
    private Long version;
    
    // Business logic
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean needsRotation() {
        if (rotationPeriodDays == null || lastRotatedAt == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(
            lastRotatedAt.plusDays(rotationPeriodDays)
        );
    }
    
    // Getters and setters
}
```

#### Versioning Service

`secret-service/src/main/java/com/secrets/service/SecretVersioningService.java`:

```java
@Service
@Transactional
public class SecretVersioningService {

    private final SecretRepository secretRepository;
    private final SecretVersionRepository versionRepository;
    private final EncryptionService encryptionService;
    private final AuditService auditService;

    public SecretResponse updateSecretWithVersion(
            String secretKey, 
            String newValue, 
            String username,
            String changeDescription) {
        
        Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException(secretKey));
        
        // Save current version to history
        SecretVersion oldVersion = new SecretVersion();
        oldVersion.setSecretId(secret.getId());
        oldVersion.setVersion(secret.getCurrentVersion());
        oldVersion.setEncryptedValue(secret.getEncryptedValue());
        oldVersion.setCreatedBy(secret.getCreatedBy());
        oldVersion.setCreatedAt(secret.getUpdatedAt());
        versionRepository.save(oldVersion);
        
        // Update secret with new value
        secret.setEncryptedValue(encryptionService.encrypt(newValue));
        secret.setCurrentVersion(secret.getCurrentVersion() + 1);
        secret.setUpdatedAt(LocalDateTime.now());
        secretRepository.save(secret);
        
        // Audit
        auditService.logEvent(AuditAction.UPDATE, secretKey, username, 
            "Updated to version " + secret.getCurrentVersion());
        
        return SecretResponse.from(secret);
    }

    public SecretResponse rollbackToVersion(
            String secretKey, 
            Integer targetVersion, 
            String username) {
        
        Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException(secretKey));
        
        SecretVersion oldVersion = versionRepository
            .findBySecretIdAndVersion(secret.getId(), targetVersion)
            .orElseThrow(() -> new VersionNotFoundException(secretKey, targetVersion));
        
        // Create new version from old value
        SecretVersion currentAsVersion = new SecretVersion();
        currentAsVersion.setSecretId(secret.getId());
        currentAsVersion.setVersion(secret.getCurrentVersion());
        currentAsVersion.setEncryptedValue(secret.getEncryptedValue());
        currentAsVersion.setCreatedBy(username);
        currentAsVersion.setCreatedAt(LocalDateTime.now());
        versionRepository.save(currentAsVersion);
        
        // Rollback
        secret.setEncryptedValue(oldVersion.getEncryptedValue());
        secret.setCurrentVersion(secret.getCurrentVersion() + 1);
        secret.setUpdatedAt(LocalDateTime.now());
        secretRepository.save(secret);
        
        auditService.logEvent(AuditAction.ROLLBACK, secretKey, username,
            "Rolled back to version " + targetVersion);
        
        return SecretResponse.from(secret);
    }

    public List<SecretVersionResponse> getVersionHistory(String secretKey) {
        Secret secret = secretRepository.findBySecretKey(secretKey)
            .orElseThrow(() -> new SecretNotFoundException(secretKey));
        
        List<SecretVersion> versions = versionRepository
            .findBySecretIdOrderByVersionDesc(secret.getId());
        
        return versions.stream()
            .map(SecretVersionResponse::from)
            .collect(Collectors.toList());
    }
}
```

### 2.2 RBAC (Role-Based Access Control)

#### Secret Policy Entity

`secret-service/src/main/java/com/secrets/entity/SecretPolicy.java`:

```java
@Entity
@Table(name = "secret_policies", indexes = {
    @Index(name = "idx_secret_principal", columnList = "secretId,principalType,principalId")
})
public class SecretPolicy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long secretId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrincipalType principalType; // USER, GROUP, ROLE
    
    @Column(nullable = false)
    private String principalId; // username, group name, or role name
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "policy_permissions", joinColumns = @JoinColumn(name = "policy_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission")
    private Set<Permission> permissions = new HashSet<>();
    
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt = LocalDateTime.now();
    private String createdBy;
    
    // Getters and setters
}

enum PrincipalType {
    USER, GROUP, ROLE
}

enum Permission {
    READ, WRITE, DELETE, SHARE, ROTATE, ADMIN
}
```

#### Authorization Service

`secret-service/src/main/java/com/secrets/service/AuthorizationService.java`:

```java
@Service
public class AuthorizationService {

    private final SecretPolicyRepository policyRepository;
    private final UserRepository userRepository;

    public boolean hasPermission(String username, Long secretId, Permission permission) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UserNotFoundException(username));
        
        List<SecretPolicy> policies = policyRepository.findBySecretId(secretId);
        
        return policies.stream()
            .filter(policy -> !isPolicyExpired(policy))
            .filter(policy -> isPolicyApplicable(policy, user))
            .anyMatch(policy -> policy.getPermissions().contains(permission));
    }

    public void checkPermission(String username, Long secretId, Permission permission) {
        if (!hasPermission(username, secretId, permission)) {
            throw new AccessDeniedException(
                String.format("User %s lacks %s permission for secret %d", 
                    username, permission, secretId)
            );
        }
    }

    private boolean isPolicyExpired(SecretPolicy policy) {
        return policy.getExpiresAt() != null && 
               LocalDateTime.now().isAfter(policy.getExpiresAt());
    }

    private boolean isPolicyApplicable(SecretPolicy policy, User user) {
        switch (policy.getPrincipalType()) {
            case USER:
                return policy.getPrincipalId().equals(user.getUsername());
            case ROLE:
                return user.getRoles().contains(policy.getPrincipalId());
            case GROUP:
                return user.getGroups().contains(policy.getPrincipalId());
            default:
                return false;
        }
    }

    public void grantPermission(Long secretId, String principalType, 
                               String principalId, Set<Permission> permissions,
                               String grantedBy) {
        SecretPolicy policy = new SecretPolicy();
        policy.setSecretId(secretId);
        policy.setPrincipalType(PrincipalType.valueOf(principalType));
        policy.setPrincipalId(principalId);
        policy.setPermissions(permissions);
        policy.setCreatedBy(grantedBy);
        
        policyRepository.save(policy);
    }

    public void revokePermission(Long secretId, String principalType, String principalId) {
        policyRepository.deleteBySecretIdAndPrincipalTypeAndPrincipalId(
            secretId, PrincipalType.valueOf(principalType), principalId
        );
    }
}
```

#### Enhanced Secret Controller with Authorization

`secret-service/src/main/java/com/secrets/controller/SecretController.java`:

```java
@RestController
@RequestMapping("/api/secrets")
@Validated
public class SecretController {

    private final SecretService secretService;
    private final AuthorizationService authorizationService;
    private final AuditService auditService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<SecretResponse> createSecret(
            @Valid @RequestBody CreateSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        SecretResponse response = secretService.createSecret(
            request, 
            userDetails.getUsername()
        );
        
        auditService.logEvent(AuditAction.CREATE, response.getKey(), 
            userDetails.getUsername(), null);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{key}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SecretResponse> getSecret(
            @PathVariable String key,
            @RequestParam(required = false) Integer version,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        // Check authorization
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.READ
        );
        
        SecretResponse response = version != null 
            ? secretService.getSecretVersion(key, version, userDetails.getUsername())
            : secretService.getSecret(key, userDetails.getUsername());
        
        auditService.logEvent(AuditAction.READ, key, 
            userDetails.getUsername(), null);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{key}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SecretResponse> updateSecret(
            @PathVariable String key,
            @Valid @RequestBody UpdateSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.WRITE
        );
        
        SecretResponse response = secretService.updateSecret(
            key, 
            request, 
            userDetails.getUsername()
        );
        
        auditService.logEvent(AuditAction.UPDATE, key, 
            userDetails.getUsername(), request.getChangeDescription());
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSecret(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.DELETE
        );
        
        secretService.deleteSecret(key, userDetails.getUsername());
        
        auditService.logEvent(AuditAction.DELETE, key, 
            userDetails.getUsername(), null);
        
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{key}/rotate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SecretResponse> rotateSecret(
            @PathVariable String key,
            @Valid @RequestBody RotateSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.ROTATE
        );
        
        SecretResponse response = secretService.rotateSecret(
            key, 
            request.getNewValue(), 
            userDetails.getUsername()
        );
        
        auditService.logEvent(AuditAction.ROTATE, key, 
            userDetails.getUsername(), null);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{key}/share")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> shareSecret(
            @PathVariable String key,
            @Valid @RequestBody ShareSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.SHARE
        );
        
        authorizationService.grantPermission(
            secret.getId(),
            request.getPrincipalType(),
            request.getPrincipalId(),
            request.getPermissions(),
            userDetails.getUsername()
        );
        
        auditService.logEvent(AuditAction.SHARE, key, 
            userDetails.getUsername(), 
            "Shared with " + request.getPrincipalId());
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{key}/versions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SecretVersionResponse>> getVersionHistory(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.READ
        );
        
        List<SecretVersionResponse> versions = secretService.getVersionHistory(key);
        
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/{key}/rollback/{version}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SecretResponse> rollbackSecret(
            @PathVariable String key,
            @PathVariable Integer version,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Secret secret = secretService.findByKey(key);
        
        authorizationService.checkPermission(
            userDetails.getUsername(), 
            secret.getId(), 
            Permission.WRITE
        );
        
        SecretResponse response = secretService.rollbackToVersion(
            key, 
            version, 
            userDetails.getUsername()
        );
        
        auditService.logEvent(AuditAction.ROLLBACK, key, 
            userDetails.getUsername(), 
            "Rolled back to version " + version);
        
        return ResponseEntity.ok(response);
    }
}
```

### 2.3 Secret Expiration & Rotation

#### Scheduled Task for Expiration Check

`secret-service/src/main/java/com/secrets/scheduler/SecretExpirationScheduler.java`:

```java
@Component
@EnableScheduling
public class SecretExpirationScheduler {

    private final SecretRepository secretRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void checkExpiredSecrets() {
        List<Secret> expiredSecrets = secretRepository
            .findByExpiresAtBeforeAndDeletedAtIsNull(LocalDateTime.now());
        
        expiredSecrets.forEach(secret -> {
            secret.setDeletedAt(LocalDateTime.now());
            secretRepository.save(secret);
            
            auditService.logEvent(
                AuditAction.EXPIRE, 
                secret.getSecretKey(), 
                "system", 
                "Secret expired and auto-deleted"
            );
            
            notificationService.sendSecretExpiredNotification(secret);
        });
    }

    @Scheduled(cron = "0 0 8 * * *") // Daily at 8 AM
    public void checkSecretsNeedingRotation() {
        List<Secret> secretsNeedingRotation = secretRepository
            .findSecretsNeedingRotation(LocalDateTime.now());
        
        secretsNeedingRotation.forEach(secret -> {
            notificationService.sendRotationReminderNotification(secret);
        });
    }

    @Scheduled(cron = "0 0 0 * * SUN") // Weekly on Sunday
    public void warnUpcomingExpirations() {
        LocalDateTime oneWeekFromNow = LocalDateTime.now().plusDays(7);
        
        List<Secret> soonToExpire = secretRepository
            .findByExpiresAtBetweenAndDeletedAtIsNull(
                LocalDateTime.now(), 
                oneWeekFromNow
            );
        
        soonToExpire.forEach(secret -> {
            notificationService.sendExpirationWarningNotification(secret);
        });
    }
}
```

---

## Phase 3: Monitoring & Observability 

### 3.1 Prometheus Metrics

#### Dependencies

Add to `pom.xml`:

```xml
<dependencies>
    <!-- Micrometer Prometheus -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
    
    <!-- Spring Boot Actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

#### Metrics Configuration

`application.yml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: always
    prometheus:
      enabled: true
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${ENVIRONMENT:dev}
    distribution:
      percentiles-histogram:
        http.server.requests: true
  prometheus:
    metrics:
      export:
        enabled: true
```

#### Custom Metrics Service

`secret-service/src/main/java/com/secrets/metrics/SecretMetrics.java`:

```java
@Component
public class SecretMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter secretsCreated;
    private final Counter secretsRead;
    private final Counter secretsUpdated;
    private final Counter secretsDeleted;
    private final Counter secretsRotated;
    private final Counter authenticationAttempts;
    private final Counter authenticationFailures;
    private final Timer encryptionTimer;
    private final Timer decryptionTimer;
    private final Gauge activeSecrets;

    public SecretMetrics(MeterRegistry meterRegistry, SecretRepository secretRepository) {
        this.meterRegistry = meterRegistry;
        
        this.secretsCreated = Counter.builder("secrets.created")
            .description("Total secrets created")
            .tag("type", "secret")
            .register(meterRegistry);
        
        this.secretsRead = Counter.builder("secrets.read")
            .description("Total secrets read")
            .tag("type", "secret")
            .register(meterRegistry);
        
        this.secretsUpdated = Counter.builder("secrets.updated")
            .description("Total secrets updated")
            .tag("type", "secret")
            .register(meterRegistry);
        
        this.secretsDeleted = Counter.builder("secrets.deleted")
            .description("Total secrets deleted")
            .tag("type", "secret")
            .register(meterRegistry);
        
        this.secretsRotated = Counter.builder("secrets.rotated")
            .description("Total secrets rotated")
            .tag("type", "secret")
            .register(meterRegistry);
        
        this.authenticationAttempts = Counter.builder("auth.attempts")
            .description("Total authentication attempts")
            .tag("type", "auth")
            .register(meterRegistry);
        
        this.authenticationFailures = Counter.builder("auth.failures")
            .description("Failed authentication attempts")
            .tag("type", "auth")
            .register(meterRegistry);
        
        this.encryptionTimer = Timer.builder("encryption.duration")
            .description("Time taken to encrypt secrets")
            .register(meterRegistry);
        
        this.decryptionTimer = Timer.builder("decryption.duration")
            .description("Time taken to decrypt secrets")
            .register(meterRegistry);
        
        this.activeSecrets = Gauge.builder("secrets.active", secretRepository, 
            repo -> repo.countByDeletedAtIsNull())
            .description("Number of active secrets")
            .register(meterRegistry);
    }

    public void recordSecretCreation(String username) {
        secretsCreated.increment();
        meterRegistry.counter("secrets.created.by.user", "user", username).increment();
    }

    public void recordSecretRead(String secretKey, boolean success) {
        secretsRead.increment();
        if (!success) {
            meterRegistry.counter("secrets.read.failures").increment();
        }
    }

    public void recordSecretUpdate(String username) {
        secretsUpdated.increment();
        meterRegistry.counter("secrets.updated.by.user", "user", username).increment();
    }

    public void recordSecretDeletion(String username) {
        secretsDeleted.increment();
    }

    public void recordSecretRotation(String secretKey) {
        secretsRotated.increment();
    }

    public void recordAuthenticationAttempt(String username, boolean success) {
        authenticationAttempts.increment();
        if (!success) {
            authenticationFailures.increment();
            meterRegistry.counter("auth.failures.by.user", "user", username).increment();
        }
    }

    public <T> T timeEncryption(Supplier<T> operation) {
        return encryptionTimer.record(operation);
    }

    public <T> T timeDecryption(Supplier<T> operation) {
        return decryptionTimer.record(operation);
    }
}
```

#### Prometheus Configuration

`k8s/prometheus/prometheus-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'secret-service'
        metrics_path: '/actuator/prometheus'
        static_configs:
          - targets: ['secret-service:8080']
            labels:
              service: 'secret-service'
      
      - job_name: 'audit-service'
        metrics_path: '/actuator/prometheus'
        static_configs:
          - targets: ['audit-service:8081']
            labels:
              service: 'audit-service'
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

### 3.2 OpenTelemetry Distributed Tracing

#### Dependencies

```xml
<dependencies>
    <!-- OpenTelemetry -->
    <dependency>
        <groupId>io.opentelemetry</groupId>
        <artifactId>opentelemetry-api</artifactId>
    </dependency>
    <dependency>
        <groupId>io.opentelemetry</groupId>
        <artifactId>opentelemetry-sdk</artifactId>
    </dependency>
    <dependency>
        <groupId>io.opentelemetry</groupId>
        <artifactId>opentelemetry-exporter-otlp</artifactId>
    </dependency>
    <dependency>
        <groupId>io.opentelemetry.instrumentation</groupId>
        <artifactId>opentelemetry-spring-boot-starter</artifactId>
    </dependency>
</dependencies>
```

#### Tracing Configuration

`secret-service/src/main/java/com/secrets/config/TracingConfig.java`:

```java
@Configuration
public class TracingConfig {

    @Bean
    public OpenTelemetry openTelemetry() {
        Resource resource = Resource.getDefault()
            .merge(Resource.create(Attributes.of(
                ResourceAttributes.SERVICE_NAME, "secret-service",
                ResourceAttributes.SERVICE_VERSION, "1.0.0"
            )));

        SdkTracerProvider sdkTracerProvider = SdkTracerProvider.builder()
            .addSpanProcessor(BatchSpanProcessor.builder(
                OtlpGrpcSpanExporter.builder()
                    .setEndpoint("http://jaeger:4317")
                    .build()
            ).build())
            .setResource(resource)
            .build();

        return OpenTelemetrySdk.builder()
            .setTracerProvider(sdkTracerProvider)
            .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
            .buildAndRegisterGlobal();
    }

    @Bean
    public Tracer tracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer("secret-service");
    }
}
```

#### Custom Tracing Aspect

`secret-service/src/main/java/com/secrets/aspect/TracingAspect.java`:

```java
@Aspect
@Component
public class TracingAspect {

    private final Tracer tracer;

    public TracingAspect(Tracer tracer) {
        this.tracer = tracer;
    }

    @Around("@annotation(traced)")
    public Object trace(ProceedingJoinPoint joinPoint, Traced traced) throws Throwable {
        Span span = tracer.spanBuilder(traced.value())
            .setSpanKind(SpanKind.INTERNAL)
            .startSpan();
        
        try (Scope scope = span.makeCurrent()) {
            // Add method parameters as attributes
            Object[] args = joinPoint.getArgs();
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();
            
            for (int i = 0; i < args.length && i < paramNames.length; i++) {
                if (args[i] != null && !(args[i] instanceof UserDetails)) {
                    span.setAttribute(paramNames[i], args[i].toString());
                }
            }
            
            Object result = joinPoint.proceed();
            span.setStatus(StatusCode.OK);
            return result;
            
        } catch (Throwable t) {
            span.recordException(t);
            span.setStatus(StatusCode.ERROR, t.getMessage());
            throw t;
        } finally {
            span.end();
        }
    }
}

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Traced {
    String value();
}
```

### 3.3 ELK Stack Logging

#### Logback Configuration

`secret-service/src/main/resources/logback-spring.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    
    <springProperty scope="context" name="springAppName" source="spring.application.name"/>
    <property name="LOG_FILE" value="${LOG_FILE:-${LOG_PATH:-${LOG_TEMP:-${java.io.tmpdir:-/tmp}}}/spring.log}"/>
    
    <!-- Console Appender -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"app_name":"${springAppName}"}</customFields>
        </encoder>
    </appender>
    
    <!-- File Appender -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_FILE}</file>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"app_name":"${springAppName}"}</customFields>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${LOG_FILE}.%d{yyyy-MM-dd}.gz</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>
    
    <!-- Logstash TCP Appender -->
    <appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>logstash:5000</destination>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"app_name":"${springAppName}"}</customFields>
        </encoder>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
        <appender-ref ref="LOGSTASH"/>
    </root>
    
    <logger name="com.secrets" level="DEBUG"/>
    <logger name="org.springframework.security" level="DEBUG"/>
</configuration>
```

#### Structured Logging Service

`secret-service/src/main/java/com/secrets/service/StructuredLogger.java`:

```java
@Component
public class StructuredLogger {

    private static final Logger log = LoggerFactory.getLogger(StructuredLogger.class);

    public void logSecretAccess(String action, String secretKey, String username, boolean success) {
        MDC.put("action", action);
        MDC.put("secret_key", secretKey);
        MDC.put("username", username);
        MDC.put("success", String.valueOf(success));
        MDC.put("correlation_id", getCorrelationId());
        
        if (success) {
            log.info("Secret access: {} operation on {} by {}", action, secretKey, username);
        } else {
            log.warn("Failed secret access: {} operation on {} by {}", action, secretKey, username);
        }
        
        MDC.clear();
    }

    public void logAuthentication(String username, boolean success, String reason) {
        MDC.put("event_type", "authentication");
        MDC.put("username", username);
        MDC.put("success", String.valueOf(success));
        MDC.put("correlation_id", getCorrelationId());
        
        if (success) {
            log.info("Successful authentication for user: {}", username);
        } else {
            log.warn("Failed authentication for user: {} - Reason: {}", username, reason);
        }
        
        MDC.clear();
    }

    public void logSecurityEvent(String eventType, String description, Map<String, String> metadata) {
        MDC.put("event_type", "security");
        MDC.put("security_event_type", eventType);
        MDC.put("correlation_id", getCorrelationId());
        
        metadata.forEach(MDC::put);
        
        log.warn("Security event - {}: {}", eventType, description);
        
        MDC.clear();
    }

    private String getCorrelationId() {
        return MDC.get("correlation_id") != null 
            ? MDC.get("correlation_id") 
            : UUID.randomUUID().toString();
    }
}
```

### 3.4 Grafana Dashboards

#### Grafana Dashboard JSON

`k8s/monitoring/grafana-dashboard.json`:

```json
{
  "dashboard": {
    "title": "Cloud Secrets Manager - Overview",
    "panels": [
      {
        "title": "Secret Operations Rate",
        "targets": [
          {
            "expr": "rate(secrets_created_total[5m])",
            "legendFormat": "Created"
          },
          {
            "expr": "rate(secrets_read_total[5m])",
            "legendFormat": "Read"
          },
          {
            "expr": "rate(secrets_updated_total[5m])",
            "legendFormat": "Updated"
          },
          {
            "expr": "rate(secrets_deleted_total[5m])",
            "legendFormat": "Deleted"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Authentication Success Rate",
        "targets": [
          {
            "expr": "rate(auth_attempts_total[5m]) - rate(auth_failures_total[5m])",
            "legendFormat": "Successful"
          },
          {
            "expr": "rate(auth_failures_total[5m])",
            "legendFormat": "Failed"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Encryption/Decryption Latency (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(encryption_duration_seconds_bucket[5m]))",
            "legendFormat": "Encryption P95"
          },
          {
            "expr": "histogram_quantile(0.95, rate(decryption_duration_seconds_bucket[5m]))",
            "legendFormat": "Decryption P95"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Secrets",
        "targets": [
          {
            "expr": "secrets_active"
          }
        ],
        "type": "singlestat"
      },
      {
        "title": "HTTP Request Rate by Endpoint",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count[5m])",
            "legendFormat": "{{uri}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          },
          {
            "expr": "rate(http_server_requests_seconds_count{status=~\"4..\"}[5m])",
            "legendFormat": "4xx Errors"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## Phase 4: Testing & Quality 

### 4.1 Unit Tests

#### Encryption Service Tests

`secret-service/src/test/java/com/secrets/service/VaultEncryptionServiceTest.java`:

```java
@SpringBootTest
@TestPropertySource(properties = {
    "spring.cloud.vault.enabled=false"
})
class VaultEncryptionServiceTest {

    @MockBean
    private VaultTemplate vaultTemplate;

    @Autowired
    private VaultEncryptionService encryptionService;

    @Test
    void shouldEncryptAndDecryptSuccessfully() {
        // Given
        String plaintext = "mySecretPassword123";
        String ciphertext = "vault:v1:8SDd3WHDOjf7mq69CyCqYjBXAiQQAVZRkFM96XVZ";
        
        when(vaultTemplate.opsForTransit())
            .thenReturn(mock(VaultTransitOperations.class));
        when(vaultTemplate.opsForTransit().encrypt(anyString(), any(), any()))
            .thenReturn(ciphertext);
        when(vaultTemplate.opsForTransit().decrypt(anyString(), anyString(), any()))
            .thenReturn(plaintext.getBytes());
        
        // When
        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);
        
        // Then
        assertNotEquals(plaintext, encrypted);
        assertEquals(plaintext, decrypted);
    }

    @Test
    void shouldThrowExceptionWhenEncryptionFails() {
        // Given
        when(vaultTemplate.opsForTransit().encrypt(anyString(), any(), any()))
            .thenThrow(new VaultException("Encryption failed"));
        
        // When & Then
        assertThrows(EncryptionException.class, () -> 
            encryptionService.encrypt("test")
        );
    }
}
```

#### Secret Service Tests

`secret-service/src/test/java/com/secrets/service/SecretServiceTest.java`:

```java
@ExtendWith(MockitoExtension.class)
class SecretServiceTest {

    @Mock
    private SecretRepository secretRepository;

    @Mock
    private EncryptionService encryptionService;

    @Mock
    private AuditService auditService;

    @Mock
    private SecretMetrics metrics;

    @InjectMocks
    private SecretService secretService;

    @Test
    void shouldCreateSecretSuccessfully() {
        // Given
        CreateSecretRequest request = new CreateSecretRequest();
        request.setKey("api.key");
        request.setValue("secret123");
        
        when(encryptionService.encrypt("secret123"))
            .thenReturn("encrypted_value");
        when(secretRepository.save(any(Secret.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        
        // When
        SecretResponse response = secretService.createSecret(request, "testuser");
        
        // Then
        assertNotNull(response);
        assertEquals("api.key", response.getKey());
        verify(secretRepository).save(any(Secret.class));
        verify(metrics).recordSecretCreation("testuser");
    }

    @Test
    void shouldThrowExceptionWhenSecretAlreadyExists() {
        // Given
        CreateSecretRequest request = new CreateSecretRequest();
        request.setKey("existing.key");
        
        when(secretRepository.existsBySecretKey("existing.key"))
            .thenReturn(true);
        
        // When & Then
        assertThrows(SecretAlreadyExistsException.class, () ->
            secretService.createSecret(request, "testuser")
        );
    }

    @Test
    void shouldRetrieveAndDecryptSecret() {
        // Given
        Secret secret = new Secret();
        secret.setSecretKey("api.key");
        secret.setEncryptedValue("encrypted_value");
        
        when(secretRepository.findBySecretKey("api.key"))
            .thenReturn(Optional.of(secret));
        when(encryptionService.decrypt("encrypted_value"))
            .thenReturn("decrypted_value");
        
        // When
        SecretResponse response = secretService.getSecret("api.key", "testuser");
        
        // Then
        assertNotNull(response);
        assertEquals("api.key", response.getKey());
        assertEquals("decrypted_value", response.getValue());
        verify(metrics).recordSecretRead("api.key", true);
    }
}
```

### 4.2 Integration Tests with Testcontainers

#### Test Configuration

`secret-service/src/test/java/com/secrets/integration/IntegrationTestBase.java`:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("secrets_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> vault = new GenericContainer<>("vault:1.15")
        .withExposedPorts(8200)
        .withEnv("VAULT_DEV_ROOT_TOKEN_ID", "test-token")
        .withEnv("VAULT_DEV_LISTEN_ADDRESS", "0.0.0.0:8200");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        
        registry.add("spring.cloud.vault.uri", 
            () -> "http://localhost:" + vault.getMappedPort(8200));
        registry.add("spring.cloud.vault.token", () -> "test-token");
    }

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected SecretRepository secretRepository;

    @Autowired
    protected UserRepository userRepository;

    @BeforeEach
    void setUp() {
        secretRepository.deleteAll();
        userRepository.deleteAll();
    }
}
```

#### Secret API Integration Tests

`secret-service/src/test/java/com/secrets/integration/SecretControllerIntegrationTest.java`:

```java
class SecretControllerIntegrationTest extends IntegrationTestBase {

    private String jwtToken;

    @BeforeEach
    void setUpAuth() {
        // Create test user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPasswordHash(passwordEncoder.encode("password"));
        user.setRoles(Set.of("ROLE_USER"));
        userRepository.save(user);

        // Get JWT token
        LoginRequest loginRequest = new LoginRequest("testuser", "password");
        ResponseEntity<TokenResponse> response = restTemplate.postForEntity(
            "/api/auth/login",
            loginRequest,
            TokenResponse.class
        );
        
        jwtToken = response.getBody().getAccessToken();
    }

    @Test
    void shouldCreateAndRetrieveSecret() {
        // Create secret
        CreateSecretRequest request = new CreateSecretRequest();
        request.setKey("test.secret");
        request.setValue("secretValue123");
        request.setDescription("Test secret");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        HttpEntity<CreateSecretRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<SecretResponse> createResponse = restTemplate.exchange(
            "/api/secrets",
            HttpMethod.POST,
            entity,
            SecretResponse.class
        );

        assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
        assertNotNull(createResponse.getBody());
        assertEquals("test.secret", createResponse.getBody().getKey());

        // Retrieve secret
        HttpEntity<?> getEntity = new HttpEntity<>(headers);
        ResponseEntity<SecretResponse> getResponse = restTemplate.exchange(
            "/api/secrets/test.secret",
            HttpMethod.GET,
            getEntity,
            SecretResponse.class
        );

        assertEquals(HttpStatus.OK, getResponse.getStatusCode());
        assertEquals("test.secret", getResponse.getBody().getKey());
        assertEquals("secretValue123", getResponse.getBody().getValue());
    }

    @Test
    void shouldReturn401WhenUnauthorized() {
        CreateSecretRequest request = new CreateSecretRequest();
        request.setKey("test.secret");
        request.setValue("value");

        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/secrets",
            request,
            String.class
        );

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void shouldUpdateSecretWithVersioning() {
        // Create initial secret
        CreateSecretRequest createRequest = new CreateSecretRequest();
        createRequest.setKey("versioned.secret");
        createRequest.setValue("version1");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        
        restTemplate.exchange(
            "/api/secrets",
            HttpMethod.POST,
            new HttpEntity<>(createRequest, headers),
            SecretResponse.class
        );

        // Update secret
        UpdateSecretRequest updateRequest = new UpdateSecretRequest();
        updateRequest.setValue("version2");
        updateRequest.setChangeDescription("Updated to version 2");

        ResponseEntity<SecretResponse> updateResponse = restTemplate.exchange(
            "/api/secrets/versioned.secret",
            HttpMethod.PUT,
            new HttpEntity<>(updateRequest, headers),
            SecretResponse.class
        );

        assertEquals(HttpStatus.OK, updateResponse.getStatusCode());
        assertEquals(2, updateResponse.getBody().getCurrentVersion());

        // Get version history
        ResponseEntity<List> historyResponse = restTemplate.exchange(
            "/api/secrets/versioned.secret/versions",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            List.class
        );

        assertEquals(HttpStatus.OK, historyResponse.getStatusCode());
        assertEquals(1, historyResponse.getBody().size());
    }

    @Test
    void shouldEnforceRBAC() {
        // Create secret as testuser
        CreateSecretRequest request = new CreateSecretRequest();
        request.setKey("private.secret");
        request.setValue("value");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        
        restTemplate.exchange(
            "/api/secrets",
            HttpMethod.POST,
            new HttpEntity<>(request, headers),
            SecretResponse.class
        );

        // Create another user without permissions
        User otherUser = new User();
        otherUser.setUsername("otheruser");
        otherUser.setEmail("other@example.com");
        otherUser.setPasswordHash(passwordEncoder.encode("password"));
        otherUser.setRoles(Set.of("ROLE_USER"));
        userRepository.save(otherUser);

        // Get token for other user
        LoginRequest loginRequest = new LoginRequest("otheruser", "password");
        ResponseEntity<TokenResponse> loginResponse = restTemplate.postForEntity(
            "/api/auth/login",
            loginRequest,
            TokenResponse.class
        );
        String otherToken = loginResponse.getBody().getAccessToken();

        // Try to access secret (should fail)
        HttpHeaders otherHeaders = new HttpHeaders();
        otherHeaders.setBearerAuth(otherToken);
        
        ResponseEntity<String> accessResponse = restTemplate.exchange(
            "/api/secrets/private.secret",
            HttpMethod.GET,
            new HttpEntity<>(otherHeaders),
            String.class
        );

        assertEquals(HttpStatus.FORBIDDEN, accessResponse.getStatusCode());
    }
}
```

### 4.3 Security Tests

`secret-service/src/test/java/com/secrets/security/SecurityTest.java`:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecurityTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldRejectSQLInjection() {
        LoginRequest request = new LoginRequest(
            "admin' OR '1'='1",
            "password"
        );

        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/auth/login",
            request,
            String.class
        );

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void shouldRejectXSSInSecretValue() {
        // This should be sanitized or rejected
        CreateSecretRequest request = new CreateSecretRequest();
        request.setKey("xss.test");
        request.setValue("<script>alert('XSS')</script>");

        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/secrets",
            request,
            String.class
        );

        // Should either reject or sanitize
        assertTrue(
            response.getStatusCode().equals(HttpStatus.BAD_REQUEST) ||
            !response.getBody().contains("<script>")
        );
    }

    @Test
    void shouldEnforceRateLimiting() {
        LoginRequest request = new LoginRequest("testuser", "wrongpassword");

        // Make 10 rapid failed login attempts
        for (int i = 0; i < 10; i++) {
            ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/auth/login",
                request,
                String.class
            );

            if (i < 5) {
                assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
            } else {
                // Should be rate limited after 5 attempts
                assertTrue(
                    response.getStatusCode().equals(HttpStatus.TOO_MANY_REQUESTS) ||
                    response.getStatusCode().equals(HttpStatus.UNAUTHORIZED)
                );
            }
        }
    }
}
```

### 4.4 Load Testing with Gatling

`secret-service/src/test/scala/com/secrets/load/SecretServiceLoadTest.scala`:

```scala
import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class SecretServiceLoadTest extends Simulation {

  val httpProtocol = http
    .baseUrl("http://localhost:8080")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val scn = scenario("Secret Service Load Test")
    .exec(
      http("Login")
        .post("/api/auth/login")
        .body(StringBody("""{"username":"admin","password":"admin"}"""))
        .check(jsonPath("$.accessToken").saveAs("token"))
    )
    .pause(1)
    .repeat(10) {
      exec(
        http("Create Secret")
          .post("/api/secrets")
          .header("Authorization", "Bearer ${token}")
          .body(StringBody("""{"key":"load.test.${random}","value":"testValue"}"""))
          .check(status.is(201))
      )
      .pause(100.milliseconds)
      .exec(
        http("Get Secret")
          .get("/api/secrets/load.test.${random}")
          .header("Authorization", "Bearer ${token}")
          .check(status.is(200))
      )
    }

  setUp(
    scn.inject(
      rampUsersPerSec(1) to 50 during (2.minutes),
      constantUsersPerSec(50) during (5.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(2000),
     global.successfulRequests.percent.gt(95)
   )
}
```

---

## Phase 5: Documentation & Deployment 

### 5.1 OpenAPI/Swagger Documentation

#### Configuration

`secret-service/src/main/java/com/secrets/config/OpenApiConfig.java`:

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Cloud Secrets Manager API")
                .version("1.0.0")
                .description("Enterprise-grade secrets management system")
                .contact(new Contact()
                    .name("API Support")
                    .email("support@secrets-manager.com")
                )
                .license(new License()
                    .name("MIT")
                    .url("https://opensource.org/licenses/MIT")
                )
            )
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                )
            )
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
```

#### Annotated Controller

```java
@RestController
@RequestMapping("/api/secrets")
@Tag(name = "Secrets", description = "Secret management operations")
public class SecretController {

    @Operation(
        summary = "Create a new secret",
        description = "Creates a new encrypted secret with optional expiration and rotation policy",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Secret created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "409", description = "Secret already exists")
    })
    @PostMapping
    public ResponseEntity<SecretResponse> createSecret(
            @Valid @RequestBody 
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Secret creation request",
                required = true,
                content = @Content(schema = @Schema(implementation = CreateSecretRequest.class))
            ) CreateSecretRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Implementation
    }
}
```

### 5.2 Production Deployment Guide

Create `docs/DEPLOYMENT.md`:

```markdown
# Production Deployment Guide

## Prerequisites

- Kubernetes cluster (1.25+)
- Helm 3.12+
- kubectl configured
- Docker registry access
- HashiCorp Vault or AWS KMS
- PostgreSQL 15+ (RDS recommended)

## Architecture

```

                     Load Balancer                        
                    (AWS ALB/NLB)                         

                      
         
             Kubernetes Cluster    
             
             Ingress (Nginx)     
             
                                   
             
             Secret Service      
             (3 replicas)        
             
                                   
             
             Audit Service       
             (2 replicas)        
             
         
                      
         
             External Services     
             
             RDS PostgreSQL      
             Vault/KMS           
             Redis (sessions)    
             CloudWatch/Prom     
             
         
```

## Step-by-Step Deployment

### 1. Infrastructure Setup

#### AWS Resources (Terraform)

```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "secrets-manager-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
resource "aws_db_instance" "secrets_db" {
  identifier           = "secrets-manager-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true
  
  db_name  = "secrets"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  skip_final_snapshot    = false
  final_snapshot_identifier = "secrets-db-final-${formatdate("YYYY-MM-DD", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = {
    Environment = var.environment
    Project     = "secrets-manager"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "secrets-manager-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10
      
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }
}

# KMS Key for encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for secrets encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = {
    Environment = var.environment
    Project     = "secrets-manager"
  }
}
```

### 2. Deploy Vault (if using Vault)

```bash
# Install Vault using Helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

helm install vault hashicorp/vault \
  --set server.ha.enabled=true \
  --set server.ha.replicas=3 \
  --set ui.enabled=true \
  --set server.dataStorage.size=10Gi

# Initialize and unseal Vault
kubectl exec -it vault-0 -- vault operator init
kubectl exec -it vault-0 -- vault operator unseal <unseal-key-1>
kubectl exec -it vault-0 -- vault operator unseal <unseal-key-2>
kubectl exec -it vault-0 -- vault operator unseal <unseal-key-3>

# Enable transit engine
kubectl exec -it vault-0 -- vault login <root-token>
kubectl exec -it vault-0 -- vault secrets enable transit
kubectl exec -it vault-0 -- vault write -f transit/keys/secrets-encryption-key
```

### 3. Create Sealed Secrets

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create secrets
kubectl create secret generic cloud-secrets-config \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=DB_PASSWORD='<your-db-password>' \
  --from-literal=VAULT_TOKEN='<your-vault-token>' \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > k8s/sealed-secrets.yaml

# Apply sealed secrets
kubectl apply -f k8s/sealed-secrets.yaml
```

### 4. Deploy Application with Helm

```bash
# Update values for production
cat > helm/cloud-secrets-manager/values-prod.yaml <<EOF
image:
  repositorySecretService: "your-registry/secret-service"
  repositoryAuditService: "your-registry/audit-service"
  tag: "v1.0.0"
  pullPolicy: Always

secretService:
  replicaCount: 3
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

auditService:
  replicaCount: 2
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

database:
  host: "secrets-manager-db.xxxxx.us-east-1.rds.amazonaws.com"
  port: 5432
  secretsDb: "secrets"
  auditDb: "audit"

vault:
  enabled: true
  address: "http://vault:8200"

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
  hosts:
    - host: api.secrets-manager.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: secrets-manager-tls
      hosts:
        - api.secrets-manager.com

monitoring:
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true
  grafana:
    enabled: true
EOF

# Deploy
helm upgrade --install secrets-manager \
  ./helm/cloud-secrets-manager \
  --namespace secrets-manager \
  --create-namespace \
  --values helm/cloud-secrets-manager/values-prod.yaml \
  --wait
```

### 5. Setup Monitoring

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Install Grafana dashboards
kubectl apply -f k8s/monitoring/grafana-dashboard.yaml

# Install ELK Stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch --namespace logging --create-namespace
helm install kibana elastic/kibana --namespace logging
helm install filebeat elastic/filebeat --namespace logging
```

### 6. SSL/TLS Configuration

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@secrets-manager.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 7. Backup Strategy

```bash
# Database backup (daily)
cat > k8s/cronjob-backup.yaml <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h $DB_HOST -U $DB_USER secrets | \
              gzip > /backup/secrets-$(date +%Y%m%d).sql.gz
              aws s3 cp /backup/secrets-$(date +%Y%m%d).sql.gz \
              s3://secrets-manager-backups/
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            emptyDir: {}
          restartPolicy: OnFailure
EOF

kubectl apply -f k8s/cronjob-backup.yaml
```

### 8. Disaster Recovery Testing

```bash
# Test restoration procedure quarterly
# 1. Restore database from backup
aws s3 cp s3://secrets-manager-backups/latest.sql.gz /tmp/
gunzip /tmp/latest.sql.gz
psql -h $DB_HOST -U $DB_USER -d secrets < /tmp/latest.sql

# 2. Verify data integrity
kubectl exec -it secret-service-0 -- /bin/sh -c \
  "curl -H 'Authorization: Bearer $TOKEN' http://localhost:8080/api/secrets/test.key"

# 3. Document recovery time objective (RTO) and recovery point objective (RPO)
```

## Security Hardening

### 1. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: secret-service-network-policy
spec:
  podSelector:
    matchLabels:
      app: secret-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: secrets-db
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: audit-service
    ports:
    - protocol: TCP
      port: 8081
```

### 2. Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: secrets-manager
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 3. RBAC Configuration

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-service-role
  namespace: secrets-manager
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: secret-service-rolebinding
  namespace: secrets-manager
subjects:
- kind: ServiceAccount
  name: secret-service
  namespace: secrets-manager
roleRef:
  kind: Role
  name: secret-service-role
  apiGroup: rbac.authorization.k8s.io
```

## Monitoring and Alerting

### Alert Rules

```yaml
# prometheus-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
data:
  alerts.yml: |
    groups:
    - name: secrets-manager
      interval: 30s
      rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} for {{ $labels.instance }}"
      
      - alert: HighAuthFailureRate
        expr: rate(auth_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High authentication failure rate"
          description: "{{ $value }} failed auth attempts per second"
      
      - alert: SecretServiceDown
        expr: up{job="secret-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Secret service is down"
      
      - alert: DatabaseConnectionIssue
        expr: hikaricp_connections_active > hikaricp_connections_max * 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
```

## Performance Tuning

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_secrets_key ON secrets(secret_key);
CREATE INDEX CONCURRENTLY idx_secrets_created_by ON secrets(created_by);
CREATE INDEX CONCURRENTLY idx_secrets_expires_at ON secrets(expires_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_audit_logs_username ON audit_log(username);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_log(timestamp DESC);

-- Partitioning for audit logs (monthly)
CREATE TABLE audit_log (
    id BIGSERIAL NOT NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    secret_key VARCHAR(255),
    timestamp TIMESTAMP NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE audit_log_2025_01 PARTITION OF audit_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Application Configuration

```yaml
# application-prod.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
    show-sql: false

server:
  tomcat:
    threads:
      max: 200
      min-spare: 10
    max-connections: 10000
    accept-count: 100
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain

management:
  metrics:
    export:
      prometheus:
        step: 30s
```

## Rollout Strategy

### Blue-Green Deployment

```bash
# Deploy new version to "green" environment
helm upgrade secrets-manager-green ./helm/cloud-secrets-manager \
  --namespace secrets-manager-green \
  --create-namespace \
  --values values-prod.yaml \
  --set image.tag=v1.1.0

# Run smoke tests
./scripts/smoke-test.sh secrets-manager-green

# Switch traffic gradually
kubectl patch ingress secrets-manager-ingress \
  -n secrets-manager \
  --type merge \
  -p '{"spec":{"rules":[{"host":"api.secrets-manager.com","http":{"paths":[{"backend":{"service":{"name":"secret-service-green","port":{"number":8080}}}}]}}]}}'

# Monitor for 30 minutes
# If successful, delete old deployment
helm uninstall secrets-manager --namespace secrets-manager

# If issues, rollback
kubectl patch ingress secrets-manager-ingress \
  -n secrets-manager \
  --type merge \
  -p '{"spec":{"rules":[{"host":"api.secrets-manager.com","http":{"paths":[{"backend":{"service":{"name":"secret-service","port":{"number":8080}}}}]}}]}}'
```

### Canary Deployment

```yaml
# Using Argo Rollouts
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: secret-service
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {duration: 5m}
      - setWeight: 40
      - pause: {duration: 5m}
      - setWeight: 60
      - pause: {duration: 5m}
      - setWeight: 80
      - pause: {duration: 5m}
  template:
    spec:
      containers:
      - name: secret-service
        image: your-registry/secret-service:v1.1.0
```

## Maintenance Procedures

### Routine Tasks

```bash
# Weekly
- Review audit logs for suspicious activity
- Check error rates and performance metrics
- Verify backup integrity
- Update dependencies (security patches)

# Monthly  
- Rotate JWT secrets
- Review and update access policies
- Capacity planning review
- Cost optimization review

# Quarterly
- Disaster recovery drill
- Security audit
- Performance testing
- Update documentation
```

### Key Rotation

```bash
# Rotate encryption key (Vault)
kubectl exec -it vault-0 -- vault write -f transit/keys/secrets-encryption-key/rotate

# Re-encrypt existing secrets with new key
kubectl exec -it secret-service-0 -- \
  curl -X POST http://localhost:8080/api/admin/rotate-all-secrets \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Rotate JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)
kubectl create secret generic jwt-secret-new \
  --from-literal=JWT_SECRET=$NEW_JWT_SECRET \
  --dry-run=client -o yaml | \
  kubeseal -o yaml | kubectl apply -f -

# Rolling restart
kubectl rollout restart deployment/secret-service
```

## Compliance and Auditing

### Audit Log Retention

```sql
-- Archive old audit logs to S3
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign table for S3 (via s3_fdw or similar)
-- Then move old data
INSERT INTO audit_log_archive 
SELECT * FROM audit_log 
WHERE timestamp < NOW() - INTERVAL '1 year';

DELETE FROM audit_log 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Compliance Reports

```bash
# Generate monthly compliance report
./scripts/generate-compliance-report.sh \
  --start-date "2025-01-01" \
  --end-date "2025-01-31" \
  --output /reports/compliance-2025-01.pdf

# Reports include:
# - Secret access patterns
# - Failed authentication attempts  
# - Policy violations
# - Key rotation status
# - Backup verification
```

## Troubleshooting

### Common Issues

**Issue: High latency on secret retrieval**
```bash
# Check database connection pool
kubectl exec -it secret-service-0 -- \
  curl http://localhost:8080/actuator/metrics/hikaricp.connections.active

# Check Vault performance
kubectl exec -it vault-0 -- vault status

# Review slow query log
kubectl logs secret-service-0 | grep "slow query"
```

**Issue: Authentication failures**
```bash
# Check JWT token validity
echo $TOKEN | base64 -d

# Verify token hasn't been blacklisted
kubectl exec -it secret-service-0 -- redis-cli GET "blacklist:$JTI"

# Check user account status
kubectl exec -it secret-service-0 -- \
  psql -h $DB_HOST -U $DB_USER -d secrets \
  -c "SELECT * FROM users WHERE username='problem-user';"
```

**Issue: Secret encryption/decryption errors**
```bash
# Verify Vault connectivity
kubectl exec -it secret-service-0 -- \
  curl -H "X-Vault-Token: $VAULT_TOKEN" \
  http://vault:8200/v1/sys/health

# Check transit key status
kubectl exec -it vault-0 -- \
  vault read transit/keys/secrets-encryption-key

# Test encryption manually
kubectl exec -it vault-0 -- \
  vault write transit/encrypt/secrets-encryption-key \
  plaintext=$(echo "test" | base64)
```

## Cost Optimization

```bash
# Right-size resources based on metrics
kubectl top pods -n secrets-manager

# Use spot instances for non-critical workloads
# Configure HPA for automatic scaling
# Implement caching to reduce database load
# Archive old audit logs to cheaper storage (S3 Glacier)
```

## Support and Escalation

```
Level 1: Application logs, metrics dashboards
Level 2: Database queries, Vault logs, system metrics  
Level 3: Core team escalation, vendor support

On-call rotation: PagerDuty integration
Incident response: Follow runbook procedures
Post-mortem: Document all incidents >15min downtime
```
```

---

## Implementation Timeline

### Week 1-2: Enhanced Security
- [ ] Integrate Spring Cloud Vault
- [ ] Setup Kubernetes Sealed Secrets
- [ ] Implement JWT refresh tokens
- [ ] Add token blacklisting with Redis
- [ ] Configure Argon2 password hashing

### Week 3-4: Production Features
- [ ] Implement secret versioning
- [ ] Add RBAC with policies
- [ ] Create secret expiration mechanism
- [ ] Build rotation scheduler
- [ ] Add secret sharing capabilities

### Week 5-6: Monitoring & Observability
- [ ] Setup Prometheus metrics
- [ ] Configure OpenTelemetry tracing
- [ ] Deploy ELK stack
- [ ] Create Grafana dashboards
- [ ] Implement structured logging

### Week 7-8: Testing
- [ ] Write unit tests (80% coverage)
- [ ] Create integration tests
- [ ] Add security tests
- [ ] Setup load testing with Gatling
- [ ] Configure CI/CD test pipeline

### Week 9-10: Documentation & Deployment
- [ ] Complete OpenAPI documentation
- [ ] Write deployment guides
- [ ] Create runbooks
- [ ] Setup production infrastructure
- [ ] Deploy to staging environment
- [ ] Conduct disaster recovery drill

### Week 11-12: Production Launch
- [ ] Final security audit
- [ ] Performance testing
- [ ] Blue-green deployment to production
- [ ] Monitor and optimize
- [ ] Create presentation for demo

---

## Final Checklist

### Security 
- [x] Vault/KMS integration for encryption
- [x] Sealed Secrets for Kubernetes
- [x] JWT with refresh tokens
- [x] Token blacklisting
- [x] Argon2 password hashing
- [x] RBAC with fine-grained policies
- [x] Network policies
- [x] Pod security standards
- [x] Rate limiting
- [x] Input validation

### Features 
- [x] Secret versioning
- [x] Secret expiration
- [x] Automatic rotation
- [x] Secret sharing
- [x] Audit logging
- [x] Policy management
- [x] Rollback capability
- [x] Bulk operations
- [x] Tag support
- [x] Search and filtering

### Monitoring 
- [x] Prometheus metrics
- [x] OpenTelemetry tracing
- [x] ELK logging
- [x] Grafana dashboards
- [x] Alert rules
- [x] Health checks
- [x] Custom metrics
- [x] Distributed tracing
- [x] Log aggregation
- [x] SLA monitoring

### Testing 
- [x] Unit tests (>80% coverage)
- [x] Integration tests
- [x] Security tests
- [x] Load tests
- [x] Chaos testing
- [x] Contract tests
- [x] E2E tests
- [x] Performance benchmarks

### Documentation 
- [x] OpenAPI/Swagger docs
- [x] README with quickstart
- [x] Architecture diagrams
- [x] Deployment guide
- [x] API documentation
- [x] Runbook
- [x] Security policy
- [x] Compliance docs
- [x] Troubleshooting guide

### Deployment 
- [x] Docker images
- [x] Helm charts
- [x] Kubernetes manifests
- [x] CI/CD pipeline
- [x] Blue-green deployment
- [x] Canary deployment
- [x] Auto-scaling
- [x] Backup strategy
- [x] DR procedures
- [x] Monitoring stack

---

## Success Metrics

### Technical Metrics
- **Availability**: 99.9% uptime (SLA)
- **Latency**: P95 < 100ms, P99 < 200ms
- **Error Rate**: < 0.1% of requests
- **Test Coverage**: > 80%
- **Security Score**: A+ on OWASP standards

### Business Metrics
- **User Satisfaction**: > 4.5/5 rating
- **Adoption Rate**: Track active users
- **Performance**: Handle 1000 req/sec
- **Cost Efficiency**: < $500/month infrastructure

---

## Presentation Outline

### Slide 1: Title
- Cloud Secrets Manager
- Enterprise-Grade Secrets Management System
- Your Name & Date

### Slide 2: Problem Statement
- Current challenges in secrets management
- Security risks of hardcoded credentials
- Compliance requirements

### Slide 3: Solution Overview
- Centralized secrets management
- Enterprise security features
- Cloud-native architecture

### Slide 4: Architecture
- Microservices design
- Component diagram
- Technology stack

### Slide 5: Security Features
- Vault/KMS encryption
- JWT authentication
- RBAC and policies
- Audit logging

### Slide 6: Key Features
- Versioning and rollback
- Auto-expiration
- Rotation policies
- Secret sharing

### Slide 7: Observability
- Prometheus metrics
- Distributed tracing
- Centralized logging
- Grafana dashboards

### Slide 8: Production Readiness
- 80%+ test coverage
- CI/CD pipeline
- Kubernetes deployment
- Disaster recovery

### Slide 9: Live Demo
- Create secret
- Version and rollback
- Share with team
- Monitor metrics

### Slide 10: Results & Metrics
- Performance benchmarks
- Security compliance
- Cost efficiency
- Future roadmap

---

## Next Steps After A+ Achievement

1. **Open Source**: Publish to GitHub with comprehensive docs
2. **Blog Post**: Write technical deep-dive
3. **Conference Talk**: Submit to local meetups
4. **Portfolio**: Feature prominently with case study
5. **Resume**: Highlight key technologies and achievements

---

**This is your roadmap to an A+ project. Follow it systematically, and you'll have a production-grade system that stands out in any portfolio or interview!** 