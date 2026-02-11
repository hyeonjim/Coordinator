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

/** ✅ 백엔드 analyze-result는 실제로 이 형태로 내려옴 */
export interface TestReportResponse {
  id: number;
  roomId: number;
  timestamp: string; // LocalDateTime.toString() 형태
  stacktrace: string;
  display_name: string;
  error: string;
  resolution: string;
}
