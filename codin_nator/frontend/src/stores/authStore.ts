/**
 * 인증 상태 관리 Zustand 스토어
 * persist 미들웨어로 localStorage에 상태 자동 저장
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "../types/user/types";
import {
  saveAccessToken,
  saveGitHubToken,
  clearAllTokens,
} from "../utils/token/tokenStorage";
import type { AuthState } from "../types/login";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 초기 상태
      isAuthenticated: false,
      user: null,
      tokens: null,

      /**
       * 로그인 처리
       * 사용자 정보와 토큰을 저장하고 인증 상태를 true로 변경
       * @param user - 사용자 정보
       * @param tokens - 인증 토큰
       */
      login: (user: User, tokens: AuthTokens) => {
        // 토큰을 localStorage에 별도 저장 (API 요청 시 사용)
        saveAccessToken(tokens.accessToken);
        saveGitHubToken(tokens.gitHubToken);

        set({
          isAuthenticated: true,
          user,
          tokens,
        });
      },

      /**
       * 로그아웃 처리
       * 모든 인증 정보 초기화
       */
      logout: () => {
        // localStorage에서 토큰 삭제
        clearAllTokens();

        set({
          isAuthenticated: false,
          user: null,
          tokens: null,
        });
      },
    }),
    {
      name: "auth-storage", // localStorage 키 (기존 유지)
    },
  ),
);
