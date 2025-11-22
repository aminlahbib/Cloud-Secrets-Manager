# Multi-stage build for optimized image size
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Ensure Maven wrapper is executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests -B || (echo "Maven build failed!" && exit 1)

# Verify compilation succeeded
RUN echo "=== Verifying compilation ===" && \
    if [ -d /app/target/classes/com/audit ]; then \
        echo "✅ Classes directory exists" && \
        ls -la /app/target/classes/com/audit/ | head -10; \
    else \
        echo "❌ ERROR: Classes directory not found!" && \
        ls -la /app/target/ || echo "target directory doesn't exist" && \
        exit 1; \
    fi

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
        echo "Verifying JAR contents..." && \
        jar tf /app/target/app.jar | head -30 && \
        echo "=== Verifying main class exists ===" && \
        if jar tf /app/target/app.jar | grep -q "BOOT-INF/classes/com/secrets/AuditServiceApplication.class"; then \
            echo "✅ Main class found in JAR"; \
        else \
            echo "❌ ERROR: Main class NOT found in JAR!" && \
            echo "Searching for any AuditServiceApplication files:" && \
            jar tf /app/target/app.jar | grep -i audit || echo "No matches found" && \
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
