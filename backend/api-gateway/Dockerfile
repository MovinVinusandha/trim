FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY . .
RUN if [ ! -f api-gateway/target/*.jar ]; then \
      chmod +x mvnw && ./mvnw package -pl api-gateway -am -Dmaven.test.skip=true; \
    fi

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
