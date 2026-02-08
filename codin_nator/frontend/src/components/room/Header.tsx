import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";
import logo from "@/assets/images/logo2.png";

import Alert from "@/components/common/Alert";

interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
  selectedFileId: number | null;
  editorContent: string;
}

type GitStage = "idle" | "added" | "committed";

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
}: HeaderProps) {
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [gitStage, setGitStage] = useState<GitStage>("idle");

  const btnDisabled = "opacity-40 pointer-events-none";

  const shareLink = window.location.href;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { roomId } = useParams<{ roomId: string }>();
  const accessToken = localStorage.getItem("access_token");

  // 공통 버튼 스타일
  const btnBase =
    "inline-flex items-center justify-center rounded-full px-4 py-1.5 mt-4 mb-4 text-xs font-semibold " +
    "transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#7F838D]/60";

  // 기본
  const btnGray = `${btnBase} bg-[#2F363F] text-[#c6c7cc] hover:bg-[#7F838D] border border-[#7F838D]`;

  // 강조(참여하기)
  const btnGrayStrong = `${btnBase} bg-[#93a0bf] text-[#0A080D] hover:bg-[#DCD8D8] border border-[#7F838D]`;

  // 방 나가기 (채도 낮춘 경고색 - 구분용)
  const btnLeave = `${btnBase} bg-[#4d3737] text-[#DCD8D8] hover:bg-[#8B5A5A] border border-[#6B4A4A]`;

  const handleGitAction = (action: string) => {
    if (!selectedFileId) {
      setAlertMsg("파일을 먼저 선택해주세요.");
      return;
    }
    if (action === "add") {
      axios
        .post(
          `/api/v1/room/git/${roomId}/add`,
          [
            {
              fileId: selectedFileId,
              content: editorContent,
            },
          ],
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .then(() => {
          setAlertMsg("Staging area에 파일을 추가합니다.");
          setGitStage("added");
        })
        .catch(() => {
          setAlertMsg("Staging area에 파일을 추가하는 데 실패했습니다.");
        });
      return;
    }
    if (action === "commit") {
      setShowCommit((v) => !v);
      setShowShare(false);
      return;
    }
    if (action === "push") {
      axios
        .get(`/api/v1/room/git/${roomId}/push`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then(() => {
          setAlertMsg("리포지토리에 푸시되었습니다.");
          setGitStage("idle");
        })
        .catch(() => {
          setAlertMsg("리포지토리에 푸시하는 데 실패했습니다.");
        });
      return;
    }

    console.log("Git:", action);
  };

  const handleCommitSend = () => {
    if (!commitMsg.trim()) {
      setAlertMsg("커밋 메시지를 입력해주세요.");
      return;
    }
    axios
      .post(
        `/api/v1/room/git/${roomId}/commit`,
        { message: commitMsg },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      .then(() => {
        setAlertMsg("커밋이 성공적으로 완료되었습니다.");
        setGitStage("committed");
      })
      .catch(() => {
        setAlertMsg("커밋하는 데 실패했습니다.");
      });

    setCommitMsg("");
    setShowCommit(false);
  };

  return (
    <header className="room-header relative">
      {/* Logo */}
      <div className="flex items-center">
        <div className="room-header-logo">
          <img
            src={logo}
            alt="CODIN'NATOR"
            className="h-full w-auto object-contain"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* ===== Share ===== */}
        <div className="relative">
          <button
            onClick={() => {
              setShowShare((v) => !v);
              setShowCommit(false);
            }}
            // ✅ 둥글고 통일된 버튼
            className={`${btnGray} px-3`}
            aria-label="share"
          >
            🔗
          </button>

          {showShare && (
            <div className="room-dropdown">
              <p className="text-xs text-[#7F838D] mb-2">공유 링크</p>

              <div className="flex items-center gap-1">
                <input
                  value={shareLink}
                  readOnly
                  className="room-dropdown-input text-xs"
                />
                <button
                  onClick={handleCopy}
                  // ✅ Copy도 통일
                  className={`${btnGray} px-4 py-2`}
                >
                  {copied ? "✔" : "Copy"}
                </button>
              </div>

              {copied && (
                <span className="text-[#7F838D] text-xs mt-2 block font-semibold">
                  링크가 복사되었습니다!
                </span>
              )}
            </div>
          )}
        </div>

        {/* ===== Git Buttons ===== */}
        <div className="flex items-center gap-2 relative">
          {gitActions.map(({ id, label }) => (
            <div key={id} className="relative">
              <button
                onClick={() => handleGitAction(id)}
                // ✅ Add/Commit/Push 통일
                className={`${btnGray}
    ${id === "add" && gitStage !== "idle" ? btnDisabled : ""}
    ${id === "commit" && gitStage !== "added" ? btnDisabled : ""}
    ${id === "push" && gitStage !== "committed" ? btnDisabled : ""}
  `}
              >
                {label}
              </button>

              {id === "commit" && showCommit && gitStage === "added" && (
                <div className="room-dropdown">
                  <p className="text-xs text-[#7F838D] mb-2">Commit message</p>

                  <div className="flex items-center gap-2">
                    <input
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder="커밋 메시지를 입력하세요"
                      className="room-dropdown-input text-xs"
                    />
                    <button
                      onClick={handleCommitSend}
                      // ✅ 전송 버튼도 통일
                      className={`${btnGray} px-3 py-2`}
                    >
                      ➤
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ===== Room Actions ===== */}
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
