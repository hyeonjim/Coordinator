import Card from "@/components/home/setting/Card";
import SettingItem from "@/components/home/setting/SettingItem";
import profileImg from "@/assets/images/profile-image.jpg";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function SettingPage() {
  const navigate = useNavigate();
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
    <main className="flex-1 p-6 bg-[#eff4fa]">
      <div className="max-w-2xl mx-auto space-y-6 ">
        <div>
          <h2 className="text-2xl font-bold text-foreground ">설정</h2>
          <p className="text-muted-foreground">계정 설정을 관리합니다.</p>
        </div>
        <Card>
          <SettingItem
            title="프로필 이미지"
            description="프로필 사진을 변경합니다."
          />
          <div className="px-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-20 w-20">
                  <img
                    src={`${profileImg}`}
                    alt="프로필 이미지"
                    className="aspect-square size-full"
                  />
                </span>
                <button
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    alert(123);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-camera h-3 w-3"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  JPG, GIF, PNG. 최대 2MB
                </p>
                <button className="flex items-center gap-2 px-3 py-1 rounded border text-sm mt-2 border border-gray-200">
                  이미지 변경
                </button>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <SettingItem
            title="닉네임 변경"
            description="다른 사용자에게 표시되는 이름입니다."
          />
          <div className="px-6">
            <form action="" className="space-y-4">
              <div className="space-y-2">
                <label
                  className="flex items-center gap-2 text-sm font-medium"
                  htmlFor="nickname"
                >
                  닉네임
                </label>
                <input
                  className="w-full h-9 rounded-md px-3 text-sm border border-gray-200 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-blue-400 transition"
                  id="nickname"
                />
              </div>
              <input
                type="submit"
                value="저장"
                className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium cursor-pointer hover:bg-blue-500 transition"
              />
            </form>
          </div>
        </Card>
        <hr className="border-gray-200" />
        <Card border="border-[#d40924]">
          <SettingItem
            title="위험 구역"
            description="계정 관련 중요한 작업입니다. 신중하게 선택해주세요."
            textColor="text-[#d40924]"
          />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SettingItem
                title="로그아웃"
                description="현재 세션에서 로그아웃합니다."
              />
            </div>
            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-700 hover:border-red-500 hover:text-red-500 transition"
            >
              Logout
            </button>
          </div>

          <hr className="border-gray-200 mx-6" />
          <SettingItem
            title="회원 탈퇴"
            description="모든 데이터가 삭제됩니다."
          />
        </Card>
      </div>
    </main>
  );
}
