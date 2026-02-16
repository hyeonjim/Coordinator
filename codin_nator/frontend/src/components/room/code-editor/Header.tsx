/**
 * CodeEditorHeader - 에디터 상단 헤더 (파일명, 폰트 크기 조절, AI 액션)
 *
 * [React 기초 - Props 구조분해]
 * - 중첩된 객체 props도 구조분해할당으로 꺼내 쓸 수 있다
 * - fontSizeProps 안에서 다시 { fontSize, onIncrease, ... }를 꺼냄
 *
 * [React 기초 - 이벤트 핸들링]
 * - onClick={onDecrease}: 버튼 클릭 시 부모에서 전달받은 함수 호출
 * - disabled={fontSize <= minFontSize}: 조건에 따라 버튼 비활성화
 *
 * [사용된 기술]
 * - 스프레드 연산자: {...aiActionsProps}로 props를 한번에 전달
 */
import type { CodeEditorHeaderProps } from "@/types/editor";
import AiActions from "@/components/ai/CodeEditorAi";

export default function CodeEditorHeader({
  fileName, // 현재 열린 파일 이름
  fontSizeProps, // 폰트 크기 관련 props 묶음
  aiActionsProps, // AI 기능 관련 props 묶음
}: CodeEditorHeaderProps) {
  // 중첩된 props 객체에서 필요한 값을 구조분해할당으로 추출
  const {
    fontSize, // 현재 폰트 크기 (px)
    minFontSize, // 최소 폰트 크기
    maxFontSize, // 최대 폰트 크기
    onIncrease, // 폰트 크기 증가 함수
    onDecrease, // 폰트 크기 감소 함수
    onReset, // 기본 크기로 리셋 함수
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
