/**
 * Home 레이아웃 컴포넌트
 * OAuth 콜백 처리 및 인증된 사용자의 메인 레이아웃
 */

import { Outlet } from "react-router-dom";
import SideBar from "@/components/home/SideBar";
import Header from "@/components/home/Header";
import { useOAuthCallback } from "@/hooks/user/useOAuthCallback";

export default function HomeLayout() {
  // OAuth 콜백 처리 (URL에 토큰이 있으면 자동 로그인)
  const { isProcessing, error } = useOAuthCallback();

  // 로그인 처리 중 로딩 표시
  if (isProcessing) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          {/* 로딩 스피너 */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-foreground">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생 시 표시
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center text-red-500">
          <p className="mb-4">로그인 오류: {error}</p>
          <a
            href="/"
            className="underline text-foreground hover:text-muted-foreground"
          >
            다시 시도하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <SideBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
