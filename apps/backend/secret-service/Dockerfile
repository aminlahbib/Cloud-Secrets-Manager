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
# The executable JAR is: secret-service-1.0.0.jar (the .original is the non-executable one)
RUN if [ -f /app/target/secret-service-1.0.0.jar ]; then \
        echo "Found executable JAR: secret-service-1.0.0.jar" && \
        cp /app/target/secret-service-1.0.0.jar /app/target/app.jar && \
        ls -lh /app/target/app.jar && \
        echo "Verifying JAR contents..." && \
        jar tf /app/target/app.jar | head -20; \
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

