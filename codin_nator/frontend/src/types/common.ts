/**
 * @file common.ts - 공통 UI 컴포넌트 타입 정의
 *
 * 여러 페이지에서 재사용되는 공통 컴포넌트의 Props 타입을 정의합니다.
 *
 * 통합 출처:
 * - types/common/types.ts (AlertProps)
 */

import type { ReactNode } from "react";

// ─── Alert 다이얼로그 ────────────────────────────────────────────────────────

/**
 * Alert 다이얼로그 컴포넌트 Props
 *
 * 사용자에게 확인/경고 메시지를 보여주는 모달 다이얼로그입니다.
 * open 상태를 부모 컴포넌트에서 제어하는 "제어 컴포넌트(Controlled Component)" 패턴을 사용합니다.
 *
 * @example
 * ```tsx
 * <Alert open={isOpen} title="삭제 확인" onConfirm={handleDelete}>
 *   정말 삭제하시겠습니까?
 * </Alert>
 * ```
 */
export interface AlertProps {
  /** 다이얼로그 표시 여부 (true이면 표시) */
  open: boolean;

  /** 다이얼로그 제목 (선택적) */
  title?: string;

  /** 다이얼로그 본문 내용 (React children) */
  children: ReactNode;

  /** 확인 버튼 클릭 시 실행되는 콜백 */
  onConfirm: () => void;
}
