import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

/**
 * 홈 페이지 상단 헤더 컴포넌트
 * 로그인한 사용자의 GitHub 닉네임을 환영 메시지와 함께 표시
 */
export default function Header() {
  const navigate = useNavigate();

  // 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  /**
   * 로그아웃 처리
   * 스토어 초기화 후 랜딩 페이지로 이동
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Welcome 메시지와 GitHub 닉네임 표시 */}
          <h1 className="text-lg font-semibold text-foreground">
            Welcome, {user?.name || "Guest"}
          </h1>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm rounded-lg border border-neutral-700 hover:border-red-500 hover:text-red-500 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
