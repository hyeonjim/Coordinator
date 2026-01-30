/**
 * GitHub 소셜 로그인 관련 사용자 타입 정의
 * 백엔드 User 엔티티와 일치하는 구조
 */

/**
 * GitHub OAuth를 통해 받아오는 사용자 정보 타입
 */
export interface User {
  /** GitHub 로그인 닉네임 (login) */
  name: string;

  /** 사용자 이메일 주소 */
  email: string;

  /** GitHub 프로필 이미지 URL (avatar_url) */
  imageUrl: string;

  /** GitHub 고유 사용자 ID */
  gitId: string;
}

/**
 * OAuth 인증 토큰 정보 타입
 */
export interface AuthTokens {
  /** JWT 액세스 토큰 (백엔드에서 발급) */
  accessToken: string;

  /** GitHub API 접근 토큰 (GitHub에서 발급) */
  gitHubToken: string;
}
