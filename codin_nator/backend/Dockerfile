FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY . .

RUN chmod +x ./gradlew && ./gradlew clean bootJar -x test

FROM amazoncorretto:17
WORKDIR /
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
