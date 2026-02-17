/**
 * @file home.ts - 홈 페이지 관련 타입 정의
 *
 * 로그인 후 표시되는 홈(대시보드) 페이지의 타입을 정의합니다.
 * 방 생성 모달, 에러 통계, 에러 잔디(Contribution Graph) 등에 사용됩니다.
 * Alert 공통 컴포넌트 Props도 포함합니다.
 *
 * 중복 제거:
 * - ErrorLog, ContributionData는 기존에 user/types.ts와 home/contribution.ts에
 *   중복 정의되어 있었습니다. 이 파일에서 단일 정의로 통합합니다.
 *
 * 통합 출처:
 * - types/home/types.ts (CreateRoomModalProps, CreateRoomRequest, Stats)
 * - types/home/contribution.ts (ErrorLog, ContributionData, ContributionGraphProps)
 * - types/user/types.ts에서 중복된 ErrorLog, ContributionData 제거
 */

import type { ReactNode } from "react";

/**
 * Alert 다이얼로그 컴포넌트 Props
 *
 * 사용자에게 확인/경고 메시지를 보여주는 모달 다이얼로그입니다.
 * open 상태를 부모 컴포넌트에서 제어하는 "제어 컴포넌트(Controlled Component)" 패턴을 사용합니다.
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 방 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 방 생성 모달 컴포넌트 Props
 */
export interface CreateRoomModalProps {
  /** 모달 닫기 핸들러 */
  onClose: () => void;
}

/**
 * 방 생성 API 요청 바디
 *
 * POST /api/rooms 엔드포인트에 전송하는 데이터입니다.
 */
export interface CreateRoomRequest {
  /** 방 이름 */
  name: string;

  /** Git 브랜치 이름 (이 브랜치 기반으로 코딩 세션 진행) */
  branch: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 에러 통계
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 에러 통계 수치
 *
 * 홈 대시보드 상단에 표시되는 요약 통계입니다.
 */
export interface Stats {
  /** 총 에러 발생 수 */
  totalErrors: number;

  /** 에러가 발생한 일 수 */
  daysWithErrors: number;

  /** 일 평균 에러 수 (소수점 문자열) */
  avgErrorsPerDay: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 에러 잔디 (Contribution Graph)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 에러 로그 항목
 *
 * AI 테스트 분석에서 발견된 개별 에러 정보입니다.
 * 에러 잔디를 클릭하면 해당 날짜의 에러 로그 목록이 표시됩니다.
 *
 * 주의: 기존에 user/types.ts와 home/contribution.ts에 중복 정의되어 있었으나
 * 이 파일에서 단일 정의로 통합되었습니다.
 */
export interface ErrorLog {
  /** 에러 로그 고유 ID */
  id: string;

  /** 에러가 발생한 방 ID (선택적 - 전체 통계에서는 없을 수 있음) */
  roomId?: string;

  /** 에러 발생 시각 */
  time: string;

  /** 에러가 발생한 테스트/메서드 이름 */
  display_name: string;

  /** 에러 메시지 */
  error: string;

  /** 스택트레이스 전문 */
  stacktrace: string;

  /** AI가 제안한 해결 방안 */
  resolution: string;
}

/**
 * 에러 잔디(Contribution) 데이터
 *
 * GitHub의 잔디(contribution graph)와 유사한 형태로
 * 날짜별 에러 발생 횟수와 상세 로그를 담습니다.
 *
 * Record<K, V> 유틸리티 타입을 사용하여
 * 날짜 문자열을 키로, 에러 정보를 값으로 하는 객체 타입을 정의합니다.
 *
 * @example
 * ```ts
 * const data: ContributionData = {
 *   "2025-01-15": { count: 3, logs: [...] },
 *   "2025-01-16": { count: 1, logs: [...] },
 * };
 * ```
 */
export type ContributionData = Record<
  string,
  {
    /** 해당 날짜의 에러 발생 횟수 */
    count: number;
    /** 해당 날짜의 에러 로그 목록 */
    logs: ErrorLog[];
  }
>;

/**
 * ContributionGraph 컴포넌트 Props
 *
 * 에러 발생 빈도를 잔디(히트맵) 형태로 시각화하는 컴포넌트입니다.
 * 에러가 많은 날일수록 진한 색으로 표시됩니다.
 */
export interface ContributionGraphProps {
  /** 날짜별 에러 데이터 */
  data?: ContributionData;

  /** 방 필터 옵션 목록 (특정 방의 에러만 필터링) */
  roomOptions?: string[];
}
