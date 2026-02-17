/**
 * @file ai.ts - AI 서비스 관련 타입 정의
 *
 * AI 기반 테스트 코드 생성, 테스트 실행, 결과 분석 기능의 타입을 정의합니다.
 *
 * AI 기능 흐름:
 * 1. 코드 에디터에서 "테스트 생성" 버튼 클릭
 * 2. GenerateTestCodeRequest로 백엔드 AI API 호출
 * 3. AI가 테스트 코드를 생성하여 GenerateTestCodeResponse로 응답
 * 4. 생성된 테스트 코드를 RunGeneratedTestRequest로 실행 요청
 * 5. 실행 결과를 AnalyzeResultRequest로 AI에게 분석 요청
 * 6. 분석 결과(에러 원인, 해결 방안)를 TestReportResponse로 저장
 */

// AI 리포트

/**
 * AI 테스트 분석 리포트 응답
 *
 * 테스트 실행 후 AI가 분석한 에러 정보를 백엔드 DB에 저장한 결과입니다.
 * 홈 화면의 에러 잔디(Contribution Graph)에 사용됩니다.
 */
export interface TestReportResponse {
  /** 리포트 고유 ID */
  id: number;

  /** 방 ID */
  roomId: number;

  /** 리포트 생성 시각 (ISO 8601 형식) */
  timestamp: string;

  /** 에러 스택트레이스 전문 */
  stacktrace: string;

  /** 에러가 발생한 테스트/메서드 이름 */
  display_name: string;

  /** 에러 메시지 요약 */
  error: string;

  /** AI가 제안한 해결 방안 */
  resolution: string;
}

// 테스트 코드 생성

/**
 * 테스트 코드 생성 요청
 *
 * 현재 편집 중인 코드를 AI에게 전달하여 테스트 코드를 자동 생성합니다.
 */
export interface GenerateTestCodeRequest {
  /** 방 ID */
  roomId: number;

  /** 파일명 (예: "UserService.java") */
  fileName: string;

  /** 테스트 대상 소스 코드 */
  code: string;
}

/**
 * 테스트 코드 생성 응답
 *
 * AI가 생성한 JUnit 등의 테스트 코드를 담고 있습니다.
 */
export interface GenerateTestCodeResponse {
  /** AI가 생성한 테스트 코드 문자열 */
  testCode: string;
}

// 테스트 결과 분석

/**
 * 테스트 결과 분석 요청
 *
 * 테스트 실행 출력을 AI에게 전달하여 에러 원인과 해결 방안을 분석합니다.
 */
export interface AnalyzeResultRequest {
  /** 방 ID */
  roomId: number;

  /** 테스트 대상 파일명 */
  fileName: string;

  /** 테스트 실행 출력 (stdout + stderr) */
  runOutput: string;
}

// 테스트 실행

/**
 * 생성된 테스트 코드 실행 요청
 *
 * AI가 생성한 테스트 코드를 백엔드의 격리 환경에서 실행합니다.
 */
export interface RunGeneratedTestRequest {
  /** 실행할 테스트 코드 */
  testCode: string;

  /** Java 패키지 이름 (예: "com.example.service") */
  packageName: string;
}

// AI 기능 컴포넌트 Props

/**
 * AI 액션 버튼 영역 Props
 *
 * 코드 에디터 헤더에 위치하며,
 * "테스트 생성", "테스트 실행", "결과 분석" 등의 AI 기능 버튼을 포함합니다.
 */
export interface AiActionsProps {
  /** 현재 방 ID */
  roomId: number;

  /** 현재 파일명 */
  fileName?: string;

  /** 현재 에디터의 코드 */
  code: string;

  /** 테스트 코드 생성 완료 시 콜백 */
  onTestGenerated?: (testCode: string) => void;

  /** 터미널에 출력을 추가하는 콜백 */
  onAppendTerminal?: (title: string, text: string) => void;
}
