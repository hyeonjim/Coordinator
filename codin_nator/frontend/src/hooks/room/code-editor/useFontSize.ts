import { useState, useCallback, useMemo } from "react";

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;

export function useFontSize(currentCode: string) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

  // 줄 수에 따라 줄번호 너비 동적 계산
  const lineNumberWidth = useMemo(() => {
    const digits = Math.max(String(currentCode.split("\n").length).length, 2);
    return digits * fontSize * 0.65 + 16;
  }, [currentCode, fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize((previous) => Math.min(previous + 2, MAX_FONT_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((previous) => Math.max(previous - 2, MIN_FONT_SIZE));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE);
  }, []);

  // Ctrl/Cmd + +/-/0 단축키 처리, 이벤트 처리 시 true 반환
  const handleFontSizeKeyDown = useCallback(
    (event: React.KeyboardEvent): boolean => {
      if (!event.ctrlKey && !event.metaKey) return false;

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        increaseFontSize();
        return true;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        decreaseFontSize();
        return true;
      }
      if (event.key === "0") {
        event.preventDefault();
        resetFontSize();
        return true;
      }
      return false;
    },
    [increaseFontSize, decreaseFontSize, resetFontSize],
  );

  return {
    fontSize,
    lineNumberWidth,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    handleFontSizeKeyDown,
  };
}
