import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

/**
 * 보호된 라우트 컴포넌트
 * 로그인하지 않은 사용자는 랜딩 페이지로 리다이렉트
 * OAuth 콜백 토큰이 있으면 로그인 처리를 기다림
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchParams] = useSearchParams();

  // OAuth 콜백 토큰이 URL에 있으면 로그인 처리 중으로 간주
  const hasOAuthTokens =
    searchParams.has("token") && searchParams.has("gitToken");

  // 로그인되지 않았고 OAuth 토큰도 없으면 리다이렉트
  if (!isAuthenticated && !hasOAuthTokens) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
