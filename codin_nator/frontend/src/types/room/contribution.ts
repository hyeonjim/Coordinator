/**
 * Contribution (잔디) 관련 타입 정의
 * - 에러 로그 및 컨트리뷰션 그래프 데이터 구조
 */

/**
 * 에러 로그 기본 정보
 */
export interface ErrorLog {
  /** 로그 고유 ID */
  id: string;

  /** 방 번호 (없으면 "unknown") */
  roomId?: string;

  /** 발생 시간 "HH:mm" 형식 */
  time: string;

  /** 표시될 에러 이름 */
  display_name: string;

  /** 에러 내용 */
  error: string;

  /** 스택 트레이스 */
  stacktrace: string;

  /** 해결 방법 */
  resolution: string;
}

/**
 * 날짜 정보가 포함된 저장용 로그
 */
export interface StoredLog extends ErrorLog {
  /** 발생 날짜 "YYYY-MM-DD" 형식 */
  date: string;
}

/**
 * 컨트리뷰션 그래프 데이터 구조
 * - key: "YYYY-MM-DD" 형식의 날짜
 * - value: 해당 날짜의 로그 카운트 및 로그 배열
 */
export type ContributionData = Record<
  string,
  {
    count: number;
    logs: ErrorLog[];
  }
>;

/**
 * ContributionGraph 컴포넌트 Props
 */
export interface ContributionGraphProps {
  /** 컨트리뷰션 데이터 (MyPage에서 주입) */
  data?: ContributionData;
}

/**
 * 로그 추가 시 사용되는 입력 타입
 */
export interface AppendLogInput {
  /** 표시될 에러 이름 */
  display_name: string;

  /** 에러 내용 */
  error: string;

  /** 해결 방법 */
  resolution: string;

  /** 스택 트레이스 (선택) */
  stacktrace?: string;

  /** 발생 날짜 (미지정 시 현재 날짜) */
  date?: string;

  /** 발생 시간 (미지정 시 현재 시간) */
  time?: string;

  /** 방 번호 (선택) */
  roomId?: string;
}

/**
 * 컨트리뷰션 업데이트 커스텀 이벤트 타입
 */
export const CONTRIB_UPDATED_EVENT = "codinnator:contribution-updated" as const;
