type Theme = "dark" | "light" | "light2";

interface ThemeToggleProps {
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
}

const THEME_META: Record<Theme, { icon: string; label: string; next: Theme }> =
  {
    dark: { icon: "☀️", label: "라이트1로 전환", next: "light" },
    light: { icon: "🌸", label: "라이트2로 전환", next: "light2" },
    light2: { icon: "🌙", label: "다크로 전환", next: "dark" },
  };

export default function ThemeToggle({ theme, onSetTheme }: ThemeToggleProps) {
  const { icon, label, next } = THEME_META[theme];

  return (
    <button
      onClick={() => onSetTheme(next)}
      title={label}
      className="room-theme-toggle-btn"
    >
      {icon}
    </button>
  );
}
