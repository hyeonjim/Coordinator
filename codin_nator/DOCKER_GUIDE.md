# Docker 사용 가이드

## 📚 Docker 개념 정리

### Docker란?
애플리케이션을 컨테이너라는 독립된 환경에 패키징하는 도구입니다.

### 핵심 개념
- **이미지(Image)**: 애플리케이션 실행에 필요한 모든 것이 담긴 템플릿
- **컨테이너(Container)**: 이미지를 실행한 실제 인스턴스
- **Dockerfile**: 이미지를 만드는 설계도
- **Docker Compose**: 여러 컨테이너를 함께 관리하는 도구

---

## 🏗️ 프로젝트 구조

```
프로젝트/
├── docker-compose.yml        # 전체 서비스 통합 관리
├── frontend/
│   ├── Dockerfile            # React 이미지 설계도
│   ├── nginx.conf            # Nginx 웹서버 설정
│   └── ... (React 소스코드)
├── backend/
│   ├── Dockerfile            # Spring Boot 이미지 설계도
│   └── ... (Spring Boot 소스코드)
└── ai-service/
    └── ... (AI 서비스 소스코드)
```

---

## 🔧 파일별 역할 설명

### 1. frontend/Dockerfile
```dockerfile
# Multi-stage build: 빌드와 실행 단계를 분리
FROM node:18-alpine AS build    # 빌드용 Node.js 이미지
WORKDIR /app
COPY package*.json ./           # 의존성 파일 먼저 복사 (캐시 활용)
RUN npm ci                      # 의존성 설치
COPY . .                        # 소스코드 복사
RUN npm run build               # React 빌드 (dist 폴더 생성)

FROM nginx:alpine               # 실행용 Nginx 이미지
COPY --from=build /app/dist /usr/share/nginx/html  # 빌드 결과만 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**왜 Multi-stage build를 사용할까?**
- 빌드 도구는 최종 실행에 필요 없음
- 최종 이미지 크기를 대폭 줄일 수 있음 (수백 MB → 수십 MB)

### 2. frontend/nginx.conf
```nginx
# React Router를 위한 설정
location / {
    try_files $uri $uri/ /index.html;  # 모든 경로를 index.html로
}

# API 요청을 백엔드로 전달
location /api {
    proxy_pass http://backend:8080;    # 'backend'는 서비스 이름
}
```

**역할**:
- React 빌드 파일(HTML, CSS, JS)을 서빙
- /api 요청을 Spring Boot로 프록시

### 3. backend/Dockerfile
```dockerfile
# 빌드 단계
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew && ./gradlew clean bootJar -x test  # JAR 생성

# 실행 단계
FROM amazoncorretto:17
COPY --from=build /app/build/libs/*.jar app.jar  # JAR만 복사
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

**역할**: Spring Boot를 JAR 파일로 빌드하고 실행

### 4. docker-compose.yml
```yaml
services:
  mysql:          # MySQL 데이터베이스
    image: mysql:8.0
    ports: ["3306:3306"]
    volumes: [mysql-data:/var/lib/mysql]  # 데이터 영속성

  backend:        # Spring Boot
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [mysql]  # MySQL 실행 후 시작

  frontend:       # React + Nginx
    build: ./frontend
    ports: ["3000:80"]   # localhost:3000으로 접근
    depends_on: [backend]
```

**역할**: 여러 컨테이너를 한 번에 실행하고 관리

---

## 🚀 Docker 시작하기

### 1단계: Docker가 실행 중인지 확인
```bash
docker --version
docker-compose --version
```

### 2단계: 전체 서비스 실행
```bash
# 프로젝트 루트 디렉토리에서
docker-compose up --build
```

**명령어 설명**:
- `docker-compose up`: docker-compose.yml에 정의된 모든 서비스 실행
- `--build`: 이미지를 새로 빌드 (코드 변경 시 필요)
- `-d`: 백그라운드 실행 (터미널이 차단되지 않음)

**실행 과정**:
1. MySQL 컨테이너 시작 → 데이터베이스 초기화
2. Backend 빌드 → Spring Boot 실행
3. Frontend 빌드 → Nginx 실행

### 3단계: 서비스 접근
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MySQL**: localhost:3306

---

## 🎯 주요 명령어

### 실행 관련
```bash
# 전체 서비스 시작 (백그라운드)
docker-compose up -d

# 전체 서비스 시작 + 빌드
docker-compose up --build

# 특정 서비스만 시작
docker-compose up frontend

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만
docker-compose logs -f backend
```

### 중지 및 정리
```bash
# 서비스 중지 (컨테이너 유지)
docker-compose stop

# 서비스 중지 + 컨테이너 삭제
docker-compose down

# 볼륨까지 모두 삭제 (데이터베이스 초기화)
docker-compose down -v

# 이미지까지 모두 삭제
docker-compose down --rmi all
```

### 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 모든 컨테이너 확인
docker ps -a

# 이미지 목록
docker images

# 볼륨 목록
docker volume ls
```

### 디버깅
```bash
# 컨테이너 내부 접속
docker-compose exec backend bash
docker-compose exec mysql bash

# 특정 명령어 실행
docker-compose exec backend ls -la
docker-compose exec mysql mysql -uroot -proot1234
```

---

## 🔄 개발 워크플로우

### 코드 수정 후
```bash
# 1. 서비스 중지
docker-compose down

# 2. 이미지 재빌드 + 실행
docker-compose up --build
```

### Frontend만 수정한 경우
```bash
docker-compose up --build frontend
```

### Backend만 수정한 경우
```bash
docker-compose up --build backend
```

---

## 🐛 문제 해결

### 포트가 이미 사용 중
```bash
# 포트 사용 프로세스 확인 (Windows)
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /PID <프로세스ID> /F
```

### 빌드 오류
```bash
# 캐시 없이 완전히 새로 빌드
docker-compose build --no-cache

# 모든 컨테이너와 이미지 삭제 후 재시작
docker-compose down --rmi all
docker-compose up --build
```

### MySQL 연결 오류
```bash
# MySQL 로그 확인
docker-compose logs mysql

# MySQL이 준비될 때까지 대기
# healthcheck가 설정되어 있어 자동으로 대기합니다
```

### 컨테이너가 계속 재시작됨
```bash
# 로그로 원인 파악
docker-compose logs -f <서비스이름>

# 일반적인 원인:
# - 환경 변수 잘못 설정
# - 포트 충돌
# - 의존성 문제
```

---

## 💡 유용한 팁

### 1. 개발 중 빠른 테스트
```bash
# 백그라운드 실행 + 로그 확인
docker-compose up -d && docker-compose logs -f
```

### 2. 데이터베이스 초기화
```bash
# 볼륨 삭제 후 재시작
docker-compose down -v
docker-compose up
```

### 3. 이미지 크기 확인
```bash
docker images | grep codin
```

### 4. 컨테이너 리소스 사용량
```bash
docker stats
```

---

## 📦 배포 준비

### Docker Hub에 이미지 업로드
```bash
# 이미지 빌드
docker build -t username/codin-frontend:latest ./frontend
docker build -t username/codin-backend:latest ./backend

# Docker Hub에 푸시
docker push username/codin-frontend:latest
docker push username/codin-backend:latest
```

### 프로덕션 환경 변수
`.env` 파일을 만들어 환경별로 관리:
```env
# .env.production
MYSQL_ROOT_PASSWORD=secure_password
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/production_db
```

```bash
# 환경 변수 파일 지정
docker-compose --env-file .env.production up
```

---
