/**
 * 공개 라우트 가드 (비로그인 사용자 전용)
 *
 * [역할]
 * - 이미 로그인한 사용자가 랜딩 페이지(/)에 접근하면 /home으로 리다이렉트
 * - 비로그인 사용자는 그대로 자식 라우트(Outlet) 표시
 *
 * [React Router - Outlet]
 * - 부모 라우트 안에서 자식 라우트를 렌더링하는 자리 표시자
 * - routes/index.tsx에서 <Route element={<PublicRoute />}> 안의 자식 라우트가 여기에 표시됨
 *
 * [React Router - Navigate]
 * - 프로그래밍 방식으로 다른 경로로 이동
 * - replace: 브라우저 히스토리에 현재 페이지를 남기지 않음 (뒤로가기 방지)
 *
 * [Zustand 스토어]
 * - useAuthStore: 전역 인증 상태를 관리하는 스토어
 * - (state) => state.isAuthenticated: 셀렉터 함수로 필요한 값만 구독
 *   → 다른 상태가 변경되어도 이 컴포넌트는 리렌더링되지 않음 (성능 최적화)
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function PublicRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
