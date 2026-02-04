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
    <header className="h-10 bg-slate-700 flex items-center justify-between px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center">
        <div className="h-8 px-4 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">Logo</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* ===== Share ===== */}
        <div className="relative">
          <button
            onClick={() => {
              setShowShare((v) => !v);
              setShowCommit(false);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-600 transition text-white"
          >
            🔗
          </button>

          {showShare && (
            <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 z-50">
              <p className="text-xs text-slate-400 mb-1">공유 링크</p>

              <div className="flex items-center gap-2">
                <input
                  value={shareLink}
                  readOnly
                  className="flex-1 px-2 py-1 rounded-md bg-slate-600 text-xs text-slate-200 border border-slate-600 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md bg-green-700 hover:bg-green-600 text-white text-xs transition"
                >
                  {copied ? "✔" : "Copy"}
                </button>
              </div>

              {copied && (
                <span className="text-green-400 text-xs mt-1 block">
                  링크가 복사되었습니다!
                </span>
              )}
            </div>
          )}
        </div>

        {/* ===== Git Buttons ===== */}
        <div className="flex items-center gap-1 relative">
          {gitActions.map(({ id, label }) => (
            <div key={id} className="relative">
              <button
                onClick={() => handleGitAction(id)}
                className="
                  px-3 py-1.5 text-xs font-medium
                  rounded-full
                  text-slate-300
                  border border-slate-600
                  bg-slate-600
                  hover:bg-slate-500 hover:text-white
                  transition
                "
              >
                {label}
              </button>

              {id === "commit" && showCommit && (
                <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 z-50">
                  <p className="text-xs text-slate-400 mb-1">Commit message</p>

                  <div className="flex items-center gap-2">
                    <input
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder="커밋 메시지를 입력하세요"
                      className="flex-1 px-2 py-1 rounded-md bg-slate-600 text-xs text-slate-200 border border-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={handleCommitSend}
                      className="px-2 py-1 rounded-md bg-blue-700 hover:bg-blue-600 text-white text-xs transition"
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
          <button
            onClick={onLeave}
            className="px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold"
          >
            방 나가기
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="px-2 py-1 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            참여하기
          </button>
        )}
      </div>
    </header>
  );
}
