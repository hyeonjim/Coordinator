/**
 * 토큰 저장 및 관리 유틸리티 (tokenStorage.ts)
 *
 * [역할]
 * - 인증 토큰(JWT, GitHub 토큰)을 브라우저의 localStorage에 저장/조회/삭제
 * - axios 인터셉터, authStore 등 여러 곳에서 사용되는 토큰 접근의 중앙 관리소
 *
 * [핵심 개념: localStorage]
 * - 브라우저에 내장된 키-값(Key-Value) 저장소
 * - 데이터가 문자열(string)로만 저장됨 (객체는 JSON.stringify 필요)
 * - 브라우저를 닫아도 데이터가 유지됨 (sessionStorage와의 차이점)
 * - 도메인별로 독립적 (다른 사이트에서 접근 불가)
 * - 주요 메서드:
 *   - localStorage.setItem(key, value): 저장
 *   - localStorage.getItem(key): 조회 (없으면 null 반환)
 *   - localStorage.removeItem(key): 삭제
 *
 * [왜 토큰을 localStorage에 저장하나?]
 * - 페이지 새로고침 후에도 로그인 상태를 유지하기 위해
 * - axios 인터셉터가 매 API 요청마다 여기서 토큰을 읽어 헤더에 첨부
 * - 보안 주의: localStorage는 XSS 공격에 취약할 수 있으므로,
 *   민감한 토큰은 httpOnly 쿠키 사용을 권장하기도 함
 */

// ── localStorage 키 상수 ──
// 키 이름을 상수로 관리하면 오타 방지 + 변경 시 한 곳만 수정
const ACCESS_TOKEN_KEY = "access_token";
const GITHUB_TOKEN_KEY = "github_token";

/**
 * JWT 액세스 토큰을 localStorage에 저장
 * - 로그인 성공 시 호출됨
 * - 이후 모든 API 요청에서 이 토큰이 Authorization 헤더에 포함됨
 *
 * @param token - 백엔드에서 발급받은 JWT 토큰 문자열
 */
export function saveAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * localStorage에서 JWT 액세스 토큰 조회
 * - axios 인터셉터에서 매 요청마다 호출하여 헤더에 첨부
 *
 * @returns 저장된 토큰 문자열 또는 null (저장된 토큰이 없을 때)
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * GitHub API 토큰을 localStorage에 저장
 * - GitHub OAuth 로그인 후 발급받은 토큰
 * - GitHub API 호출 시 사용 (gitHubService.ts에서 활용)
 *
 * @param token - GitHub OAuth 액세스 토큰 문자열
 */
export function saveGitHubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
}

/**
 * localStorage에서 GitHub API 토큰 조회
 *
 * @returns 저장된 GitHub 토큰 또는 null
 */
export function getGitHubToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

/**
 * 모든 인증 토큰을 localStorage에서 삭제
 * - 로그아웃 시 반드시 호출하여 인증 정보를 정리
 * - 보안: 로그아웃 후 토큰이 남아있으면 악용될 수 있으므로 확실히 삭제
 */
export function clearAllTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(GITHUB_TOKEN_KEY);
}
