/**
 * WebSocket URL 생성 유틸리티 (socketUtils.ts)
 *
 * [역할]
 * - 서버와의 WebSocket 연결을 위한 URL을 생성
 * - HTTP/HTTPS URL을 WebSocket(WS/WSS) URL로 변환
 *
 * [핵심 개념: WebSocket이란?]
 * - 서버와 클라이언트 간의 "양방향 실시간 통신" 프로토콜
 * - HTTP와의 차이점:
 *   - HTTP: 클라이언트가 요청 → 서버가 응답 (단방향, 매번 새 연결)
 *   - WebSocket: 한 번 연결하면 양쪽에서 자유롭게 메시지 주고받음 (실시간)
 * - 사용 사례: 채팅, 실시간 공동 편집, 알림, 주식 시세 등
 *
 * [핵심 개념: WS vs WSS]
 * - ws:// → 암호화되지 않은 WebSocket (HTTP에 대응)
 * - wss:// → TLS로 암호화된 WebSocket (HTTPS에 대응)
 * - 배포 환경에서는 보안을 위해 반드시 wss:// 사용
 *
 * [핵심 개념: 환경 변수 (import.meta.env)]
 * - Vite에서 환경 변수를 읽는 방법 (CRA의 process.env와 유사)
 * - VITE_ 접두사가 붙은 변수만 프론트엔드에서 접근 가능
 * - .env 파일에 정의: VITE_API_BASE_URL=https://api.example.com
 * - || 연산자: 환경 변수가 없으면 기본값(fallback) 사용
 */

/**
 * API 서버의 Base URL을 반환
 * - 환경 변수에 설정된 값을 우선 사용
 * - 설정이 없으면 로컬 개발 환경 기본값(localhost:8080) 사용
 *
 * @returns HTTP(S) 형식의 API 서버 URL (예: "https://api.example.com")
 */
export const getSocketBaseUrl = () => {
  // import.meta.env.VITE_API_BASE_URL: .env 파일에 정의된 API 서버 주소
  // || "http://localhost:8080": 환경 변수가 없을 때의 기본값 (로컬 개발용)
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
};

/**
 * Signaling WebSocket URL 반환
 * - HTTP(S) URL을 WS(S) URL로 변환
 * - WebRTC 시그널링 서버와의 연결에 사용
 *
 * [WebRTC 시그널링이란?]
 * - WebRTC(실시간 영상/음성 통신)에서 피어 간 연결을 중개하는 과정
 * - 시그널링 서버가 WebSocket으로 연결 정보를 중계해줌
 *
 * @returns WebSocket 형식의 시그널링 서버 URL (예: "wss://api.example.com")
 */
export const getSignalingWebSocketUrl = () => {
  const baseUrl = getSocketBaseUrl();
  if (!baseUrl) return "";

  // 정규식으로 프로토콜 변환: http → ws, https → wss
  // /^http/: 문자열 시작(^)의 "http"를 매칭
  // "http" → "ws"로 바꾸면 "https" → "wss"도 자동으로 처리됨
  return baseUrl.replace(/^http/, "ws");
};
