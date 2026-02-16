/**
 * 보호된 라우트 가드 (로그인 사용자 전용)
 *
 * [역할]
 * - 로그인하지 않은 사용자는 랜딩 페이지(/)로 리다이렉트
 * - OAuth 콜백 토큰이 URL에 있으면 로그인 처리 중으로 간주하여 대기
 *
 * [OAuth 콜백 흐름]
 * 1. 사용자가 GitHub 로그인 → GitHub가 콜백 URL로 리다이렉트
 * 2. URL: /home?token=JWT_TOKEN&gitToken=GITHUB_TOKEN
 * 3. 이 컴포넌트에서 토큰이 있으면 로그인 처리 중으로 판단
 * 4. useOAuthCallback 훅이 토큰을 처리하고 로그인 완료
 *
 * [React Router - useSearchParams]
 * - URL의 쿼리 파라미터(?key=value)를 읽고 수정하는 훅
 * - searchParams.has("token"): URL에 token 파라미터가 있는지 확인
 */

import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchParams] = useSearchParams();

  // OAuth 콜백 토큰이 URL에 있으면 로그인 처리 중으로 간주
  const hasOAuthTokens =
    searchParams.has("token") && searchParams.has("gitToken");

  // 로그인되지 않았고 OAuth 토큰도 없으면 랜딩 페이지로 리다이렉트
  if (!isAuthenticated && !hasOAuthTokens) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
