/**
 * LoadingPage - 전체 화면 로딩 스피너
 *
 * [React 기초 - 컴포넌트]
 * - React 컴포넌트는 UI를 반환하는 함수이다
 * - props가 없는 가장 단순한 형태의 컴포넌트 예시
 * - export default로 내보내면 다른 파일에서 import해서 사용 가능
 *
 * [사용된 기술]
 * - Tailwind CSS: 클래스명으로 스타일 적용 (animate-spin으로 회전 애니메이션)
 * - aria-busy, aria-live: 스크린 리더 접근성 속성
 */
export default function LoadingPage() {
  return (
    <div
      className="flex items-center justify-center h-screen bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">앱을 준비하고 있어요...</p>
      </div>
    </div>
  );
}
