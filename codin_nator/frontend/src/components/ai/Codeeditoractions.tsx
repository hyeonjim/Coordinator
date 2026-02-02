import { useState } from "react";
import { VscBeaker, VscPlay, VscGraph } from "react-icons/vsc";

interface CodeEditorActionsProps {
  /** 현재 파일명 */
  fileName: string;
  /** 현재 코드 내용 */
  code: string;
  /** Room ID */
  roomId: number;
  /** 테스트 생성 완료 콜백 */
  onTestGenerated: (testCode: string) => void;
  /** 로딩 상태 */
  isGenerating?: boolean;
}

const CodeEditorActions = ({
  fileName,
  code,
  roomId,
  onTestGenerated,
  isGenerating = false,
}: CodeEditorActionsProps) => {
  const [error, setError] = useState<string | null>(null);

  /**
   * 테스트 코드 생성 핸들러
   */
  const handleGenerateTest = async () => {
    // 파일명 검증
    if (!fileName) {
      alert("파일을 먼저 선택해주세요.");
      return;
    }

    // 코드 검증
    if (!code || code.trim().length === 0) {
      alert("코드가 비어있습니다.");
      return;
    }

    // Java 파일 검증
    if (!fileName.toLowerCase().endsWith(".java")) {
      alert("Java 파일만 테스트 생성이 가능합니다.");
      return;
    }

    try {
      setError(null);
      console.log("[CodeEditorActions] 테스트 생성 시작");
      console.log("  - fileName:", fileName);
      console.log("  - code length:", code.length);
      console.log("  - roomId:", roomId);

      // AI 서비스 호출 (동적 import)
      const { aiService } = await import("@/services/ai/aiService");

      const response = await aiService.generateTestCode(roomId, fileName, code);

      console.log("[CodeEditorActions] 테스트 생성 완료");
      console.log("  - testCode length:", response.testCode?.length);

      // 상위 컴포넌트로 테스트 코드 전달
      onTestGenerated(response.testCode);

      // 성공 알림
      alert("테스트 코드가 생성되었습니다!");
    } catch (err) {
      console.error("[CodeEditorActions] 테스트 생성 실패:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "테스트 생성 중 오류가 발생했습니다.";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 h-[35px] bg-[#1e1e1e] border-b border-[#2d2d30]">
      {/* 파일명 표시 */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[13px] text-[#cccccc]">
          {fileName || "파일을 선택하세요"}
        </span>
        {error && (
          <span className="text-[11px] text-red-400 ml-2">⚠️ {error}</span>
        )}
      </div>

      {/* AI 액션 버튼들 */}
      <div className="flex items-center gap-1">
        {/* 테스트 생성 버튼 */}
        <button
          onClick={handleGenerateTest}
          disabled={isGenerating || !fileName || !code}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded
            text-[12px] font-medium
            transition-all duration-200
            ${
              isGenerating || !fileName || !code
                ? "bg-[#2d2d30] text-[#858585] cursor-not-allowed"
                : "bg-[#0e639c] text-white hover:bg-[#1177bb] active:bg-[#0d5a8f]"
            }
          `}
          title="현재 코드에서 테스트 코드 생성"
        >
          <VscBeaker className="text-[14px]" />
          {isGenerating ? "생성 중..." : "테스트 생성"}
        </button>

        {/* 테스트 실행 버튼 (비활성화) */}
        <button
          disabled
          className="
            flex items-center gap-2 px-3 py-1.5 rounded
            bg-[#2d2d30] text-[#858585] cursor-not-allowed
            text-[12px] font-medium
          "
          title="테스트 실행 (구현 예정)"
        >
          <VscPlay className="text-[14px]" />
          테스트 실행
        </button>

        {/* AI 분석 버튼 (비활성화) */}
        <button
          disabled
          className="
            flex items-center gap-2 px-3 py-1.5 rounded
            bg-[#2d2d30] text-[#858585] cursor-not-allowed
            text-[12px] font-medium
          "
          title="AI 분석 (구현 예정)"
        >
          <VscGraph className="text-[14px]" />
          AI 분석
        </button>
      </div>
    </div>
  );
};

export default CodeEditorActions;
