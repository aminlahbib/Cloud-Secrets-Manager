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

# Prepare the executable JAR for copying (exclude .original JAR)
# Spring Boot Maven plugin creates the executable JAR with the same name as the artifact
RUN JAR_FILE=$(find /app/target -name "secret-service-*.jar" ! -name "*.original" | head -1) && \
    if [ -z "$JAR_FILE" ]; then \
        echo "Error: JAR file not found!" && \
        ls -la /app/target/ && \
        exit 1; \
    fi && \
    echo "Found JAR: $JAR_FILE" && \
    cp "$JAR_FILE" /app/target/app.jar && \
    ls -lh /app/target/app.jar

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

