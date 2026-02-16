/**
 * 라우터 설정 파일
 *
 * [React Router 개념]
 * - React는 SPA(Single Page Application)이므로 페이지 이동 시 서버에 요청하지 않음
 * - React Router가 URL 경로에 따라 어떤 컴포넌트를 보여줄지 결정함
 * - <Routes>: 경로 목록을 감싸는 컨테이너
 * - <Route>: 각 경로(path)와 보여줄 컴포넌트(element)를 매핑
 *
 * [lazy + Suspense 패턴]
 * - lazy(): 해당 페이지 컴포넌트를 처음 방문할 때만 로드 (코드 스플리팅)
 *   → 초기 번들 크기를 줄여 첫 로딩 속도를 향상시킴
 * - <Suspense>: lazy로 불러오는 컴포넌트가 로드될 때까지 fallback UI를 보여줌
 *
 * [Route Guard (인증 라우팅)]
 * - PublicRoute: 비로그인 사용자만 접근 가능 (로그인 상태면 /home으로 리다이렉트)
 * - ProtectedRoute: 로그인 사용자만 접근 가능 (비로그인이면 /로 리다이렉트)
 * - <Outlet>: 부모 라우트 내부에 자식 라우트를 렌더링하는 자리 표시자
 */

import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import PublicRoute from "@/routes/guards/PublicRoute";
import ProtectedRoute from "@/routes/guards/ProtectedRoute";
import LoadingPage from "@/components/common/Loading";

/**
 * lazy()로 페이지 컴포넌트를 동적 import
 * - 빌드 시 각 페이지가 별도 JS 파일(chunk)로 분리됨
 * - 사용자가 해당 경로에 처음 접근할 때만 다운로드
 */
const LandingPage = lazy(() => import("@/pages/Landing"));
const RoomPage = lazy(() => import("@/pages/Room"));
const HomeLayout = lazy(() => import("@/pages/Home"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function AppRoutes() {
  return (
    /**
     * Suspense: lazy 컴포넌트가 로드되는 동안 LoadingPage를 표시
     * fallback prop에 로딩 중 보여줄 컴포넌트를 전달
     */
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* 비로그인 사용자 전용 경로 */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* 로그인 사용자 전용 경로 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomeLayout />} />
          {/* :roomId는 URL 파라미터 → useParams()로 추출 가능 */}
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Route>

        {/* 매칭되지 않는 모든 경로 → 404 페이지 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
