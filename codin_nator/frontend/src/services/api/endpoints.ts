/**
 * API 엔드포인트 상수 (Centralized API Endpoints)
 *
 * [역할]
 * - 모든 API URL을 한 곳에서 관리하여 유지보수성 향상
 * - URL이 변경되면 이 파일만 수정하면 됨
 * - 백엔드 API 구조를 한눈에 파악 가능
 *
 * [as const]
 * - TypeScript에서 객체를 "읽기 전용 리터럴 타입"으로 만듦
 * - 값이 변경되지 않도록 보장하고, 자동완성 지원이 향상됨
 *
 * [백엔드 API 구조]
 * - /v1/room: 방 생성/조회
 * - /v1/room/{roomId}: 방별 파일, 참여자, 에디터, Git 등
 * - /v1/room/generate-testcode, analyze-result: AI 기능
 */

// ── Room (방) ──
export const ROOM_ENDPOINTS = {
  CREATE: "/v1/room",
  FILES: (roomId: number) => `/v1/room/${roomId}/files`,
  FILE_CONTENT: (roomId: number, fileId: number) => `/v1/room/${roomId}/${fileId}`,
  UPLOAD: (roomId: number) => `/v1/room/${roomId}/uploads`,
  JOIN: (roomId: number) => `/v1/room/${roomId}/participants/me`,
} as const;

// ── Editor (에디터/파일 관리) ──
export const EDITOR_ENDPOINTS = {
  NEW_FILE: (roomId: number) => `/v1/room/editor/${roomId}/new-file`,
  DELETE_FILE: (roomId: number, fileId: number) => `/v1/room/editor/${roomId}/delete-file/${fileId}`,
  SAVE: (roomId: number, fileId: number) => `/v1/room/editor/${roomId}/save/${fileId}`,
} as const;

// ── Git ──
export const GIT_ENDPOINTS = {
  ADD: (roomId: number) => `/v1/room/git/${roomId}/add`,
  COMMIT: (roomId: number) => `/v1/room/git/${roomId}/commit`,
  PUSH: (roomId: number) => `/v1/room/git/${roomId}/push`,
} as const;

// ── AI (테스트 생성/분석) ──
export const AI_ENDPOINTS = {
  GENERATE_TEST_CODE: "/v1/room/generate-testcode",
  ANALYZE_RESULT: "/v1/room/analyze-result",
  MY_REPORTS: "/v1/room/reports/me",
  CODE_RUN: (roomId: number) => `/v1/room/${roomId}/code-run`,
} as const;
