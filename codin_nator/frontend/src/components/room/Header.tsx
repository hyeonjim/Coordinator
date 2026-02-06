import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";

interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
  selectedFileId: number | null;
  editorContent: string;
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
}: HeaderProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");

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
    "inline-flex items-center justify-center rounded-full px-2.5 py-1.5 mt-4 mb-4 text-xs font-semibold " +
    "transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#d2d7db]/60";

  // 기본(회색 #d2d7db)
  const btnGray = `${btnBase} bg-[#7F99B2] text-[#2C4156] hover:bg-[#c5cbd0]`;

  // 강조(참여하기 같은 primary 느낌을 주고 싶으면 톤만 살짝 다르게)
  // 색 고정 요청이 "#d2d7db"라서, 같은 계열로만 대비 줌
  const btnGrayStrong = `${btnBase} bg-[#d2d7db] text-[#98A1AA] hover:bg-[#bfc6cc]`;

  const handleGitAction = (action: string) => {
    if (!selectedFileId) {
      alert("파일을 먼저 선택해주세요.");
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
          console.log("Files added to staging area.");
        })
        .catch((error) => {
          console.error("Error adding files:", error);
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
          console.log("Pushed to remote repository.");
        })
        .catch((error) => {
          console.error("Error during push:", error);
        });
      return;
    }

    console.log("Git:", action);
  };

  const handleCommitSend = () => {
    if (!commitMsg.trim()) return;
    axios
      .post(
        `/api/v1/room/git/${roomId}/commit`,
        { message: commitMsg },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      .then(() => {
        console.log("Commit successful.");
      })
      .catch((error) => {
        console.error("Error during commit:", error);
      });

    setCommitMsg("");
    setShowCommit(false);
  };

  return (
    <header className="room-header">
      {/* Logo */}
      <div className="flex items-center">
        <div className="room-header-logo">
          <img
            src="/src/assets/images/logo2.png"
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
              <p className="text-xs text-[#98A1AA] mb-2">공유 링크</p>

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
                <span className="text-[#39586D] text-xs mt-2 block font-semibold">
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
                className={btnGray}
              >
                {label}
              </button>

              {id === "commit" && showCommit && (
                <div className="room-dropdown">
                  <p className="text-xs text-[#98A1AA] mb-2">Commit message</p>

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
          <button onClick={onLeave} className={btnGray}>
            방 나가기
          </button>
        ) : (
          <button
            onClick={onJoin}
            // 참여하기도 같은 색(#d2d7db) 기반으로 통일 (살짝만 강조)
            className={btnGrayStrong}
          >
            참여하기
          </button>
        )}
      </div>
    </header>
  );
}
