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

/**
 * GitHub API 응답 타입 (필요한 필드만 정의)
 */
export interface GitHubUserResponse {
  /** GitHub 고유 ID */
  id: number;
  /** GitHub 로그인 닉네임 */
  login: string;
  /** 사용자 이메일 (비공개 시 null) */
  email: string | null;
  /** 프로필 이미지 URL */
  avatar_url: string;
}

/**
 * 에러 로그 데이터 구조 demo
 */
export interface ErrorLog {
  id: string;
  time: string;
  display_name: string;
  error: string;
  stacktrace: string;
  resolution: string;
}

export type ContributionData = Record<
  string,
  {
    count: number;
    logs: ErrorLog[];
  }
>;

export interface ContributionGraphProps {
  data?: ContributionData;
}
