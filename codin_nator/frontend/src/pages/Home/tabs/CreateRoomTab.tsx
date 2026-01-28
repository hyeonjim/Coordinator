import FormCard from "../../../components/home/CreateRoom.tsx/FormCard";
import FormInput from "../../../components/home/CreateRoom.tsx/FormInput";

export default function CreateRoomTab() {
  return (
    <main className="flex-1 h-full flex flex-col bg-[#EEF4FA] p-6 overflow-y-auto relative">
      {/* 1. 전체 컨테이너 */}
      <div className=" w-full mb-6 ">
        {/* max-w-5xl =  “최대 너비 제한   | mx-auto =  margin-left/right를 auto 가로 가운데 정렬 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-0">
          {/* 2. 페이지 내부헤더 */}
          <div className="lg:col-span-2 flex flex-col justify-center pl-3">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              새 프로젝트 방 만들기
            </h1>
            {/* <p className="text-gray-500">
              Git 레파지토리를 연결하여 협업 코딩 환경을 구성합니다.
            </p> */}
          </div>
          {/* <div className="lg:col-span-1 flex flex-col justify-center">
            <button className="w-full h-[56px] bg-white text-lg font-medium text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
              방 생성하기
            </button>
          </div> */}
        </div>
      </div>

      {/* 2. 레이아웃 나누기 (왼쪽:오른쪽 = 2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">
        {/* [왼쪽] 입력 폼 영역 */}
        <div className="lg:col-span-2 space-y-6">
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
              placeholder="프로젝트 이름을 입력하세요."
              required
            />

            <FormInput
              label="Git 토큰"
              placeholder="Personal Access Token"
              type="password"
              required
            />
            <FormInput
              label="브랜치명"
              placeholder="Push할 브랜치명을 입력하세요."
              required
            />
            {/* <div className="grid grid-cols-2 gap-4">
              <FormInput label="브렌치 명" placeholder="main" required />

              <FormInput
                label="새로 만들 브랜치 명"
                placeholder="feature/new-branch"
                note="선택 사항"
              />
            </div> */}
          </FormCard>{" "}
          {/* 끝 */}
        </div>
        {/* 여기서 부터 오른쪽임 */}
        <div className="lg:col-span-1 h-full flex flex-col gap-6">
          <FormCard
            title="Git 토큰 발급 방법"
            icon={<img src="/icons/key.png" alt="열쇠" className="w-5 h-5" />}
          >
            <div className="text-sm text-gray-600 space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>GitHub 설정 페이지로 이동</li>
                <li>Developer settings 선택</li>
                <li>Personal access tokens 선택</li>
                <li>Generate new token 클릭</li>
                <li>+ Add permissions 클릭</li>
                <li>Contents 체크</li>
                <li>Read and write 선택</li>
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
          <button className="w-full h-[56px] bg-white text-lg font-medium text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            방 생성하기
          </button>
          {/* <FormCard
            title="레파지토리 형식"
            icon={
              <img src="/icons/git-branch.png" alt="git" className="w-5 h-5" />
            }
            className="flex-1" // 이 카드도 높이 꽉 맞추기
          >
            <div className="text-sm space-y-3">
              <p className="text-gray-600">
                레파지토리 명은 다음 형식으로 입력해주세여:
              </p>
              <div className="bg-gray-100 p-3 rounded-md font-momo text-gray-800 border-gray-200">
                username/repository
              </div>
              <p className="text-xs text-gray-500">예: octocat/hello-word</p>
            </div>
          </FormCard> */}
          {/* 끝 */}
        </div>
      </div>
    </main>
  );
}
