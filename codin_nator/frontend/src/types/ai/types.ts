/**
 * AI 기능 관련 타입 정의
 */

/**
 * AI 생성 테스트 코드
 */
export interface AITestCode {
  fileName: string;
  testCode: string;
  timestamp: string;
}

/**
 * AI 분석 보고서
 */
export interface AIReport {
  id: number;
  roomId: number;
  fileName: string;
  timestamp: string;
  display_name: string;
  error: string;
  resolution: string;
  stacktrace: string;
}

/**
 * AI 상태
 */
export interface AIState {
  /** 현재 생성된 테스트 코드 */
  currentTestCode: AITestCode | null;
  /** 현재 분석 보고서 */
  currentReport: AIReport | null;
  /** AI 작업 진행 중 여부 */
  isGenerating: boolean;
  /** AI 분석 진행 중 여부 */
  isAnalyzing: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * localStorage에 저장되는 보고서 타입
 */
export interface SavedReport {
  id: number;
  roomId: number;
  timestamp: string;
  display_name: string;
  error: string;
  resolution: string;
  stacktrace: string;
}

export type CodeEditorActionsProps = {
  roomId: number;
  fileName?: string;
  code: string;

  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;

  // 📏 폰트 크기 조정 props
  fontSize?: number;
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
  onResetFontSize?: () => void;
  minFontSize?: number;
  maxFontSize?: number;
};
