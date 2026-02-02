/**
 * 토큰 저장 및 관리 유틸리티
 * localStorage를 사용하여 인증 토큰을 저장/조회/삭제
 */

// localStorage 키 상수
const ACCESS_TOKEN_KEY = "access_token";
const GITHUB_TOKEN_KEY = "github_token";

/**
 * JWT 액세스 토큰을 localStorage에 저장
 * @param token - 저장할 JWT 토큰
 */
export function saveAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * localStorage에서 JWT 액세스 토큰 조회
 * @returns 저장된 토큰 또는 null
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * GitHub API 토큰을 localStorage에 저장
 * @param token - 저장할 GitHub 토큰
 */
export function saveGitHubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
}

/**
 * localStorage에서 GitHub API 토큰 조회
 * @returns 저장된 토큰 또는 null
 */
export function getGitHubToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

/**
 * 모든 인증 토큰을 localStorage에서 삭제
 * 로그아웃 시 사용
 */
export function clearAllTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(GITHUB_TOKEN_KEY);
}
