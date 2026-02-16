/**
 * JWT 디코딩 유틸리티 (decodeJwt.ts)
 *
 * [역할]
 * - JWT(JSON Web Token) 문자열에서 페이로드(payload) 부분을 추출하고 디코딩
 * - 토큰에 담긴 사용자 정보(sub, exp 등)를 읽을 때 사용
 *
 * [핵심 개념: JWT (JSON Web Token)]
 * - 인증 정보를 안전하게 전달하기 위한 토큰 형식
 * - 구조: "헤더.페이로드.서명" 세 부분이 점(.)으로 구분됨
 *   - 헤더(Header): 토큰 타입, 암호화 알고리즘 정보
 *   - 페이로드(Payload): 실제 데이터 (사용자 ID, 만료 시간 등)
 *   - 서명(Signature): 토큰 위변조 검증용 (서버만 생성 가능)
 * - 각 부분은 Base64URL로 인코딩되어 있음
 *
 * [핵심 개념: Base64 / Base64URL]
 * - Base64: 바이너리 데이터를 텍스트(A-Z, a-z, 0-9, +, /)로 변환하는 인코딩
 * - Base64URL: Base64의 변형으로 URL에서 안전하게 사용 가능
 *   - '+' → '-', '/' → '_' 로 대체 (URL에서 특수문자 문제 방지)
 * - 디코딩 순서: Base64URL → Base64로 변환 → atob()로 디코딩
 *
 * [핵심 개념: atob()]
 * - 브라우저 내장 함수: Base64 문자열 → 원본 문자열로 디코딩
 * - 반대: btoa() → 원본 문자열 → Base64로 인코딩
 * - "atob" = ASCII to Binary (실제로는 Base64 → ASCII)
 *
 * [보안 주의]
 * - JWT 페이로드는 "인코딩"된 것이지 "암호화"된 것이 아님!
 * - 누구나 디코딩하여 내용을 볼 수 있으므로 민감한 정보를 넣으면 안 됨
 * - 서명 검증은 서버에서만 수행 (프론트에서는 내용만 읽음)
 */

/**
 * JWT 페이로드의 타입 정의
 * - sub: 주체(Subject) - 보통 사용자 ID
 * - iat: 발급 시간(Issued At) - Unix timestamp
 * - exp: 만료 시간(Expiration) - Unix timestamp
 * - [key: string]: unknown → 추가 커스텀 필드 허용 (인덱스 시그니처)
 */
export interface JwtPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * JWT 토큰 문자열을 디코딩하여 페이로드 객체를 반환
 *
 * [동작 흐름]
 * 1. JWT를 점(.)으로 분리 → 두 번째 부분(인덱스 1)이 페이로드
 * 2. Base64URL → Base64로 변환 (- → +, _ → /)
 * 3. atob()로 Base64 디코딩 → JSON 문자열
 * 4. JSON.parse()로 객체 변환
 *
 * @param token - JWT 토큰 문자열 (예: "eyJhbG...eyJzdW...SflKxw...")
 * @returns 디코딩된 페이로드 객체
 * @throws JWT 형식이 잘못된 경우 에러
 */
export function decodeJwt(token: string): JwtPayload {
  // split("."): JWT를 점 기준으로 3개 파트로 분리
  // [1]: 두 번째 파트 = 페이로드 (인덱스는 0부터 시작)
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("Invalid JWT format");
  }

  // Base64URL → 표준 Base64로 변환
  // replace(/-/g, "+"): 모든 '-'를 '+'로 (g = global, 전체 치환)
  // replace(/_/g, "/"): 모든 '_'를 '/'로
  // atob(): Base64 문자열을 원본 문자열(JSON)로 디코딩
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));

  // JSON.parse(): JSON 문자열 → JavaScript 객체로 변환
  return JSON.parse(decoded);
}
