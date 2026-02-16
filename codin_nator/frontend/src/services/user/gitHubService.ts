/**
 * GitHub API 서비스 (gitHubService.ts)
 *
 * [역할]
 * - GitHub REST API를 호출하여 사용자 정보(프로필, 이메일 등)를 가져오는 모듈
 * - OAuth 로그인 후 발급받은 GitHub 토큰을 사용하여 인증된 API 요청을 수행
 *
 * [핵심 개념: fetch API]
 * - 브라우저 내장 함수로, 네트워크 요청(HTTP)을 보내는 가장 기본적인 방법
 * - axios와 달리 별도 설치 없이 사용 가능 (브라우저에 이미 내장)
 * - 반환값은 Response 객체 → .json()으로 JSON 파싱, .text()로 텍스트 파싱
 * - 주의: fetch는 404, 500 같은 에러 상태코드에서도 reject되지 않음
 *   → response.ok로 직접 확인해야 함 (axios는 자동으로 에러 처리)
 *
 * [핵심 개념: async/await + fetch]
 * - fetch()는 Promise를 반환하므로 await로 응답을 기다림
 * - response.json()도 Promise → 또 한 번 await 필요
 * - 예: const response = await fetch(url); const data = await response.json();
 *
 * [핵심 개념: HTTP 헤더 (Headers)]
 * - Authorization: "Bearer <token>" → OAuth 토큰 인증 (서버에 "나 인증됐어"라고 알림)
 * - Accept: 서버에 "이 형식으로 응답해줘"라고 요청 (여기서는 GitHub API v3 JSON 형식)
 *
 * [GitHub REST API]
 * - /user 엔드포인트: 현재 인증된 사용자의 프로필 정보 반환
 * - 공식 문서: https://docs.github.com/en/rest/users
 */

import type { User, GitHubUserResponse } from "@/types/auth";

// GitHub API 기본 URL (모든 GitHub API 요청의 베이스)
const GITHUB_API_BASE_URL = "https://api.github.com";

/**
 * GitHub API를 호출하여 현재 인증된 사용자 정보를 가져옴
 *
 * [동작 흐름]
 * 1. GitHub 토큰으로 /user API 호출
 * 2. 응답 상태 확인 (ok가 아니면 에러)
 * 3. JSON 파싱 후 우리 앱의 User 타입으로 변환
 *
 * @param gitHubToken - GitHub OAuth 액세스 토큰 (로그인 시 발급)
 * @returns 사용자 정보 객체 (User 타입)
 * @throws GitHub API 호출 실패 시 에러
 */
export async function fetchGitHubUserInfo(gitHubToken: string): Promise<User> {
  // fetch(): 브라우저 내장 HTTP 클라이언트로 GET 요청을 보냄
  // 두 번째 인자 객체로 method, headers 등 옵션을 설정
  const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
    method: "GET",
    headers: {
      // Bearer 토큰 인증: "Bearer" 뒤에 공백 하나, 그 다음 토큰 문자열
      Authorization: `Bearer ${gitHubToken}`,
      // GitHub API v3 형식의 JSON 응답을 요청
      Accept: "application/vnd.github.v3+json",
    },
  });

  // response.ok: HTTP 상태 코드가 200~299 사이이면 true
  // fetch는 4xx, 5xx 에러에서도 reject되지 않으므로 직접 확인 필요
  if (!response.ok) {
    throw new Error(
      `GitHub API 호출 실패: ${response.status} ${response.statusText}`,
    );
  }

  // response.json(): 응답 본문을 JSON으로 파싱 (비동기 → await 필요)
  // 제네릭 타입은 없지만, GitHubUserResponse 타입으로 타입 단언(as)
  const data: GitHubUserResponse = await response.json();

  // GitHub API 응답 형식 → 우리 앱의 User 타입으로 변환하여 반환
  return {
    name: data.login,          // GitHub 로그인 닉네임 (예: "octocat")
    email: data.email || "",   // 이메일 (비공개 설정 시 null → 빈 문자열로 대체)
    imageUrl: data.avatar_url, // 프로필 이미지 URL
    gitId: String(data.id),    // GitHub 고유 ID (숫자 → 문자열 변환)
  };
}
