import { useAuthStore } from "@/stores/authStore";

/**
 * 홈 페이지 상단 헤더 컴포넌트
 * 로그인한 사용자의 GitHub 닉네임을 환영 메시지와 함께 표시
 */
export default function Header() {
  // 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 bg-card border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Welcome 메시지와 GitHub 닉네임 표시 */}
          <h1 className="text-lg font-semibold text-foreground">
            Welcome, {user?.name || "Guest"}
          </h1>
        </div>
      </div>
    </header>
  );
}
