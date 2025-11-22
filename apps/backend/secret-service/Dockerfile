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
    ./mvnw clean package -DskipTests -B 2>&1 | tee /tmp/maven-build.log || (echo "❌ Maven build failed!" && cat /tmp/maven-build.log | tail -50 && exit 1)

# Verify compilation succeeded (non-fatal, just for diagnostics)
RUN echo "=== Verifying compilation ===" && \
    echo "Checking target directory structure:" && \
    (ls -la /app/target/ 2>/dev/null || echo "target directory doesn't exist") && \
    echo "" && \
    echo "Checking for classes directory:" && \
    (find /app/target -type d -name "classes" 2>/dev/null || echo "No classes directory found") && \
    echo "" && \
    if [ -d /app/target/classes/com/secrets ]; then \
        echo "✅ Classes directory exists at expected location" && \
        ls -la /app/target/classes/com/secrets/ | head -10; \
    else \
        echo "⚠️ Classes directory not at expected location, searching..." && \
        (find /app/target -name "SecretServiceApplication.class" 2>/dev/null || echo "Main class not found anywhere") && \
        echo "" && \
        echo "Full target directory tree:" && \
        (find /app/target -type f -name "*.class" | head -20 || echo "No .class files found") && \
        echo "" && \
        echo "Checking if JAR was created anyway:" && \
        (find /app/target -name "*.jar" -type f || echo "No JAR files found"); \
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
        echo "Verifying JAR contents..." && \
        jar tf /app/target/app.jar | head -30 && \
        echo "=== Verifying main class exists ===" && \
        if jar tf /app/target/app.jar | grep -q "BOOT-INF/classes/com/secrets/SecretServiceApplication.class"; then \
            echo "✅ Main class found in JAR"; \
        else \
            echo "❌ ERROR: Main class NOT found in JAR!" && \
            echo "Searching for any SecretServiceApplication files:" && \
            jar tf /app/target/app.jar | grep -i secret || echo "No matches found" && \
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
