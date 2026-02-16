/**
 * 인증 상태 관리 Zustand 스토어 (authStore.ts)
 *
 * [역할]
 * - 로그인/로그아웃 상태, 사용자 정보, 인증 토큰을 전역으로 관리
 * - 어떤 컴포넌트에서든 useAuthStore()로 인증 상태에 접근 가능
 *
 * [핵심 개념: Zustand란?]
 * - React의 전역 상태 관리 라이브러리 (Redux보다 간단하고 가벼움)
 * - create() 함수 하나로 스토어를 생성
 * - 컴포넌트에서 useAuthStore((state) => state.user) 형태로 필요한 값만 구독
 * - 구독한 값이 바뀔 때만 해당 컴포넌트가 리렌더링됨 (성능 최적화)
 *
 * [핵심 개념: persist 미들웨어]
 * - Zustand의 확장 기능으로, 스토어 상태를 localStorage에 자동 저장/복원
 * - 페이지를 새로고침해도 로그인 상태가 유지되는 이유
 * - name: "auth-storage" → localStorage의 키 이름
 * - 동작: 상태 변경 → 자동으로 JSON.stringify → localStorage에 저장
 *         페이지 로드 → localStorage에서 읽기 → JSON.parse → 상태 복원
 *
 * [핵심 개념: 미들웨어 패턴]
 * - create(persist((set) => ({ ... }), { name: "..." }))
 * - persist()가 create()를 감싸는 구조 = "미들웨어"
 * - 원래 동작(상태 변경)에 추가 동작(localStorage 저장)을 끼워넣는 패턴
 *
 * [핵심 개념: set 함수]
 * - Zustand에서 상태를 변경하는 유일한 방법
 * - set({ key: value })로 호출하면 해당 상태가 업데이트되고 구독 컴포넌트가 리렌더링
 * - React의 setState와 비슷하지만, 전역 스토어에서 동작
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens, AuthState } from "@/types/auth";
import {
  saveAccessToken,
  saveGitHubToken,
  clearAllTokens,
} from "@/utils/token/tokenStorage";

// create<AuthState>(): AuthState 타입의 Zustand 스토어 생성
// persist()로 감싸서 localStorage 자동 동기화 활성화
export const useAuthStore = create<AuthState>()(
  persist(
    // set: 상태를 변경하는 함수 (Zustand가 제공)
    (set) => ({
      // ── 초기 상태 ──
      isAuthenticated: false, // 로그인 여부
      user: null,             // 사용자 정보 (User | null)
      tokens: null,           // 인증 토큰 (AuthTokens | null)

      /**
       * 로그인 처리
       * - 토큰을 localStorage에 별도 저장 (API 인터셉터에서 읽기 위해)
       * - Zustand 상태를 업데이트하여 구독 컴포넌트에 알림
       *
       * @param user - 사용자 정보 (이름, 이메일, 이미지 등)
       * @param tokens - 인증 토큰 (accessToken, gitHubToken)
       */
      login: (user: User, tokens: AuthTokens) => {
        // 토큰을 localStorage에 별도 저장 (axios 인터셉터가 여기서 토큰을 읽음)
        saveAccessToken(tokens.accessToken);
        saveGitHubToken(tokens.gitHubToken);

        // set()으로 Zustand 상태 업데이트 → 구독 컴포넌트 자동 리렌더링
        set({
          isAuthenticated: true,
          user,
          tokens,
        });
      },

      /**
       * 로그아웃 처리
       * - localStorage에서 토큰 삭제
       * - 모든 인증 상태를 초기값으로 리셋
       */
      logout: () => {
        // localStorage에서 토큰 삭제 (보안: 로그아웃 시 반드시 정리)
        clearAllTokens();

        // 상태 초기화 → 로그인 페이지로 리다이렉트 등의 로직이 자동 실행됨
        set({
          isAuthenticated: false,
          user: null,
          tokens: null,
        });
      },
    }),
    {
      name: "auth-storage", // localStorage에 저장될 키 이름
    },
  ),
);
