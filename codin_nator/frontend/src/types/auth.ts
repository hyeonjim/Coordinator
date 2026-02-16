/**
 * @file auth.ts - 인증(Authentication) 관련 타입 정의
 *
 * GitHub OAuth 소셜 로그인 흐름에서 사용되는 모든 타입을 정의합니다.
 *
 * 인증 흐름:
 * 1. 사용자가 GitHub 로그인 버튼 클릭
 * 2. GitHub OAuth 페이지로 리다이렉트
 * 3. 인증 성공 시 콜백 URL로 code 파라미터 전달
 * 4. 백엔드에서 code를 이용해 GitHub API 호출 → 사용자 정보 + 토큰 발급
 * 5. 프론트엔드에서 User, AuthTokens를 Zustand 스토어에 저장
 *
 * 통합 출처:
 * - types/login.d.ts (AuthState)
 * - types/user/types.ts (User, AuthTokens, GitHubUserResponse, UseOAuthCallbackResult)
 */

// ─── 사용자 정보 ─────────────────────────────────────────────────────────────

/**
 * GitHub OAuth를 통해 받아오는 사용자 정보 타입
 *
 * 백엔드 User 엔티티와 1:1 매핑되며, 로그인 후 전역 상태에 저장됩니다.
 * GitHub API의 응답 필드(login, avatar_url 등)를 프론트엔드 컨벤션에 맞게 변환한 형태입니다.
 */
export interface User {
  /** GitHub 고유 사용자 ID (백엔드 DB의 PK로도 사용) */
  gitId: string;

  /** GitHub 로그인 닉네임 (login 필드에서 매핑) */
  name: string;

  /** 사용자 이메일 주소 */
  email: string;

  /** GitHub 프로필 이미지 URL (avatar_url에서 매핑) */
  imageUrl: string;
}

// ─── OAuth 콜백 ──────────────────────────────────────────────────────────────

/**
 * OAuth 콜백 처리 결과 타입
 *
 * useOAuthCallback 훅에서 반환하며,
 * 콜백 페이지에서 로딩 상태와 에러 메시지를 표시하는 데 사용됩니다.
 */
export interface UseOAuthCallbackResult {
  /** 로그인 처리 중 여부 (true이면 스피너 표시) */
  isProcessing: boolean;

  /** 에러 메시지 (에러 발생 시, 정상이면 null) */
  error: string | null;
}

// ─── 인증 토큰 ──────────────────────────────────────────────────────────────

/**
 * OAuth 인증 토큰 정보 타입
 *
 * 두 가지 토큰을 관리합니다:
 * - accessToken: 백엔드 JWT (우리 서버 API 호출 시 Authorization 헤더에 사용)
 * - gitHubToken: GitHub Personal Access Token (GitHub API 직접 호출 시 사용)
 */
export interface AuthTokens {
  /** JWT 액세스 토큰 (백엔드에서 발급, API 인증용) */
  accessToken: string;

  /** GitHub API 접근 토큰 (GitHub에서 발급, 리포지토리 접근용) */
  gitHubToken: string;
}

// ─── GitHub API 응답 ─────────────────────────────────────────────────────────

/**
 * GitHub API 사용자 정보 응답 타입 (필요한 필드만 정의)
 *
 * GitHub REST API의 GET /user 응답에서 사용하는 필드입니다.
 * 전체 응답은 훨씬 많은 필드를 포함하지만, 우리 앱에서 필요한 것만 정의합니다.
 *
 * @see https://docs.github.com/en/rest/users/users#get-the-authenticated-user
 */
export interface GitHubUserResponse {
  /** GitHub 고유 숫자 ID */
  id: number;

  /** GitHub 로그인 닉네임 (예: "octocat") */
  login: string;

  /** 사용자 이메일 (비공개 설정 시 null) */
  email: string | null;

  /** 프로필 이미지 URL */
  avatar_url: string;
}

// ─── Zustand 인증 스토어 ─────────────────────────────────────────────────────

/**
 * 인증 상태 관리를 위한 Zustand 스토어 타입
 *
 * Zustand는 React의 전역 상태 관리 라이브러리입니다.
 * 이 인터페이스는 create() 함수의 제네릭 타입으로 사용되어
 * 스토어의 상태(state)와 액션(action)을 모두 정의합니다.
 *
 * @example
 * ```ts
 * const useAuthStore = create<AuthState>((set) => ({
 *   isAuthenticated: false,
 *   user: null,
 *   tokens: null,
 *   login: (user, tokens) => set({ isAuthenticated: true, user, tokens }),
 *   logout: () => set({ isAuthenticated: false, user: null, tokens: null }),
 * }));
 * ```
 */
export interface AuthState {
  /** 로그인 여부 (true이면 인증된 상태) */
  isAuthenticated: boolean;

  /** 현재 로그인한 사용자 정보 (비로그인 시 null) */
  user: User | null;

  /** 인증 토큰 정보 (비로그인 시 null) */
  tokens: AuthTokens | null;

  /**
   * 로그인 처리 액션
   * OAuth 콜백 성공 시 호출하여 사용자 정보와 토큰을 저장합니다.
   * @param user - 사용자 정보
   * @param tokens - 인증 토큰
   */
  login: (user: User, tokens: AuthTokens) => void;

  /** 로그아웃 처리 액션 (상태를 초기값으로 리셋) */
  logout: () => void;
}
