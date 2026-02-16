/**
 * Axios 요청 인터셉터 설정
 *
 * [인터셉터란?]
 * - 모든 HTTP 요청이 서버로 전송되기 전에 가로채서 수정하는 미들웨어
 * - 여기서는 모든 요청에 JWT 토큰을 자동으로 추가
 *
 * [인증 흐름 - 프론트엔드 ↔ 백엔드]
 * 1. 사용자가 GitHub OAuth로 로그인
 * 2. 백엔드가 JWT 토큰을 발급하여 프론트엔드에 전달
 * 3. 프론트엔드가 토큰을 localStorage에 저장
 * 4. 이후 모든 API 요청 시 인터셉터가 Authorization 헤더에 토큰을 추가
 * 5. 백엔드가 토큰을 검증하여 사용자 인증
 *
 * [Bearer 토큰]
 * - HTTP Authorization 헤더의 표준 형식: "Bearer <토큰값>"
 * - 백엔드의 Spring Security가 이 헤더를 읽어 JWT를 검증
 *
 * [Promise.reject]
 * - 에러 발생 시 Promise를 거부 상태로 반환
 * - 호출한 쪽의 catch 블록에서 에러를 처리할 수 있음
 */

import type { AxiosInstance } from "axios";

export const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );
};
