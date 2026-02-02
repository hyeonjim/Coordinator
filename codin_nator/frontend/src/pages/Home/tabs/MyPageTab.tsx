/**
 * 마이페이지 탭 컴포넌트
 * 로그인한 사용자의 GitHub 프로필 정보를 표시
 */

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/home/myPage/avatar";
import { ContributionGraph } from "@/components/home/myPage/contribution-graph";
import { useAuthStore } from "@/stores/authStore";

export default function MyPage() {
  // 스토어에서 사용자 정보 가져오기
  const user = useAuthStore((state) => state.user);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* 프로필 섹션 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* 사용자 프로필 이미지 */}
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={user?.imageUrl || "/placeholder.svg"}
              alt={user?.name || "User"}
            />
            <AvatarFallback className="text-2xl">
              {/* 이름의 첫 글자를 대문자로 표시 */}
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* 사용자 이름과 이메일 */}
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {user?.name || "Unknown User"}
            </h2>
            <p className="text-muted-foreground">
              {user?.email || "No email provided"}
            </p>
            {/* GitHub ID 표시 */}
            {user?.gitId && (
              <p className="text-sm text-muted-foreground mt-1">
                GitHub ID: {user.gitId}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 기여 그래프 섹션 */}
      <div className="bg-card rounded-xl border p-6">
        <ContributionGraph />
      </div>
    </div>
  );
}
