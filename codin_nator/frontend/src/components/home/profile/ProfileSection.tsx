/**
 * ProfileSection - 사용자 프로필 카드 + 로그아웃 버튼
 *
 * [React 기초 - 전역 상태 (Zustand)]
 * - useAuthStore: Zustand 스토어에서 user 정보와 logout 함수를 가져옴
 * - (state) => state.user 형태의 셀렉터로 필요한 상태만 구독
 * - 구독한 상태가 바뀔 때만 컴포넌트가 리렌더링됨
 *
 * [React 기초 - 조건부 렌더링]
 * - user?.imageUrl이 있으면 이미지, 없으면 이름 첫 글자 표시
 * - 옵셔널 체이닝(?.)과 논리 OR(||)로 안전하게 기본값 처리
 *
 * [사용된 기술]
 * - framer-motion: <motion.div>로 등장 애니메이션 (opacity, y 이동)
 * - useNavigate: 프로그래밍 방식으로 페이지 이동 (React Router)
 * - lucide-react: LogOut, Github 아이콘
 */
import { motion } from "framer-motion";
import { LogOut, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileSection() {
  // Zustand 스토어에서 셀렉터 패턴으로 필요한 상태만 구독
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  // useNavigate: 프로그래밍 방식의 페이지 이동을 위한 React Router 훅
  const navigate = useNavigate();

  // 로그아웃 핸들러: 스토어 상태 초기화 + 랜딩 페이지로 이동
  const onLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl shadow-xl p-8 bg-[#e2e6eb]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          {/* 프로필 이미지 */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#24292E] text-2xl font-semibold text-[#ECEAEA]">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-gh-dark">
              {user?.name || "Unknown User"}
            </h2>
            <p className="text-sm text-gh-muted">
              {user?.email || "No email provided"}
            </p>
            {user?.gitId && (
              <div className="flex items-center gap-1.5 text-sm mt-2 text-gh-muted">
                <Github className="w-4 h-4" />
                <span>{user.gitId}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="
            group flex items-center gap-2 px-5 py-2.5
            rounded-lg font-medium text-sm
            shadow-sm
            transition-all duration-200
            bg-[#c4c9ce] hover:bg-[#d87a7a]
            text-gh-dark hover:text-white
            border border-[#b4b9be] hover:border-[#d87a7a]
          "
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Logout
        </button>
      </div>
    </motion.div>
  );
}
