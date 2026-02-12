import { useState } from "react";
import { useParams } from "react-router-dom";
import logo from "@/assets/images/logo2.png";
import logo2 from "@/assets/images/logo_nobg.png";

import Alert from "@/components/common/Alert";
import ThemeToggle from "@/components/room/ThemeToggle";
import axiosInstance from "@/api/axios";

interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
  selectedFileId: number | null;
  editorContent: string;
  theme: "dark" | "light" | "light2";
  onSetTheme: (theme: "dark" | "light" | "light2") => void;
}

const gitActions = [
  { id: "add", label: "Add" },
  { id: "commit", label: "Commit" },
  { id: "push", label: "Push" },
];

export default function Header({
  isJoined,
  onJoin,
  onLeave,
  selectedFileId,
  editorContent,
  theme,
  onSetTheme,
}: HeaderProps) {
  const isLightMode = theme !== "dark";
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");

  const shareLink = window.location.href;
  const { roomId } = useParams<{ roomId: string }>();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
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

  const handleGitAction = async (action: string) => {
    if (!selectedFileId && action === "add") {
      setAlertMsg("파일을 먼저 선택해주세요.");
      return;
    }

    if (action === "add") {
      try {
        await axiosInstance.post(`/v1/room/git/${roomId}/add`, [
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
        await axiosInstance.get(`/v1/room/git/${roomId}/push`, {});
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
      await axiosInstance.post(`/v1/room/git/${roomId}/commit`, {
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
    <header className="room-header relative">
      {/* Logo */}
      <div className="flex items-center">
        <div className="room-header-logo">
          <img
            src={theme === "light2" ? logo2 : logo}
            alt="CODIN'NATOR"
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle theme={theme} onSetTheme={onSetTheme} />

        {/* Share */}
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
            <div className="room-dropdown">
              <p className="text-xs text-[#7F838D] mb-2">공유 링크</p>
              <div className="flex gap-3">
                <input
                  value={shareLink}
                  readOnly
                  className="room-dropdown-input text-xs"
                />
                <button
                  onClick={handleCopy}
                  className={`border border-[#7F838D] rounded-lg text-[12px] px-3 h-7 text-[#b7bac0] hover:bg-[#7F838D] hover:text-white`}
                >
                  {copied ? "✔" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Git Buttons */}
        <div className="flex gap-2 relative">
          {gitActions.map(({ id, label }) => (
            <div key={id} className="relative">
              <button onClick={() => handleGitAction(id)} className={btnGray}>
                {label}
              </button>

              {id === "commit" && showCommit && (
                <div className="room-dropdown">
                  <input
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    placeholder="커밋 메시지를 입력하세요"
                    className="room-dropdown-input text-xs"
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

        {/* Room Actions */}
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
