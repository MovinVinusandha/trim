FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY . .
RUN if [ ! -f core-service/target/*.jar ]; then \
      chmod +x mvnw && ./mvnw package -pl core-service -am -Dmaven.test.skip=true; \
    fi

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/core-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
