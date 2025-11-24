# Multi-stage build for optimized image size
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy parent POM (needed for multi-module Maven project)
# This will be at /app/pom.xml
COPY pom.xml ./

# Copy the entire secret-service directory structure
# This maintains the relative path structure: apps/backend/secret-service/
COPY apps/backend/secret-service/.mvn/ apps/backend/secret-service/.mvn/
COPY apps/backend/secret-service/mvnw apps/backend/secret-service/pom.xml apps/backend/secret-service/

# Change to the service directory for building
WORKDIR /app/apps/backend/secret-service

# Ensure Maven wrapper is executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY apps/backend/secret-service/src ./src

# Verify source code was copied
RUN echo "=== Verifying source code ===" && \
    echo "Checking src structure:" && \
    ls -la src/ && \
    echo "" && \
    echo "Checking for Maven standard directory structure:" && \
    if [ -d src/main/java ]; then \
        echo "src/main/java exists" && \
        ls -la src/main/java/ && \
        echo "" && \
        echo "Checking for main class source:" && \
        find src/main/java -name "SecretServiceApplication.java" || (echo "ERROR: Main class source not found in src/main/java!" && exit 1) && \
        echo "" && \
        echo "Java files in src/main/java:" && \
        find src/main/java -type f -name "*.java" | head -20; \
    else \
        echo "ERROR: src/main/java directory not found!" && \
        echo "Full src directory structure:" && \
        find src -type d && \
        echo "" && \
        echo "All files in src:" && \
        find src -type f | head -30 && \
        exit 1; \
    fi

# Check what Maven sees
RUN echo "=== Checking Maven source directories ===" && \
    ./mvnw help:evaluate -Dexpression=project.build.sourceDirectory -q -DforceStdout && \
    echo "" && \
    ./mvnw help:evaluate -Dexpression=project.build.testSourceDirectory -q -DforceStdout || true

# Try compiling first to see what happens
RUN echo "=== Attempting Maven compile ===" && \
    ./mvnw clean compile -DskipTests -B 2>&1 | tee /tmp/maven-compile.log && \
    echo "" && \
    echo "=== Compile log summary ===" && \
    grep -i "compil\|source\|error\|failed" /tmp/maven-compile.log | tail -20 || echo "No compile info found"

# Build the application
RUN echo "=== Starting Maven package ===" && \
    ./mvnw package -DskipTests -B 2>&1 | tee /tmp/maven-build.log; \
    BUILD_EXIT_CODE=$?; \
    echo "" && \
    echo "=== Maven build completed with exit code: $BUILD_EXIT_CODE ===" && \
    echo "=== Checking for compile phase in build log ===" && \
    grep -i "compiler.*compile\|sources to compile" /tmp/maven-build.log | head -10 || echo "No compile phase found in log" && \
    echo "" && \
    echo "=== Last 100 lines of build log ===" && \
    tail -100 /tmp/maven-build.log && \
    if [ $BUILD_EXIT_CODE -ne 0 ]; then \
        echo "" && \
        echo "ERROR: Maven build failed! Showing errors:" && \
        grep -i "error\|failed\|exception" /tmp/maven-build.log | tail -30 || echo "No specific errors found in log"; \
        exit 1; \
    fi

# Verify compilation succeeded
RUN echo "=== Verifying compilation ===" && \
    echo "Checking if target directory exists:" && \
    if [ ! -d target ]; then \
        echo "ERROR: target directory doesn't exist!" && \
        echo "Checking if Maven build log exists:" && \
        ls -la /tmp/maven-build.log 2>/dev/null || echo "Build log not found" && \
        echo "Last 50 lines of build log:" && \
        tail -50 /tmp/maven-build.log 2>/dev/null || echo "Cannot read build log" && \
        exit 1; \
    fi && \
    echo "Target directory exists" && \
    echo "" && \
    echo "Target directory contents:" && \
    ls -la target/ && \
    echo "" && \
    echo "Checking for classes directory:" && \
    if [ ! -d target/classes ]; then \
        echo "ERROR: Classes directory not found!" && \
        echo "All files in target:" && \
        find target -type f | head -30 && \
        echo "" && \
        echo "All directories in target:" && \
        find target -type d | head -20 && \
        exit 1; \
    fi && \
    echo "Classes directory exists" && \
    echo "" && \
    echo "=== Detailed classes directory inspection ===" && \
    echo "Contents of classes directory:" && \
    ls -la target/classes/ && \
    echo "" && \
    echo "All subdirectories in classes:" && \
    find target/classes -type d && \
    echo "" && \
    echo "All files in classes (recursive):" && \
    find target/classes -type f || echo "No files found" && \
    echo "" && \
    echo "All .class files found:" && \
    find target/classes -name "*.class" || echo "No .class files found" && \
    echo "" && \
    echo "Checking for main class:" && \
    if [ ! -f target/classes/com/secrets/SecretServiceApplication.class ]; then \
        echo "ERROR: Main class NOT found in classes directory!" && \
        echo "" && \
        echo "This means compilation didn't produce any class files." && \
        echo "Checking compile log for errors:" && \
        if [ -f /tmp/maven-compile.log ]; then \
            echo "=== Compile log errors ===" && \
            grep -i "error\|failed\|exception\|no sources" /tmp/maven-compile.log | tail -20 || echo "No errors in compile log"; \
        fi && \
        echo "" && \
        echo "Checking if source files exist:" && \
        find src/main/java -name "*.java" | head -10 || echo "No Java source files found!" && \
        exit 1; \
    fi && \
    echo "Main class compiled successfully" && \
    ls -lh target/classes/com/secrets/SecretServiceApplication.class

# Verify JAR was created and list all JARs for debugging
RUN echo "=== Checking target directory ===" && \
    ls -lah target/ && \
    echo "=== Looking for JAR files ===" && \
    find target -name "*.jar" -type f

# Copy the Spring Boot executable JAR
# Spring Boot Maven plugin repackages the JAR in place
# The executable JAR is: secret-service-1.0.0.jar (the .original is the non-executable one)
RUN if [ -f target/secret-service-1.0.0.jar ]; then \
        echo "Found executable JAR: secret-service-1.0.0.jar" && \
        cp target/secret-service-1.0.0.jar target/app.jar && \
        ls -lh target/app.jar && \
        echo "=== JAR Contents (first 50 entries) ===" && \
        jar tf target/app.jar | head -50 && \
        echo "" && \
        echo "=== Searching for main class in JAR ===" && \
        echo "Searching in BOOT-INF/classes/com/secrets/:" && \
        jar tf target/app.jar | grep -i "BOOT-INF/classes/com/secrets/SecretServiceApplication" || echo "Not found in BOOT-INF" && \
        echo "" && \
        echo "Searching in com/secrets/:" && \
        jar tf target/app.jar | grep -i "com/secrets/SecretServiceApplication" || echo "Not found in com/secrets" && \
        echo "" && \
        echo "Searching anywhere for SecretServiceApplication:" && \
        jar tf target/app.jar | grep -i "SecretServiceApplication" || echo "Not found anywhere" && \
        echo "" && \
        echo "=== Checking JAR structure ===" && \
        echo "Top-level directories:" && \
        jar tf target/app.jar | grep -E "^[^/]+/$" | head -20 && \
        echo "" && \
        echo "Checking if this is a Spring Boot JAR (looking for BOOT-INF):" && \
        jar tf target/app.jar | grep -E "^BOOT-INF" | head -10 || echo "No BOOT-INF found - this might not be a Spring Boot executable JAR!" && \
        echo "" && \
        echo "=== Verifying main class exists ===" && \
        if jar tf target/app.jar | grep -qE "(BOOT-INF/classes/)?com/secrets/SecretServiceApplication.class"; then \
            echo "Main class found in JAR"; \
        else \
            echo "ERROR: Main class NOT found in JAR!" && \
            echo "Showing all entries in JAR (may be truncated):" && \
            jar tf target/app.jar | head -200 && \
            echo "" && \
            echo "Total entries in JAR:" && \
            jar tf target/app.jar | wc -l && \
            exit 1; \
        fi; \
    else \
        echo "ERROR: secret-service-1.0.0.jar not found!" && \
        echo "Available files:" && \
        ls -la target/ && \
        exit 1; \
    fi

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the Spring Boot executable jar (prepared in builder stage)
COPY --from=builder /app/apps/backend/secret-service/target/app.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
