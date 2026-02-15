/**
 * 로컬 서버의 소켓(API) Base URL을 반환합니다.
 * - 항상 로컬 환경(http://localhost:8080)을 사용합니다.
 */
export const getSocketBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
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
