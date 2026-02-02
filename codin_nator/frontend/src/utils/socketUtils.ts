/**
 * 현재 호스트네임을 기반으로 적절한 소켓(API) Base URL을 반환합니다.
 * - 배포 환경(ssafy.io 포함)에서는 HTTPS/WSS 프로토콜이 적용된 배포 주소
 * - 로컬 환경에서는 HTTP/WS 프로토콜이 적용된 로컬 주소
 */
export const getSocketBaseUrl = () => {
  const isProd = window.location.hostname.includes('ssafy.io');
  return isProd 
    ? import.meta.env.VITE_API_URL_PROD 
    : import.meta.env.VITE_API_URL_LOCAL;
};

/**
 * Signaling WebSocket URL 반환
 * (SockJS를 사용하지 않는 순수 WebSocket용)
 */
export const getSignalingWebSocketUrl = () => {
    const baseUrl = getSocketBaseUrl();
    // http:// -> ws://, https:// -> wss:// 로 변환
    return baseUrl.replace(/^http/, 'ws');
}
