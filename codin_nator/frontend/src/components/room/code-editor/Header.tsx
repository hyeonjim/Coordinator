import type { CodeEditorHeaderProps } from "@/types/room/editor/types";
import AiActions from "@/components/ai/CodeEditorAi";

export default function CodeEditorHeader({
  fileName,
  fontSizeProps,
  aiActionsProps,
}: CodeEditorHeaderProps) {
  const {
    fontSize,
    minFontSize,
    maxFontSize,
    onIncrease,
    onDecrease,
    onReset,
  } = fontSizeProps;

  return (
    <div className="code-editor-header flex items-center gap-2 px-6 py-1 shrink-0 bg-(--rc-code-header-bg) border-b border-(--rc-code-header-border) text-(--rc-code-text)">
      {/* 파일명 */}
      <div className="flex items-center flex-1 min-w-0">
        <span className="text-[14px] truncate">
          {fileName ?? "파일을 선택하세요"}
        </span>
      </div>

      {/* 폰트 크기 조절 */}
      <div className="flex items-center gap-1 px-2 py-1 rounded bg-(--rc-font-ctrl-bg) border border-(--rc-font-ctrl-border)">
        <span className="text-[12px] min-w-6 text-right text-(--rc-font-ctrl-text)">{fontSize}px</span>
        <button
          onClick={onDecrease}
          disabled={fontSize <= minFontSize}
          className="px-1.5 py-0.5 rounded transition-colors text-[11px] font-bold text-(--rc-font-ctrl-btn) hover:bg-(--rc-font-ctrl-btn-hover) disabled:opacity-30 disabled:cursor-not-allowed"
          title="폰트 크기 축소 (Ctrl + -)"
        >
          −
        </button>
        <button
          onClick={onReset}
          className="px-1.5 py-0.5 rounded transition-colors text-[10px] text-(--rc-font-ctrl-btn) hover:bg-(--rc-font-ctrl-btn-hover)"
          title="기본 크기로 재설정"
        >
          R
        </button>
        <button
          onClick={onIncrease}
          disabled={fontSize >= maxFontSize}
          className="px-1.5 py-0.5 rounded transition-colors text-[11px] font-bold text-(--rc-font-ctrl-btn) hover:bg-(--rc-font-ctrl-btn-hover) disabled:opacity-30 disabled:cursor-not-allowed"
          title="폰트 크기 확대 (Ctrl + +)"
        >
          +
        </button>
      </div>

      {/* AI 액션 버튼 */}
      <AiActions {...aiActionsProps} />
    </div>
  );
}
