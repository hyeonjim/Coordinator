/**
 * AI API 서비스 (aiService.ts)
 *
 * [역할]
 * - AI 기반 테스트 코드 생성, 결과 분석, 실행 등의 API 호출 담당
 * - 백엔드의 AI 기능(OpenAI 등)을 프론트엔드에서 사용하기 위한 인터페이스
 *
 * [핵심 개념: responseType]
 * - axios 요청 시 서버 응답의 형식을 지정하는 옵션
 * - "json" (기본값): 응답을 JSON 객체로 파싱
 * - "text": 응답을 문자열 그대로 반환 (HTML, 로그 등)
 * - "blob": 바이너리 데이터 (파일 다운로드 등)
 *
 * [핵심 개념: validateStatus]
 * - axios는 기본적으로 2xx 외의 상태 코드를 에러로 처리함
 * - validateStatus 옵션으로 "어떤 상태 코드를 성공으로 간주할지" 커스터마이징 가능
 * - 예: 204(No Content)를 에러가 아닌 정상 응답으로 처리하고 싶을 때 사용
 *
 * [핵심 개념: 제네릭 타입 <T>]
 * - axiosInstance.post<T>()에서 T는 "응답 데이터의 타입"을 지정
 * - TypeScript가 response.data의 타입을 자동으로 추론해줌
 */

import axiosInstance from "@/services/api/axios";
import { AI_ENDPOINTS } from "@/services/api/endpoints";
import type {
  GenerateTestCodeRequest,
  GenerateTestCodeResponse,
  AnalyzeResultRequest,
  RunGeneratedTestRequest,
  TestReportResponse,
} from "@/types/ai";

export const aiService = {
  /**
   * 테스트 코드 생성 API
   * - 사용자가 작성한 코드를 AI에게 보내 테스트 코드를 자동 생성
   *
   * @param roomId - 현재 방 ID
   * @param fileName - 테스트 대상 파일명
   * @param code - 테스트 대상 소스 코드
   * @returns AI가 생성한 테스트 코드 응답
   */
  async generateTestCode(
    roomId: number,
    fileName: string,
    code: string,
  ): Promise<GenerateTestCodeResponse> {
    // 요청 본문(body) 객체 생성 → 서버가 기대하는 형식에 맞춤
    const request: GenerateTestCodeRequest = { roomId, fileName, code };
    const { data } = await axiosInstance.post<GenerateTestCodeResponse>(
      AI_ENDPOINTS.GENERATE_TEST_CODE,
      request,
    );
    return data;
  },

  /**
   * 테스트 결과 분석 API
   * - 테스트 실행 결과를 AI에게 보내 분석 리포트를 생성
   * - 204 응답: 분석할 내용이 없음 → null 반환
   *
   * @param roomId - 현재 방 ID
   * @param fileName - 분석 대상 파일명
   * @param runOutput - 테스트 실행 출력 결과
   * @returns 분석 리포트 또는 null (204일 때)
   */
  async analyzeResult(
    roomId: number,
    fileName: string,
    runOutput: string,
  ): Promise<TestReportResponse | null> {
    const request: AnalyzeResultRequest = { roomId, fileName, runOutput };

    // validateStatus: 204도 정상 응답으로 처리 (기본은 2xx만 성공)
    const response = await axiosInstance.post<TestReportResponse>(
      AI_ENDPOINTS.ANALYZE_RESULT,
      request,
      {
        validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
      },
    );

    // 삼항 연산자로 204이면 null, 아니면 데이터 반환
    return response.status === 204 ? null : response.data;
  },

  /**
   * 내 AI 보고서 목록 조회
   * - 현재 로그인한 사용자의 AI 분석 리포트 전체 목록을 가져옴
   *
   * @returns 리포트 배열
   */
  async getMyReports(): Promise<TestReportResponse[]> {
    const { data } = await axiosInstance.get<TestReportResponse[]>(AI_ENDPOINTS.MY_REPORTS);
    return data;
  },

  /**
   * 생성된 테스트 코드 실행 API
   * - AI가 생성한 테스트 코드를 서버에서 실행하고 결과를 텍스트로 받음
   *
   * [responseType: "text"]
   * - 서버가 실행 결과를 순수 텍스트(로그)로 반환하므로 text 타입 지정
   * - JSON이 아닌 응답을 받을 때 반드시 지정해야 파싱 에러를 방지
   *
   * @param roomId - 현재 방 ID
   * @param testCode - 실행할 테스트 코드
   * @param packageName - 패키지명 (기본값: 빈 문자열)
   * @returns 테스트 실행 출력 텍스트
   */
  async runGeneratedTest(
    roomId: number,
    testCode: string,
    packageName: string = "",
  ): Promise<string> {
    const request: RunGeneratedTestRequest = { testCode, packageName };
    const { data } = await axiosInstance.post<string>(
      AI_ENDPOINTS.CODE_RUN(roomId),
      request,
      { responseType: "text" },
    );
    return data;
  },
};
