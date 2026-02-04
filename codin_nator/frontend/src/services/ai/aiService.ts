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

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

/** ✅ TS 에러(HeadersInit) 피하려고 Headers 객체로 구성 */
function buildJsonHeaders(withAuth: boolean = true): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function readBodySmart(response: Response): Promise<{
  contentType: string;
  rawText: string;
  json: any | null;
}> {
  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();

  let json: any | null = null;
  if (contentType.includes("application/json") && rawText) {
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }
  }

  return { contentType, rawText, json };
}

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

/** ✅ 백엔드 에러(JSON) 형태 */
export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  exception?: string;
  traceId?: string;
  stacktrace?: string;
  roomId?: number;
  fileName?: string;
}

/**
 * AI 서비스 클라이언트
 */
export const aiService = {
  /**
   * 테스트 코드 생성
   */
  async generateTestCode(
    roomId: number,
    fileName: string,
    code: string,
  ): Promise<GenerateTestCodeResponse> {
    const url = `${API_BASE}/generate-testcode`;

    const response = await fetch(url, {
      method: "POST",
      headers: buildJsonHeaders(true),
      body: JSON.stringify({ roomId, fileName, code }),
    });

    if (!response.ok) {
      const { rawText, json } = await readBodySmart(response);

      console.groupCollapsed(
        `[aiService] generateTestCode ❌ ${response.status} ${response.statusText}`,
      );
      console.log("request", {
        roomId,
        fileName,
        codeLength: code?.length ?? 0,
      });
      if (json) console.log("error(json)", json);
      else console.log("error(text)", rawText);
      console.groupEnd();

      throw new Error(
        `테스트 코드 생성 실패: ${response.status} ${response.statusText}\n` +
          (json ? JSON.stringify(json, null, 2) : rawText),
      );
    }

    return await response.json();
  },

  /**
   * 테스트 결과 분석 (DB 저장 포함)
   * ✅ 실패일 때만 TestReportResponse가 내려옴
   * ✅ 성공이면 백엔드가 204(No Content) 내려줌 → null 반환
   */
  async analyzeResult(
    roomId: number,
    fileName: string,
    runOutput: string,
  ): Promise<TestReportResponse | null> {
    const url = `${API_BASE}/analyze-result`;

    console.groupCollapsed("[aiService] 결과 분석 요청");
    console.log("url:", url);
    console.log("payload:", {
      roomId,
      fileName,
      runOutputLength: runOutput?.length ?? 0,
    });
    console.groupEnd();

    const response = await fetch(url, {
      method: "POST",
      headers: buildJsonHeaders(true),
      body: JSON.stringify({ roomId, fileName, runOutput }),
    });

    // ✅ 우리가 합의한 변경점: 테스트 성공이면 저장할 게 없으므로 null
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const { rawText, json } = await readBodySmart(response);

      console.groupCollapsed(
        `[aiService] analyzeResult ❌ ${response.status} ${response.statusText}`,
      );
      console.log("request", {
        roomId,
        fileName,
        runOutputLength: runOutput?.length ?? 0,
      });

      if (json) {
        console.log("error(json)", json);
        // stacktrace가 너무 길면 접어두기 좋게 따로
        if ((json as ApiErrorResponse).stacktrace) {
          console.log(
            "error.stacktrace",
            (json as ApiErrorResponse).stacktrace,
          );
        }
      } else {
        console.log("error(text)", rawText);
      }
      console.groupEnd();

      const pretty = json ? JSON.stringify(json, null, 2) : rawText;
      throw new Error(
        `결과 분석 실패: ${response.status} ${response.statusText}\n${pretty}`,
      );
    }

    return await response.json();
  },

  /**
   * ✅ (추가) 내 AI 보고서 목록 조회 (마이페이지용)
   */
  async getMyReports(): Promise<TestReportResponse[]> {
    const url = `${API_BASE}/reports/me`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildJsonHeaders(true),
    });

    if (!response.ok) {
      const { rawText, json } = await readBodySmart(response);

      console.groupCollapsed(
        `[aiService] getMyReports ❌ ${response.status} ${response.statusText}`,
      );
      if (json) console.log("error(json)", json);
      else console.log("error(text)", rawText);
      console.groupEnd();

      throw new Error(
        `보고서 조회 실패: ${response.status} ${response.statusText}\n` +
          (json ? JSON.stringify(json, null, 2) : rawText),
      );
    }

    return await response.json();
  },

  /**
   * 테스트 실행(roomId 기반)
   */
  async runGeneratedTest(
    roomId: number,
    testCode: string,
    packageName: string = "",
  ): Promise<string> {
    const url = `${API_BASE}/${roomId}/code-run`;

    const response = await fetch(url, {
      method: "POST",
      headers: buildJsonHeaders(true),
      body: JSON.stringify({ testCode, packageName }),
    });

    if (!response.ok) {
      const { rawText, json } = await readBodySmart(response);

      console.groupCollapsed(
        `[aiService] runGeneratedTest ❌ ${response.status} ${response.statusText}`,
      );
      if (json) console.log("error(json)", json);
      else console.log("error(text)", rawText);
      console.groupEnd();

      throw new Error(
        `테스트 실행 실패: ${response.status} ${response.statusText}\n` +
          (json ? JSON.stringify(json, null, 2) : rawText),
      );
    }

    return await response.text();
  },
};
