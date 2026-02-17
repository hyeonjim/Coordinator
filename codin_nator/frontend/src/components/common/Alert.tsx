/**
 * Alert - 모달 형태의 알림 컴포넌트
 *
 * [React 기초 - Props]
 * - props는 부모 컴포넌트가 자식에게 전달하는 데이터이다
 * - { open, title, children, onConfirm }처럼 구조분해할당으로 받는다
 * - title = "알림"은 기본값(default value) 설정
 * - children은 특별한 prop으로, <Alert>이 안의 내용</Alert>이 children으로 전달된다
 *
 * [React 기초 - 조건부 렌더링]
 * - if (!open) return null → open이 false면 아무것도 렌더링하지 않는다
 * - 이 패턴으로 모달의 표시/숨김을 제어한다
 *
 * [사용된 기술]
 * - TypeScript의 type import로 Props 타입 정의
 * - 오버레이(bg-black/40) + 모달 카드 레이아웃
 */
import type { AlertProps } from "@/types/home";

export default function Alert({
  open, // 모달 표시 여부 (true면 보이고, false면 숨김)
  title = "알림", // 모달 제목 (기본값: "알림")
  children, // 모달 본문 내용 (JSX를 자식으로 전달)
  onConfirm, // 확인 버튼 클릭 시 실행될 콜백 함수
}: AlertProps) {
  // 조건부 렌더링: open이 false면 null을 반환하여 화면에 아무것도 표시하지 않음
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999">
      <div className="absolute inset-0 bg-black/40" />
      {/* 모달 - 상단 중앙 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="w-[320px] rounded-lg bg-[#2B2B2B] shadow-lg">
          <div className="px-4 py-3 text-sm font-semibold text-[#d2d7db]">
            {title}
          </div>
          <div className="px-4 py-4 text-sm text-[#d2d7db]">{children}</div>
          <div className="flex justify-end px-4 py-3">
            <button
              onClick={onConfirm}
              className="rounded px-4 py-1.5 text-sm font-semibold bg-[#d2d7db] text-[#2B2B2B] hover:bg-[#bfc6cc] active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
