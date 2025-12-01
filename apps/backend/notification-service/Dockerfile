# =============================================================================
# Notification Service - Multi-stage Dockerfile
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
COPY apps/backend/notification-service/pom.xml apps/backend/notification-service/

# Install parent POM first (required for child modules)
RUN mvn install -N -DskipTests -B -q

# Copy source code for secret-service (dependency of notification-service)
COPY apps/backend/secret-service/src apps/backend/secret-service/src

# Build and install secret-service first (required dependency)
RUN mvn install -pl apps/backend/secret-service -am -DskipTests -B -q

# Download dependencies for notification-service (now secret-service is available)
RUN mvn dependency:go-offline -pl apps/backend/notification-service -am -B -q || true

# Copy source code for notification-service
COPY apps/backend/notification-service/src apps/backend/notification-service/src

# Build only notification-service (skip tests)
RUN mvn package -pl apps/backend/notification-service -DskipTests -B \
    && cp apps/backend/notification-service/target/notification-service-*.jar app.jar

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

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]


