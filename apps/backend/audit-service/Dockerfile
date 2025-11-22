# Multi-stage build for optimized image size
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests -B

# Verify JAR was created and list all JARs for debugging
RUN echo "=== Checking target directory ===" && \
    ls -lah /app/target/ && \
    echo "=== Looking for JAR files ===" && \
    find /app/target -name "*.jar" -type f

# Copy the Spring Boot executable JAR
# Spring Boot Maven plugin repackages the JAR in place
# The executable JAR is: audit-service-1.0.0.jar (the .original is the non-executable one)
RUN if [ -f /app/target/audit-service-1.0.0.jar ]; then \
        echo "Found executable JAR: audit-service-1.0.0.jar" && \
        cp /app/target/audit-service-1.0.0.jar /app/target/app.jar && \
        ls -lh /app/target/app.jar && \
        echo "=== Verifying JAR structure ===" && \
        echo "JAR manifest:" && \
        unzip -p /app/target/app.jar META-INF/MANIFEST.MF | head -10 && \
        echo "" && \
        echo "Checking for main class in JAR..." && \
        if unzip -l /app/target/app.jar | grep -q "BOOT-INF/classes/com/audit/AuditServiceApplication.class"; then \
            echo "✓ Found AuditServiceApplication.class in BOOT-INF/classes/" && \
            unzip -l /app/target/app.jar | grep "AuditServiceApplication.class"; \
        else \
            echo "✗ ERROR: AuditServiceApplication.class not found in JAR!" && \
            echo "Listing BOOT-INF/classes/com/audit/:" && \
            unzip -l /app/target/app.jar | grep "BOOT-INF/classes/com/audit/" | head -10 && \
            exit 1; \
        fi; \
    else \
        echo "ERROR: audit-service-1.0.0.jar not found!" && \
        echo "Available files:" && \
        ls -la /app/target/ && \
        exit 1; \
    fi

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the Spring Boot executable jar (prepared in builder stage)
COPY --from=builder /app/target/app.jar app.jar

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

