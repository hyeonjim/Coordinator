/**
 * AI 서비스 API 클라이언트
 * 백엔드를 통해 AI 서버와 통신합니다.
 *
 * ✅ Vite Proxy 사용 (vite.config.ts)
 * - "/api" → "http://i14e205.p.ssafy.io:8081"
 */

// ========================================
// ✅ Vite Proxy 사용 - 상대 경로!
// ========================================
const API_BASE = "/api/v1/room";

console.log("[aiService] API_BASE:", API_BASE);
console.log("[aiService] Vite Proxy 사용 - 상대 경로로 요청");
const accessToken = localStorage.getItem("access_token");
/**
 * AI 서비스 응답 타입
 */
export interface GenerateTestCodeResponse {
  roomId: number;
  fileName: string;
  testCode: string;
}

export interface AnalyzeResultResponse {
  display_name: string;
  error: string;
  resolution: string;
}

/**
 * AI 서비스 클라이언트
 */
export const aiService = {
  /**
   * 테스트 코드 생성
   * @param roomId - 방 ID
   * @param fileName - 파일 이름
   * @param code - 소스 코드
   */
  async generateTestCode(
    roomId: number,
    fileName: string,
    code: string,
  ): Promise<GenerateTestCodeResponse> {
    const url = `${API_BASE}/generate-testcode`;

    console.log("[aiService] 테스트 생성 요청:", url);
    console.log("  - roomId:", roomId);
    console.log("  - fileName:", fileName);
    console.log("  - code length:", code.length);
    console.log(
      "  - Vite proxy가 다음으로 변환:",
      `http://i14e205.p.ssafy.io:8081${url}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ roomId, fileName, code }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[aiService] 테스트 생성 실패:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`테스트 코드 생성 실패: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[aiService] 테스트 생성 성공:", {
      fileName: data.fileName,
      testCodeLength: data.testCode?.length,
    });

    return data;
  },

  /**
   * 테스트 결과 분석
   * @param roomId - 방 ID
   * @param fileName - 파일 이름
   * @param runOutput - 테스트 실행 결과
   */
  async analyzeResult(
    roomId: number,
    fileName: string,
    runOutput: string,
  ): Promise<AnalyzeResultResponse> {
    const url = `${API_BASE}/analyze-result`;

    console.log("[aiService] 결과 분석 요청:", url);
    console.log("  - roomId:", roomId);
    console.log("  - fileName:", fileName);
    console.log("  - runOutput length:", runOutput.length);
    console.log(
      "  - Vite proxy가 다음으로 변환:",
      `http://i14e205.p.ssafy.io:8081${url}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId, fileName, runOutput }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[aiService] 결과 분석 실패:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`결과 분석 실패: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[aiService] 결과 분석 성공:", {
      display_name: data.display_name,
    });

    return data;
  },
};
