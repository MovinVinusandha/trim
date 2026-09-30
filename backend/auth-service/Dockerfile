FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY . .
RUN if [ ! -f auth-service/target/*.jar ]; then \
      chmod +x mvnw && ./mvnw package -pl auth-service -am -Dmaven.test.skip=true; \
    fi

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/auth-service/target/auth-service-2.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
