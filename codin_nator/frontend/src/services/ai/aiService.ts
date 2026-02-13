import axiosInstance from "@/api/axios";
import type {
  GenerateTestCodeRequest,
  GenerateTestCodeResponse,
  AnalyzeResultRequest,
  RunGeneratedTestRequest,
  TestReportResponse,
} from "@/types/ai/types";

const API_ENDPOINTS = {
  GENERATE_TEST_CODE: "/v1/room/generate-testcode",
  ANALYZE_RESULT: "/v1/room/analyze-result",
  MY_REPORTS: "/v1/room/reports/me",
  CODE_RUN: (roomId: number) => `/v1/room/${roomId}/code-run`,
} as const;

export const aiService = {
  /**
   * 테스트 코드 생성
   */
  async generateTestCode(
    roomId: number,
    fileName: string,
    code: string,
  ): Promise<GenerateTestCodeResponse> {
    const request: GenerateTestCodeRequest = { roomId, fileName, code };
    const { data } = await axiosInstance.post<GenerateTestCodeResponse>(
      API_ENDPOINTS.GENERATE_TEST_CODE,
      request,
    );
    return data;
  },

  /**
   * 테스트 결과 분석
   * - 성공 시: 204 → null 반환
   */
  async analyzeResult(
    roomId: number,
    fileName: string,
    runOutput: string,
  ): Promise<TestReportResponse | null> {
    const request: AnalyzeResultRequest = { roomId, fileName, runOutput };
    const response = await axiosInstance.post<TestReportResponse>(
      API_ENDPOINTS.ANALYZE_RESULT,
      request,
      {
        validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
      },
    );

    return response.status === 204 ? null : response.data;
  },

  /**
   * 내 AI 보고서 목록 조회
   */
  async getMyReports(): Promise<TestReportResponse[]> {
    const { data } = await axiosInstance.get<TestReportResponse[]>(API_ENDPOINTS.MY_REPORTS);
    return data;
  },

  /**
   * 테스트 실행
   * - 응답이 text 형식
   */
  async runGeneratedTest(
    roomId: number,
    testCode: string,
    packageName: string = "",
  ): Promise<string> {
    const request: RunGeneratedTestRequest = { testCode, packageName };
    const { data } = await axiosInstance.post<string>(
      API_ENDPOINTS.CODE_RUN(roomId),
      request,
      { responseType: "text" },
    );
    return data;
  },
};
