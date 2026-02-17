# ===== 빌드 단계 =====
# Node.js 이미지를 사용해서 React 애플리케이션을 빌드합니다
FROM node:18-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json을 먼저 복사
# 이렇게 하면 의존성이 변경되지 않으면 캐시를 사용할 수 있어 빌드가 빨라집니다
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 나머지 소스 코드 복사
COPY . .

# React 애플리케이션 빌드 (dist 폴더에 정적 파일 생성)
RUN npm run build

# ===== 실행 단계 =====
# Nginx를 사용해서 빌드된 정적 파일을 서빙합니다
FROM nginx:alpine

# 빌드된 파일을 Nginx의 기본 서빙 경로로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx 설정 파일 복사 (나중에 만들 예정)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80 포트 노출
EXPOSE 80

# Nginx 실행 (기본 명령어이므로 생략 가능하지만 명시적으로 작성)
CMD ["nginx", "-g", "daemon off;"]
