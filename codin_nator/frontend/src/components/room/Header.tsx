import { useState } from "react";

interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export default function Header({ isJoined, onJoin, onLeave }: HeaderProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // 현재 URL 기반 공유 링크
  const shareLink = window.location.href;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
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
            onClick={() => setShowShare((v) => !v)}
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
        <div className="flex items-center gap-3 mr-4 border-slate-200">
          {["add", "commit", "push"].map((action) => (
            <button
              key={action}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-green-200 rounded-md transition-colors bg-gray-200"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Room Actions */}
        {isJoined ? (
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 text-sm font-semibold"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold shadow-sm"
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
