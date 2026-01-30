/**
 * GitHub API 서비스
 * GitHub API를 호출하여 사용자 정보를 가져오는 함수 모음
 */

import type { User } from "../../types/user/types";

// GitHub API 기본 URL
const GITHUB_API_BASE_URL = "https://api.github.com";

/**
 * GitHub API 응답 타입 (필요한 필드만 정의)
 */
interface GitHubUserResponse {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

/**
 * GitHub API를 호출하여 현재 인증된 사용자 정보를 가져옴
 * @param gitHubToken - GitHub OAuth 액세스 토큰
 * @returns 사용자 정보 객체
 * @throws GitHub API 호출 실패 시 에러
 */
export async function fetchGitHubUserInfo(gitHubToken: string): Promise<User> {
  // GitHub API의 /user 엔드포인트 호출
  const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
    method: "GET",
    headers: {
      // Bearer 토큰 인증 헤더
      Authorization: `Bearer ${gitHubToken}`,
      // JSON 응답 요청
      Accept: "application/vnd.github.v3+json",
    },
  });

  // 응답 상태 확인
  if (!response.ok) {
    throw new Error(
      `GitHub API 호출 실패: ${response.status} ${response.statusText}`,
    );
  }

  // JSON 응답 파싱
  const data: GitHubUserResponse = await response.json();

  // User 타입으로 변환하여 반환
  return {
    name: data.login, // GitHub 로그인 닉네임
    email: data.email || "", // 이메일 (비공개 설정 시 null)
    imageUrl: data.avatar_url, // 프로필 이미지 URL
    gitId: String(data.id), // GitHub 고유 ID (숫자 → 문자열 변환)
  };
}
