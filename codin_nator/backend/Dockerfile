# 1) build stage: jar 생성
FROM gradle:8.7-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle clean bootJar -x test

# 2) run stage: jar 실행
FROM amazoncorretto:17
WORKDIR /
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
