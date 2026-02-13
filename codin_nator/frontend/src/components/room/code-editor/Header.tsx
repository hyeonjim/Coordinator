import type { CodeEditorHeaderProps } from "@/types/room/editor/types";
import AiActions from "@/components/ai/CodeEditorAi";

export default function CodeEditorHeader({
  fileName,
  fontSizeProps,
  aiActionsProps,
}: CodeEditorHeaderProps) {
  const { fontSize, minFontSize, maxFontSize, onIncrease, onDecrease, onReset } = fontSizeProps;

  return (
    <div className="code-editor-header flex items-center gap-2 px-6 py-1 shrink-0">
      {/* 파일명 */}
      <div className="flex items-center flex-1 min-w-0">
        <span className="text-[14px] truncate">{fileName ?? "파일을 선택하세요"}</span>
      </div>

      {/* 폰트 크기 조절 */}
      <div className="font-size-control flex items-center gap-1">
        <span className="text-[12px] min-w-6 text-right">{fontSize}px</span>
        <button
          onClick={onDecrease}
          disabled={fontSize <= minFontSize}
          className="text-[11px] font-bold disabled:opacity-40"
          title="폰트 크기 축소 (Ctrl + -)"
        >
          −
        </button>
        <button
          onClick={onReset}
          className="text-[10px]"
          title="기본 크기로 재설정"
        >
          R
        </button>
        <button
          onClick={onIncrease}
          disabled={fontSize >= maxFontSize}
          className="text-[11px] font-bold disabled:opacity-40"
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
