# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml first for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build
COPY src/ src/
RUN ./mvnw package -DskipTests -B

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port (Render uses PORT env var)
EXPOSE 8080

# Run the application
# Render sets PORT env var; Spring Boot will use server.port from env
ENTRYPOINT ["java", "-jar", "app.jar"]
