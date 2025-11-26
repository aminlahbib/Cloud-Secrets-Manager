# =============================================================================
# Audit Service - Multi-stage Dockerfile
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Install Maven
RUN apk add --no-cache maven

# Copy parent POM
COPY pom.xml ./

# Copy ALL module POMs (required for multi-module project resolution)
COPY apps/backend/secret-service/pom.xml apps/backend/secret-service/
COPY apps/backend/audit-service/pom.xml apps/backend/audit-service/

# Download dependencies for audit-service only
RUN mvn dependency:go-offline -pl apps/backend/audit-service -am -B -q || true

# Copy source code for audit-service
COPY apps/backend/audit-service/src apps/backend/audit-service/src

# Build only audit-service (skip tests)
RUN mvn package -pl apps/backend/audit-service -DskipTests -B \
    && cp apps/backend/audit-service/target/audit-service-*.jar app.jar

# ---------------------------------------------------------------------------
# Stage 2: Runtime
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app
USER app

# Copy JAR from builder
COPY --from=builder /build/app.jar app.jar

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
