import type { User, AuthTokens } from "./user/types";

/**
 * 인증 상태 관리를 위한 Zustand 스토어 타입
 */
interface AuthState {
  /** 로그인 여부 */
  isAuthenticated: boolean;

  /** 현재 로그인한 사용자 정보 (비로그인 시 null) */
  user: User | null;

  /** 인증 토큰 정보 (비로그인 시 null) */
  tokens: AuthTokens | null;

  /**
   * 로그인 처리
   * @param user - 사용자 정보
   * @param tokens - 인증 토큰
   */
  login: (user: User, tokens: AuthTokens) => void;

  /** 로그아웃 처리 */
  logout: () => void;
}
