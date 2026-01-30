import { useState } from "react";

interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

const gitActions = [
  { id: "add", label: "Add" },
  { id: "commit", label: "Commit" },
  { id: "push", label: "Push" },
];

export default function Header({ isJoined, onJoin, onLeave }: HeaderProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showCommit, setShowCommit] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");

  // 현재 URL 기반 공유 링크
  const shareLink = window.location.href;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const handleGitAction = (action: string) => {
    if (action === "commit") {
      setShowCommit((v) => !v);
      setShowShare(false);
      return;
    }
    console.log("Git:", action);
    // 나중에 WS / API 연결
  };

  const handleCommitSend = () => {
    if (!commitMsg.trim()) return;

    console.log("Commit message:", commitMsg);

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
      <div className="flex items-center gap-2 ">
        {/* ===== Share 버튼 ===== */}
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

          {/* ===== 공유 패널 ===== */}
          {showShare && (
            <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 z-50 animate-fade-in">
              <p className="text-xs text-slate-400 mb-1">공유 링크</p>

              <div className="flex items-center gap-2">
                <input
                  value={shareLink}
                  readOnly
                  className="flex-1 px-2 py-1 rounded-md bg-slate-600 text-xs text-slate-200 border border-slate-600 focus:outline-none"
                />

                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md bg-green-700 hover:bg-gray-700 hover:border-slate-600 text-white text-xs transition border border-green-700"
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
        {/* Git 버튼 */}
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

              {/* ===== Commit 패널 ===== */}
              {id === "commit" && showCommit && (
                <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 z-50 animate-fade-in">
                  <p className="text-xs text-slate-400 mb-1">Commit message</p>

                  <div className="flex items-center gap-2">
                    <input
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder="커밋 메시지를 입력하세요"
                      className="
                        flex-1 px-2 py-1 rounded-md
                        bg-slate-600 text-xs text-slate-200
                        border border-slate-600
                        focus:outline-none
                      "
                    />

                    <button
                      onClick={handleCommitSend}
                      className="
                        px-2 py-1 rounded-md
                        bg-blue-700 hover:bg-gray-700
                        text-white text-xs transition
                        border border-blue-700 hover:border-gray-700
                      "
                    >
                      ➤
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Room Actions */}
        {isJoined ? (
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 text-sm font-semibold"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            방 나가기
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            참여하기
          </button>
        )}
      </div>
    </header>
  );
}
