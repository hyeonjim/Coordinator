interface HeaderProps {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export default function Header({ isJoined, onJoin, onLeave }: HeaderProps) {
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
