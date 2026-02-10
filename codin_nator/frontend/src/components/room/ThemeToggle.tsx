interface ThemeToggleProps {
  isLight: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isLight, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      title={isLight ? "다크 모드로 전환" : "라이트 모드로 전환"}
      className="room-theme-toggle-btn"
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
}
