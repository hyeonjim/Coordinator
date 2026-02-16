/**
 * 앱 시작 시 인증 상태 복원 (Bootstrap Authentication)
 *
 * [역할]
 * - 앱이 처음 로드될 때 localStorage에 저장된 JWT 토큰을 검증
 * - 토큰이 없거나 만료되었으면 로그아웃 처리
 *
 * [JWT (JSON Web Token) 구조]
 * - Header.Payload.Signature 형태의 문자열
 * - Payload에 사용자 정보와 만료 시간(exp)이 포함
 * - exp: Unix 타임스탬프 (초 단위) → 밀리초로 변환하여 비교
 *
 * [Zustand 스토어 외부 접근]
 * - useAuthStore.getState(): 컴포넌트 밖에서 스토어 상태에 접근
 * - 훅(useAuthStore)은 React 컴포넌트 안에서만 사용 가능하므로,
 *   일반 함수에서는 getState()로 직접 접근해야 함
 *
 * [try...catch 에러 처리]
 * - try: 에러가 발생할 수 있는 코드 실행
 * - catch: 에러 발생 시 실행 (토큰 변조/디코딩 실패 등)
 */

import { useAuthStore } from "@/stores/authStore";
import { decodeJwt } from "@/utils/token/decodeJwt";

export const bootstrapAuth = () => {
  const token = localStorage.getItem("access_token");

  // 토큰 없음 → 로그아웃
  if (!token) return useAuthStore.getState().logout();

  try {
    const { exp } = decodeJwt(token);

    // exp는 초 단위, Date.now()는 밀리초 → exp * 1000으로 단위 통일
    if (!exp || Date.now() >= exp * 1000) {
      useAuthStore.getState().logout();
    }
  } catch {
    // 토큰 디코딩 실패 → 변조된 토큰이므로 로그아웃
    useAuthStore.getState().logout();
  }
};
