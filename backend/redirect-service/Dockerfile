FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY . .
RUN if [ ! -f redirect-service/target/*.jar ]; then \
      chmod +x mvnw && ./mvnw package -pl redirect-service -am -Dmaven.test.skip=true; \
    fi

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/redirect-service/target/redirect-service-2.0.0.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
