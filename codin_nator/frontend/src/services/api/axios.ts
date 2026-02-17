/**
 * Axios 인스턴스 설정
 *
 * [Axios란?]
 * - HTTP 요청을 보내는 라이브러리 (fetch의 상위 호환)
 * - fetch와 비교:
 *   fetch: 브라우저 내장, JSON 변환 수동, 에러 처리 번거로움
 *   axios: 자동 JSON 변환, 인터셉터, 타임아웃 등 편의 기능 제공
 *
 * [인스턴스 생성]
 * - axios.create(): 기본 설정이 적용된 axios 인스턴스를 생성
 * - baseURL: 모든 요청 URL 앞에 자동으로 붙는 기본 경로
 *   예: axiosInstance.get("/v1/room") → GET /api/v1/room
 * - withCredentials: 쿠키를 요청에 포함 (CORS 환경에서 인증에 필요)
 *
 * [인터셉터 (Interceptor)]
 * - 모든 요청/응답을 가로채서 공통 처리를 추가
 * - 여기서는 JWT 토큰을 모든 요청 헤더에 자동 추가
 */

import axios from "axios";
import { setupInterceptors } from "./interceptors";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ""}/api`,
  withCredentials: true,
});

setupInterceptors(axiosInstance);

export default axiosInstance;
