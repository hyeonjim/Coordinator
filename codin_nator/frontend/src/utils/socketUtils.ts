/**
 * 현재 호스트네임을 기반으로 적절한 소켓(API) Base URL을 반환합니다.
 * - 배포 환경(ssafy.io 포함)에서는 HTTPS/WSS 프로토콜이 적용된 배포 주소
 * - 로컬 환경에서는 HTTP/WS 프로토콜이 적용된 로컬 주소
 */
export const getSocketBaseUrl = () => {
  const isProd = window.location.hostname.includes("i14e205.p.ssafy.io");

  // .env에 설정된 변수가 없을 경우를 대비해 VITE_API_BASE_URL이나 기본 로컬 주소를 사용합니다.
  if (isProd) {
    return import.meta.env.VITE_API_URL_PROD || "https://i14e205.p.ssafy.io";
  }

  return import.meta.env.VITE_API_URL_LOCAL || "http://localhost:8080";
};

/**
 * Signaling WebSocket URL 반환
 * (SockJS를 사용하지 않는 순수 WebSocket용)
 */
export const getSignalingWebSocketUrl = () => {
  const baseUrl = getSocketBaseUrl();
  if (!baseUrl) return "";
  // http:// -> ws://, https:// -> wss:// 로 변환
  return baseUrl.replace(/^http/, "ws");
};
