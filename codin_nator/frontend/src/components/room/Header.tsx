/**
 * Header - 룸 상단 헤더 (테마 전환, Git 액션, 공유 링크, 참여/퇴장)
 *
 * [React 기초 - 상태 관리 (useState)]
 * - useState로 컴포넌트의 상태를 선언하고 변경한다
 * - 상태가 바뀌면 React가 자동으로 화면을 다시 렌더링한다
 * - 예: const [theme, setTheme] = useState("dark") → theme은 현재값, setTheme은 변경함수
 *
 * [React 기초 - 부수효과 (useEffect)]
 * - useEffect는 렌더링 후에 실행되는 "부수효과" 로직이다
 * - 여기서는 테마 변경 시 DOM에 클래스를 추가/제거하는데 사용
 * - 두 번째 인자 [theme]는 의존성 배열: theme이 바뀔 때만 실행
 *
 * [React 기초 - 이벤트 핸들링]
 * - onClick={() => handleGitAction(id)} → 버튼 클릭 시 함수 실행
 * - async/await로 서버에 API 요청을 보내고 결과를 처리
 *
 * [사용된 기술]
 * - useParams: URL에서 roomId를 추출 (React Router)
 * - useRoomContext: 커스텀 훅으로 룸 전역 상태 접근
 * - axiosInstance: 서버 API 호출을 위한 HTTP 클라이언트
 * - CSS 변수 참조: bg-(--rc-header-bg) 형태로 테마에 따라 자동 변경
 */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import logo from "@/assets/images/logo2.png";
import logo2 from "@/assets/images/logo_nobg.png";

import Alert from "@/components/common/Alert";
import axiosInstance from "@/services/api/axios";
import { GIT_ENDPOINTS } from "@/services/api/endpoints";
import { useRoomContext } from "@/hooks/room/useRoomContext";
import type { Theme, GitAction } from "@/types/room";

// 테마별 메타 정보: 아이콘, 라벨, 다음 테마를 Record 타입으로 정의
// Record<Key, Value>는 TypeScript에서 키-값 쌍의 객체 타입을 정의하는 유틸리티 타입
const THEME_META: Record<Theme, { icon: string; label: string; next: Theme }> =
  {
    dark: { icon: "🌸", label: "라이트1로 전환", next: "light" },
    light: { icon: "☀️", label: "라이트2로 전환", next: "light2" },
    light2: { icon: "🌙", label: "다크로 전환", next: "dark" },
  };

// Git 액션 버튼 목록: 배열로 정의하여 map()으로 반복 렌더링에 활용
const GIT_ACTIONS: GitAction[] = [
  { id: "add", label: "Add" },
  { id: "commit", label: "Commit" },
  { id: "push", label: "Push" },
];

/**
 * ThemeToggle - 테마 전환 버튼 (하위 컴포넌트)
 *
 * [React 기초 - 인라인 Props 타입]
 * - Props 타입을 함수 매개변수에서 직접 정의할 수도 있다
 * - onSetTheme은 콜백 함수: 부모가 전달하고, 자식이 호출한다
 */
function ThemeToggle({
  theme, // 현재 테마 ("dark" | "light" | "light2")
  onSetTheme, // 테마 변경 콜백 (부모의 setTheme을 전달받음)
}: {
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
}) {
  // 구조분해할당: THEME_META에서 현재 테마의 아이콘, 라벨, 다음 테마를 추출
  const { icon, label, next } = THEME_META[theme];

  return (
    <button
      onClick={() => onSetTheme(next)}
      title={label}
      className="inline-flex items-center justify-center rounded-full px-3 py-1.5 mt-4 mb-4 text-xs font-semibold border border-(--rc-border) bg-(--rc-toggle-bg) text-(--rc-toggle-text) hover:bg-(--rc-toggle-hover) transition-all duration-150"
    >
      {icon}
    </button>
  );
}

export default function Header() {
  // useRoomContext: 커스텀 훅으로 룸 전역 상태에 접근
  // handleJoin: onJoin 처럼 구조분해할당 시 이름을 변경(rename)할 수 있다
  const {
    isJoined, // 현재 사용자가 방에 참여했는지 여부
    handleJoin: onJoin, // 방 참여 함수 (rename)
    handleLeave: onLeave, // 방 퇴장 함수 (rename)
    selectedFile, // 현재 선택된 파일 정보
    editorCode, // 에디터의 현재 코드 내용
  } = useRoomContext();
  const selectedFileId = selectedFile?.id ?? null;
  const editorContent = editorCode;
  // useState<Theme>("dark"): 제네릭으로 상태의 타입을 명시
  const [theme, setTheme] = useState<Theme>("dark");
  // 파생 상태: state에서 계산으로 얻는 값은 별도 state 없이 변수로 선언
  const isLightMode = theme !== "dark";
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // useEffect: 테마 변경 시 DOM의 CSS 클래스를 직접 조작하여 테마 적용
  // 의존성 배열 [theme]: theme이 바뀔 때만 이 효과가 실행됨
  useEffect(() => {
    const container = document.querySelector(".room-container");
    if (!container) return;
    container.classList.remove("room-light", "room-light2");
    if (theme === "light") container.classList.add("room-light");
    if (theme === "light2") container.classList.add("room-light2");
  }, [theme]);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");

  const shareLink = window.location.href;
  const { roomId } = useParams<{ roomId: string }>();

  // 클립보드 복사 핸들러: async/await로 브라우저 Clipboard API 호출
  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    // setTimeout: 1.5초 후 copied를 false로 되돌림 (복사 피드백 자동 해제)
    setTimeout(() => setCopied(false), 1500);
  };

  // 공통 버튼 스타일
  const btnBase =
    "inline-flex items-center justify-center rounded-full px-4 py-1.5 mt-4 mb-4 text-xs font-semibold " +
    "transition active:scale-[0.98] focus:outline-none focus:ring-2";

  // 기본
  const btnGray = isLightMode
    ? `${btnBase} bg-[#778abd] text-white hover:bg-[#527099] border border-[#6988b3] focus:ring-[#9AABD2]/60`
    : `${btnBase} bg-[#404a57] text-[#c6c7cc] hover:bg-[#7F838D] border border-[#7F838D] focus:ring-[#7F838D]/60`;

  // 강조(참여하기)
  const btnGrayStrong = isLightMode
    ? `${btnBase} bg-[#B492BA] text-white hover:bg-[#6A5D8A] border border-[#778abd] focus:ring-[#B492BA]/60`
    : `${btnBase} bg-[#7f8cad] text-[#0A080D] hover:bg-[#DCD8D8] border border-[#7F838D] focus:ring-[#7F838D]/60`;
  const btnLeave = isLightMode
    ? `${btnBase} bg-[#9284b5] text-white hover:bg-[#6A5D8A] border border-[#6A5D8A] focus:ring-[#6A5D8A]/60`
    : `${btnBase} bg-[#4d3737] text-[#DCD8D8] hover:bg-[#8B5A5A] border border-[#6B4A4A] focus:ring-[#6B4A4A]/60`;

  // roomId를 number로 변환 (GIT_ENDPOINTS 함수에 전달하기 위해)
  const numericRoomId = Number(roomId);

  const handleGitAction = async (action: string) => {
    if (!selectedFileId && action === "add") {
      setAlertMsg("파일을 먼저 선택해주세요.");
      return;
    }

    if (action === "add") {
      try {
        await axiosInstance.post(GIT_ENDPOINTS.ADD(numericRoomId), [
          { fileId: selectedFileId, content: editorContent },
        ]);
        setAlertMsg("Staging area에 파일을 추가합니다.");
      } catch {
        setAlertMsg("Staging area에 파일을 추가하는 데 실패했습니다.");
        return;
      }
    }

    if (action === "commit") {
      setShowCommit((v) => !v);
      setShowShare(false);
      return;
    }

    if (action === "push") {
      try {
        await axiosInstance.get(GIT_ENDPOINTS.PUSH(numericRoomId), {});
        setAlertMsg("리포지토리에 푸시되었습니다.");
      } catch {
        setAlertMsg("리포지토리 푸시 중 오류가 발생했습니다.");
        return;
      }
    }
  };

  const handleCommitSend = async () => {
    if (!commitMsg.trim()) {
      setAlertMsg("커밋 메시지를 입력해주세요.");
      return;
    }
    try {
      await axiosInstance.post(GIT_ENDPOINTS.COMMIT(numericRoomId), {
        message: commitMsg,
      });
      setAlertMsg("커밋이 성공적으로 완료되었습니다.");
    } catch {
      setAlertMsg("커밋하는 데 실패했습니다.");
      return;
    }

    setCommitMsg("");
    setShowCommit(false);
  };

  return (
    <header className="h-10 flex items-center justify-between p-3 shrink-0 relative bg-(--rc-header-bg)">
      <div className="flex items-center">
        <div className="h-7 flex items-center justify-center">
          <img
            src={theme === "light2" ? logo2 : logo}
            alt="CODIN'NATOR"
            className="h-8 w-auto"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle theme={theme} onSetTheme={setTheme} />

        <div className="relative">
          <button
            onClick={() => {
              setShowShare((v) => !v);
              setShowCommit(false);
            }}
            className={`${btnGray} px-3`}
          >
            🔗
          </button>

          {showShare && (
            <div className="absolute h-18 right-0 top-13 w-80 rounded-lg shadow-xl p-2 z-50 bg-(--rc-dropdown-bg) border border-(--rc-border) text-(--rc-text)">
              <p className="text-xs text-(--rc-text-muted) mb-2">공유 링크</p>
              <div className="flex gap-3">
                <input
                  value={shareLink}
                  readOnly
                  className="flex-1 px-2 py-1.5 rounded text-xs bg-(--rc-dropdown-input-bg) text-(--rc-text) border border-(--rc-border) focus:outline-none focus:border-(--rc-dropdown-input-focus-border)"
                />
                <button
                  onClick={handleCopy}
                  className="border border-(--rc-border) rounded-lg text-[12px] px-3 h-7 text-(--rc-text-muted) hover:bg-(--rc-border) hover:text-white"
                >
                  {copied ? "✔" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Git Buttons */}
        <div className="flex gap-2 relative">
          {/* map으로 리스트 렌더링: 배열의 각 항목을 JSX로 변환
              key={id}: React가 각 항목을 고유하게 식별하기 위한 필수 속성 */}
          {GIT_ACTIONS.map(({ id, label }) => (
            <div key={id} className="relative">
              <button onClick={() => handleGitAction(id)} className={btnGray}>
                {label}
              </button>

              {id === "commit" && showCommit && (
                <div className="absolute h-18 right-0 top-13 w-80 rounded-lg shadow-xl p-2 z-50 bg-(--rc-dropdown-bg) border border-(--rc-border) text-(--rc-text)">
                  <input
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    placeholder="커밋 메시지를 입력하세요"
                    className="flex-1 px-2 py-1.5 rounded text-xs bg-(--rc-dropdown-input-bg) text-(--rc-text) border border-(--rc-border) focus:outline-none focus:border-(--rc-dropdown-input-focus-border) w-full mb-2"
                  />
                  <button
                    onClick={handleCommitSend}
                    className={`${btnGray} px-3 py-2`}
                  >
                    ➤
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 조건부 렌더링: 삼항 연산자로 참여 상태에 따라 다른 버튼 표시 */}
        {isJoined ? (
          <button onClick={onLeave} className={btnLeave}>
            방 나가기
          </button>
        ) : (
          <button onClick={onJoin} className={btnGrayStrong}>
            참여하기
          </button>
        )}
      </div>

      <Alert open={!!alertMsg} onConfirm={() => setAlertMsg(null)}>
        {alertMsg}
      </Alert>
    </header>
  );
}
