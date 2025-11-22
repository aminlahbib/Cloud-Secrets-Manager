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

# Verify source code was copied
RUN echo "=== Verifying source code ===" && \
    ls -la /app/src/ && \
    echo "" && \
    echo "Checking for main class source:" && \
    find /app/src -name "SecretServiceApplication.java" || echo "Main class source not found!" && \
    echo "" && \
    echo "Source directory structure:" && \
    find /app/src -type f -name "*.java" | head -20

# Build the application
RUN echo "=== Starting Maven build ===" && \
    ./mvnw clean package -DskipTests -B 2>&1 | tee /tmp/maven-build.log || (echo "❌ Maven build failed!" && echo "=== Last 100 lines of build log ===" && tail -100 /tmp/maven-build.log && exit 1)

# Check Maven build log for errors
RUN echo "=== Checking Maven build log for errors ===" && \
    if grep -i "error\|failed\|exception" /tmp/maven-build.log | tail -20; then \
        echo "⚠️ Warnings/errors found in build log (shown above)"; \
    else \
        echo "✅ No obvious errors in build log"; \
    fi && \
    echo "" && \
    echo "=== Build summary ===" && \
    tail -30 /tmp/maven-build.log

# Verify compilation succeeded
RUN echo "=== Verifying compilation ===" && \
    echo "Checking target directory structure:" && \
    ls -la /app/target/ 2>/dev/null || (echo "❌ target directory doesn't exist!" && exit 1) && \
    echo "" && \
    echo "Checking for classes directory:" && \
    if [ -d /app/target/classes ]; then \
        echo "✅ Classes directory exists" && \
        echo "Checking for main class:" && \
        if [ -f /app/target/classes/com/secrets/SecretServiceApplication.class ]; then \
            echo "✅ Main class compiled successfully" && \
            ls -lh /app/target/classes/com/secrets/SecretServiceApplication.class; \
        else \
            echo "❌ Main class NOT found in classes directory!" && \
            echo "Files in com/secrets:" && \
            find /app/target/classes/com/secrets -type f 2>/dev/null | head -20 || echo "com/secrets directory doesn't exist" && \
            exit 1; \
        fi; \
    else \
        echo "❌ Classes directory not found!" && \
        echo "Target directory contents:" && \
        find /app/target -type f | head -20 && \
        exit 1; \
    fi

# Verify JAR was created and list all JARs for debugging
RUN echo "=== Checking target directory ===" && \
    ls -lah /app/target/ && \
    echo "=== Looking for JAR files ===" && \
    find /app/target -name "*.jar" -type f

# Copy the Spring Boot executable JAR
# Spring Boot Maven plugin repackages the JAR in place
# The executable JAR is: secret-service-1.0.0.jar (the .original is the non-executable one)
RUN if [ -f /app/target/secret-service-1.0.0.jar ]; then \
        echo "Found executable JAR: secret-service-1.0.0.jar" && \
        cp /app/target/secret-service-1.0.0.jar /app/target/app.jar && \
        ls -lh /app/target/app.jar && \
        echo "=== JAR Contents (first 50 entries) ===" && \
        jar tf /app/target/app.jar | head -50 && \
        echo "" && \
        echo "=== Searching for main class in JAR ===" && \
        echo "Searching in BOOT-INF/classes/com/secrets/:" && \
        jar tf /app/target/app.jar | grep -i "BOOT-INF/classes/com/secrets/SecretServiceApplication" || echo "Not found in BOOT-INF" && \
        echo "" && \
        echo "Searching in com/secrets/:" && \
        jar tf /app/target/app.jar | grep -i "com/secrets/SecretServiceApplication" || echo "Not found in com/secrets" && \
        echo "" && \
        echo "Searching anywhere for SecretServiceApplication:" && \
        jar tf /app/target/app.jar | grep -i "SecretServiceApplication" || echo "Not found anywhere" && \
        echo "" && \
        echo "=== Checking JAR structure ===" && \
        echo "Top-level directories:" && \
        jar tf /app/target/app.jar | grep -E "^[^/]+/$" | head -20 && \
        echo "" && \
        echo "Checking if this is a Spring Boot JAR (looking for BOOT-INF):" && \
        jar tf /app/target/app.jar | grep -E "^BOOT-INF" | head -10 || echo "No BOOT-INF found - this might not be a Spring Boot executable JAR!" && \
        echo "" && \
        echo "=== Verifying main class exists ===" && \
        if jar tf /app/target/app.jar | grep -qE "(BOOT-INF/classes/)?com/secrets/SecretServiceApplication.class"; then \
            echo "✅ Main class found in JAR"; \
        else \
            echo "❌ ERROR: Main class NOT found in JAR!" && \
            echo "Showing all entries in JAR (may be truncated):" && \
            jar tf /app/target/app.jar | head -200 && \
            echo "" && \
            echo "Total entries in JAR:" && \
            jar tf /app/target/app.jar | wc -l && \
            exit 1; \
        fi; \
    else \
        echo "ERROR: secret-service-1.0.0.jar not found!" && \
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
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
