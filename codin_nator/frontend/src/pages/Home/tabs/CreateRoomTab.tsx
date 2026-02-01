import { useNavigate } from "react-router-dom";
import FormCard from "../../../components/home/CreateRoom.tsx/FormCard";
import FormInput from "../../../components/home/CreateRoom.tsx/FormInput";
import axios from "axios";
import { useState } from "react";

export default function CreateRoomTab() {
  const navigate = useNavigate();
  const [roomTitle, setRoomTitle] = useState("");
  const [gitToken, setGitToken] = useState("");
  const [branchName, setBranchName] = useState("");

  const roomCreate = () => {
    const accessToken = localStorage.getItem("access_token");

    axios
      .post(
        "/api/v1/room",
        {
          name: roomTitle,
          gitToken,
          branch: branchName,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .then((res) => {
        const roomId = res.data;
        navigate(`/room/${roomId}`);
      })
      .catch((err) => console.log(err));
  };
  return (
    <main className="flex-1 h-full flex flex-col bg-[#EEF4FA] p-6 overflow-y-auto relative">
      {/* 1. 전체 컨테이너 */}
      <div className=" w-full mb-6 ">
        {/* max-w-5xl =  “최대 너비 제한   | mx-auto =  margin-left/right를 auto 가로 가운데 정렬 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-0">
          {/* 2. 페이지 내부헤더 */}
          <div className="lg:col-span-2 flex flex-col justify-center pl-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              새 프로젝트 방 만들기
            </h1>
            <p className="text-gray-500">
              Git 레파지토리를 연결하여 협업 코딩 환경을 구성합니다.
            </p>
          </div>
          <div className="lg:col-span-1 flex flex-col justify-center">
            <button
              className="w-full h-[56px] bg-white text-lg font-medium text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              onClick={() => {
                roomCreate();
              }}
            >
              방 생성하기
            </button>
          </div>
        </div>
      </div>

      {/* 2. 레이아웃 나누기 (왼쪽:오른쪽 = 2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">
        {/* [왼쪽] 입력 폼 영역 */}
        <div className="lg:col-span-2 space-y-6 ">
          <FormCard
            title="프로젝트 정보"
            description="협업 방의 기본 정보를 입력해주세요."
            icon={
              <img src="/icons/folder-git.png" alt="📂" className="w-5 h-5" />
            }
            className="fles-1 h-full" // 높이 꽉 채우기요
          >
            <FormInput
              label="방 제목"
              placeholder="프로젝트 이름을 입력하세요"
              required
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
            />

            <FormInput
              label="Git 토큰"
              placeholder="Personal Access Token"
              type="password"
              required
              value={gitToken}
              onChange={(e) => setGitToken(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="브렌치 명"
                placeholder="main"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </div>
          </FormCard>
          {/* 끝 */}
        </div>
        {/* 여기서 부터 오른쪽임 */}
        <div className="space-y-6 lg:col-span-1 h-full flex flex-col gap-6">
          <FormCard
            title="Git 토큰 발급 방법"
            icon={<img src="/icons/key.png" alt="열쇠" className="w-5 h-5" />}
          >
            <div className="text-sm text-gray-600 space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>GitHub 설정 페이지로 이동</li>
                <li>Developer settings 선택</li>
                <li>Personal access tokens 클릭</li>
                <li>Generate new token 선택</li>
              </ol>
              {/* 링크 */}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
              >
                GitHub 토큰 발급 페이지
                <span className="text-xs">↗</span>
              </a>
            </div>
          </FormCard>
          {/* 끝 */}
        </div>
      </div>
    </main>
  );
}
