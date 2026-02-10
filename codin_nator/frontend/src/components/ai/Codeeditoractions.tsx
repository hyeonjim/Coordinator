import { useMemo, useState } from "react";
import { VscBeaker, VscPlay, VscGraph } from "react-icons/vsc";
import { aiService } from "@/services/ai/aiService";
import Alert from "../common/Alert";
import type { CodeEditorActionsProps } from "@/types/ai/types";

export default function Codeeditoractions({
  roomId,
  fileName,
  code,
  onTestGenerated,
  onAppendTerminal,
  fontSize = 14,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  minFontSize = 10,
  maxFontSize = 24,
}: CodeEditorActionsProps) {
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 실행 버튼 활성화를 위한 마지막 생성 테스트 코드 저장
  const [latestTestCode, setLatestTestCode] = useState<string | null>(null);

  // ✅ AI 분석 버튼 활성화를 위한 마지막 실행 출력 저장
  const [latestRunOutput, setLatestRunOutput] = useState<string | null>(null);

  const extractPackageName = (testCode: string) => {
    const match = testCode.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
    return match ? match[1] : "";
  };

  // ✅ 실행 출력에서 "성공"으로 강하게 추정되는 케이스(분석 버튼 비활성화용)
  const isLikelySuccessOutput = (out: string | null) => {
    if (!out) return false;
    const s = out.toLowerCase();

    // 대표 성공 문구
    if (s.includes("build successful")) return true;

    // 너희 시스템에서 성공 표시로 쓰이던 문구들도 방어적으로 포함
    if (s.includes("no failure")) return true;

    // 실패 문구가 있으면 성공으로 보지 않음
    if (s.includes("build failed")) return false;
    if (s.includes("failure:")) return false;
    if (s.includes("there were failing tests")) return false;

    return false;
  };

  const canAnalyze = useMemo(() => {
    if (!fileName) return false;
    if (!latestRunOutput) return false;
    // ✅ 성공 출력이면 분석 버튼 비활성화 (실패일 때만 오류잔디에 심기)
    if (isLikelySuccessOutput(latestRunOutput)) return false;
    return true;
  }, [fileName, latestRunOutput]);

  const validateBeforeGenerate = () => {
    if (!fileName) {
      setAlertMsg("파일을 먼저 선택해주세요.");
      return false;
    }
    if (!code || code.trim().length === 0) {
      setAlertMsg("코드가 비어있습니다.");
      return false;
    }
    if (!fileName.toLowerCase().endsWith(".java")) {
      setAlertMsg("Java 파일만 테스트 생성이 가능합니다.");
      return false;
    }
    return true;
  };

  const handleGenerateTest = async () => {
    if (!validateBeforeGenerate()) return;

    try {
      setIsGenerating(true);
      setError(null);

      const response = await aiService.generateTestCode(
        roomId,
        fileName!,
        code,
      );

      if (!response?.testCode) {
        throw new Error("테스트 코드가 생성되지 않았습니다.");
      }

      setLatestTestCode(response.testCode);
      setLatestRunOutput(null); // ✅ 새 테스트 생성 시 이전 실행 결과는 무효 처리

      onTestGenerated?.(response.testCode);
      onAppendTerminal?.("Generated Test Code", response.testCode);

      setAlertMsg("테스트 코드가 생성되었습니다!");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "테스트 생성 중 오류가 발생했습니다.";
      setError(msg);
      setAlertMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTest = async () => {
    if (!latestTestCode) {
      setAlertMsg("먼저 테스트 코드를 생성해주세요.");
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      const pkg = extractPackageName(latestTestCode);

      const runOutput = await aiService.runGeneratedTest(
        roomId,
        latestTestCode,
        pkg,
      );

      setLatestRunOutput(runOutput); // ✅ 분석 버튼 활성화 조건(실패 여부는 canAnalyze에서 판단)
      onAppendTerminal?.("Test Run Output", runOutput);

      setAlertMsg("테스트 실행이 완료되었습니다!");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "테스트 실행 중 오류가 발생했습니다.";
      setError(msg);
      setLatestRunOutput(null);
      onAppendTerminal?.("Test Run Error", msg);
      setAlertMsg(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileName) {
      setAlertMsg("파일을 먼저 선택해주세요.");
      return;
    }
    if (!latestRunOutput) {
      setAlertMsg("테스트 실행 결과가 없습니다. 먼저 테스트를 실행해주세요.");
      return;
    }

    // ✅ 성공 출력이면 분석 자체를 안 함(실패일 때만 오류 잔디)
    if (isLikelySuccessOutput(latestRunOutput)) {
      const msg = "테스트가 성공했습니다! 저장/분석할 오류가 없습니다 🎉";
      onAppendTerminal?.("AI Analyze Result", msg);
      setAlertMsg(msg);
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // ✅ 성공이면 null(204), 실패면 TestReportResponse
      const res = await aiService.analyzeResult(
        roomId,
        fileName,
        latestRunOutput,
      );

      if (!res) {
        // 혹시 서버가 성공으로 판단해 204를 준 경우
        const msg = "테스트 성공: 저장할 오류가 없습니다 🎉";
        onAppendTerminal?.("AI Analyze Result", msg);
        setAlertMsg(msg);
        return;
      }

      // ✅ 실패일 때만 마이페이지 갱신 이벤트 발생
      window.dispatchEvent(new Event("codinnator:reports-updated"));

      // ✅ 터미널에도 표시(원하면)
      onAppendTerminal?.("AI Analyze Result", JSON.stringify(res, null, 2));

      setAlertMsg("AI 분석이 완료되었습니다! (마이페이지에 기록됨)");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "AI 분석 중 오류가 발생했습니다.";
      setError(msg);
      onAppendTerminal?.("AI Analyze Error", msg);
      setAlertMsg(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ 버튼 공통 Tailwind 스타일 (통일)
  const actionBtnBase =
    "flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold rounded-full h-5" +
    "border border-[#2F363F] transition " +
    "active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/10";

  const actionBtnEnabled =
    "bg-[#424957] text-[#DCD8D8] hover:bg-[#7F838D] hover:text-[#0A080D]";

  const actionBtnDisabled = "bg-[#282f38] text-[#bac4d1] cursor-not-allowed";

  return (
    <div className="flex items-center gap-2 px-6 py-1.5 bg-[#1f2327] border-b border-[#2F363F] shrink-0">
      {/* 파일명 표시 */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[14px] text-[#DCD8D8]">
          {fileName || "파일을 선택하세요"}
        </span>
        {error && (
          <span className="text-[11px] text-[#d87a7a] ml-2">⚠️ {error}</span>
        )}
      </div>

      {/* AI 액션 버튼들 */}
      <div className="flex items-center gap-3">
        {/* 📏 폰트 크기 조정 버튼 */}
        <div className="flex items-center gap-1 px-2 py-1 bg-[#282f38] rounded border border-[#2F363F]">
          <span className="text-[10px] text-[#858585] min-w-6 text-right">
            {fontSize}px
          </span>
          <button
            onClick={onDecreaseFontSize}
            disabled={fontSize <= minFontSize || !onDecreaseFontSize}
            className="px-1.5 py-0.5 text-[11px] font-bold text-[#DCD8D8] hover:bg-[#3e454d] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="폰트 크기 축소 (Ctrl + -)"
          >
            −
          </button>
          <button
            onClick={onResetFontSize}
            className="px-1.5 py-0.5 text-[10px] text-[#DCD8D8] hover:bg-[#3e454d] rounded transition-colors"
            title="기본 크기로 재설정"
          >
            R
          </button>
          <button
            onClick={onIncreaseFontSize}
            disabled={fontSize >= maxFontSize || !onIncreaseFontSize}
            className="px-1.5 py-0.5 text-[11px] font-bold text-[#DCD8D8] hover:bg-[#3e454d] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="폰트 크기 확대 (Ctrl + +)"
          >
            +
          </button>
        </div>

        {/* 테스트 생성 버튼 */}
        <button
          onClick={handleGenerateTest}
          disabled={isGenerating || !fileName || !code}
          className={`${actionBtnBase} ${
            isGenerating || !fileName || !code
              ? actionBtnDisabled
              : actionBtnEnabled
          }`}
          title="현재 코드에서 테스트 코드 생성"
        >
          <VscBeaker className="text-[12px]" />
          {isGenerating ? "생성 중..." : "테스트 생성"}
        </button>

        {/* 테스트 실행 버튼 */}
        <button
          onClick={handleRunTest}
          disabled={isRunning || !latestTestCode}
          className={`${actionBtnBase} ${
            isRunning || !latestTestCode ? actionBtnDisabled : actionBtnEnabled
          }`}
          title={!latestTestCode ? "테스트 생성 후 실행 가능" : "테스트 실행"}
        >
          <VscPlay className="text-[12px]" />
          {isRunning ? "실행 중..." : "테스트 실행"}
        </button>

        {/* AI 분석 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !canAnalyze}
          className={`${actionBtnBase} ${
            isAnalyzing || !canAnalyze ? actionBtnDisabled : actionBtnEnabled
          }`}
          title={
            !latestRunOutput
              ? "테스트 실행 후 분석 가능"
              : isLikelySuccessOutput(latestRunOutput)
                ? "테스트 성공: 분석할 오류가 없습니다"
                : "AI 분석"
          }
        >
          <VscGraph className="text-[12px]" />
          {isAnalyzing ? "분석 중..." : "AI 분석"}
        </button>
      </div>
      <Alert open={!!alertMsg} onConfirm={() => setAlertMsg(null)}>
        {alertMsg}
      </Alert>
    </div>
  );
}
