import axiosInstance from "@/api/axios";

export const aiService = {
  /**
   * 테스트 코드 생성
   */
  async generateTestCode(roomId: number, fileName: string, code: string) {
    try {
      const { data } = await axiosInstance.post("/v1/room/generate-testcode", {
        roomId,
        fileName,
        code,
      });
      return data;
    } catch (error) {
      console.error("[aiService] generateTestCode failed", error);
      throw error;
    }
  },

  /**
   * 테스트 결과 분석
   * - 성공: 204 → null
   */
  async analyzeResult(roomId: number, fileName: string, runOutput: string) {
    try {
      const response = await axiosInstance.post(
        "/v1/room/analyze-result",
        { roomId, fileName, runOutput },
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 204,
        },
      );

      return response.status === 204 ? null : response.data;
    } catch (error) {
      console.error("[aiService] analyzeResult failed", error);
      throw error;
    }
  },

  /**
   * 내 AI 보고서 목록 조회
   */
  async getMyReports() {
    try {
      const { data } = await axiosInstance.get("/v1/room/reports/me");

      return data;
    } catch (error) {
      console.error("[aiService] getMyReports failed", error);
      throw error;
    }
  },

  /**
   * 테스트 실행
   * - 응답이 text
   */
  async runGeneratedTest(
    roomId: number,
    testCode: string,
    packageName: string = "",
  ) {
    try {
      const { data } = await axiosInstance.post(
        `/v1/room/${roomId}/code-run`,
        { testCode, packageName },
        { responseType: "text" },
      );

      return data;
    } catch (error) {
      console.error("[aiService] runGeneratedTest failed", error);
      throw error;
    }
  },
};
