// AI 리포트 응답
export interface TestReportResponse {
  id: number;
  roomId: number;
  timestamp: string;
  stacktrace: string;
  display_name: string;
  error: string;
  resolution: string;
}

// 테스트 코드 생성 요청
export interface GenerateTestCodeRequest {
  roomId: number;
  fileName: string;
  code: string;
}

// 테스트 코드 생성 응답
export interface GenerateTestCodeResponse {
  testCode: string;
}

// 테스트 결과 분석 요청
export interface AnalyzeResultRequest {
  roomId: number;
  fileName: string;
  runOutput: string;
}

// 테스트 실행 요청
export interface RunGeneratedTestRequest {
  testCode: string;
  packageName: string;
}

// AI 테스트 기능 props
export interface AiActionsProps {
  roomId: number;
  fileName?: string;
  code: string;
  onTestGenerated?: (testCode: string) => void;
  onAppendTerminal?: (title: string, text: string) => void;
}
