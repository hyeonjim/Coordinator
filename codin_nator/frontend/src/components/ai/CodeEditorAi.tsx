import { useMemo, useState } from "react";
import { VscBeaker, VscPlay, VscGraph } from "react-icons/vsc";
import { aiService } from "@/services/ai/aiService";
import Alert from "@/components/common/Alert";
import type { AiActionsProps } from "@/types/ai/types";

// 패키지명 추출 유틸리티
function extractPackageName(testCode: string): string {
  const match = testCode.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
  return match ? match[1] : "";
}

// 테스트 성공 여부 판단
function isSuccessOutput(output: string | null): boolean {
  if (!output) return false;

  const lowerCaseOutput = output.toLowerCase();

  if (lowerCaseOutput.includes("build successful") || lowerCaseOutput.includes("no failure")) {
    return true;
  }

  if (
    lowerCaseOutput.includes("build failed") ||
    lowerCaseOutput.includes("failure:") ||
    lowerCaseOutput.includes("there were failing tests")
  ) {
    return false;
  }

  return false;
}

export default function AiActions({
  roomId,
  fileName,
  code,
  onTestGenerated,
  onAppendTerminal,
}: AiActionsProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestTestCode, setLatestTestCode] = useState<string | null>(null);
  const [latestRunOutput, setLatestRunOutput] = useState<string | null>(null);

  const canAnalyze = useMemo(
    () => !!fileName && !!latestRunOutput && !isSuccessOutput(latestRunOutput),
    [fileName, latestRunOutput],
  );

  const validateBeforeGenerate = (): boolean => {
    if (!fileName) {
      setAlertMessage("파일을 먼저 선택해주세요.");
      return false;
    }
    if (!code || code.trim().length === 0) {
      setAlertMessage("코드가 비어있습니다.");
      return false;
    }
    if (!fileName.toLowerCase().endsWith(".java")) {
      setAlertMessage("Java 파일만 테스트 생성이 가능합니다.");
      return false;
    }
    return true;
  };

  const handleGenerateTest = async () => {
    if (!validateBeforeGenerate()) return;

    try {
      setIsGenerating(true);
      const response = await aiService.generateTestCode(roomId, fileName!, code);

      if (!response?.testCode) {
        throw new Error("테스트 코드가 생성되지 않았습니다.");
      }

      setLatestTestCode(response.testCode);
      setLatestRunOutput(null);
      onTestGenerated?.(response.testCode);
      onAppendTerminal?.("Generated Test Code", response.testCode);
      setAlertMessage("테스트 코드가 생성되었습니다!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "테스트 생성 중 오류가 발생했습니다.";
      setAlertMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTest = async () => {
    if (!latestTestCode) {
      setAlertMessage("먼저 테스트 코드를 생성해주세요.");
      return;
    }

    try {
      setIsRunning(true);
      const runOutput = await aiService.runGeneratedTest(
        roomId,
        latestTestCode,
        extractPackageName(latestTestCode),
      );

      setLatestRunOutput(runOutput);
      onAppendTerminal?.("Test Run Output", runOutput);
      setAlertMessage("테스트 실행이 완료되었습니다!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "테스트 실행 중 오류가 발생했습니다.";
      setLatestRunOutput(null);
      onAppendTerminal?.("Test Run Error", message);
      setAlertMessage(message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileName || !latestRunOutput) {
      setAlertMessage("테스트 실행 결과가 없습니다. 먼저 테스트를 실행해주세요.");
      return;
    }

    if (isSuccessOutput(latestRunOutput)) {
      const message = "테스트가 성공했습니다! 저장/분석할 오류가 없습니다 🎉";
      onAppendTerminal?.("AI Analyze Result", message);
      setAlertMessage(message);
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await aiService.analyzeResult(roomId, fileName, latestRunOutput);

      if (!result) {
        const message = "테스트 성공: 저장할 오류가 없습니다 🎉";
        onAppendTerminal?.("AI Analyze Result", message);
        setAlertMessage(message);
        return;
      }

      window.dispatchEvent(new Event("codinnator:reports-updated"));
      onAppendTerminal?.("AI Analyze Result", JSON.stringify(result, null, 2));
      setAlertMessage("AI 분석이 완료되었습니다! (마이페이지에 기록됨)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 분석 중 오류가 발생했습니다.";
      onAppendTerminal?.("AI Analyze Error", message);
      setAlertMessage(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getButtonClassName = (disabled: boolean): string =>
    `ai-action-btn ${disabled ? "ai-action-btn-disabled" : "ai-action-btn-enabled"}`;

  const getAnalyzeButtonTitle = (): string => {
    if (!latestRunOutput) {
      return "테스트 실행 후 분석 가능";
    }
    if (isSuccessOutput(latestRunOutput)) {
      return "테스트 성공: 분석할 오류가 없습니다";
    }
    return "AI 분석";
  };

  const isGenerateDisabled = isGenerating || !fileName || !code;
  const isRunDisabled = isRunning || !latestTestCode;
  const isAnalyzeDisabled = isAnalyzing || !canAnalyze;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGenerateTest}
        disabled={isGenerateDisabled}
        className={getButtonClassName(isGenerateDisabled)}
        title="현재 코드에서 테스트 코드 생성"
      >
        <VscBeaker className="text-[12px]" />
        {isGenerating ? "생성 중..." : "테스트 생성"}
      </button>

      <button
        onClick={handleRunTest}
        disabled={isRunDisabled}
        className={getButtonClassName(isRunDisabled)}
        title={!latestTestCode ? "테스트 생성 후 실행 가능" : "테스트 실행"}
      >
        <VscPlay className="text-[12px]" />
        {isRunning ? "실행 중..." : "테스트 실행"}
      </button>

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzeDisabled}
        className={getButtonClassName(isAnalyzeDisabled)}
        title={getAnalyzeButtonTitle()}
      >
        <VscGraph className="text-[12px]" />
        {isAnalyzing ? "분석 중..." : "AI 분석"}
      </button>

      <Alert open={!!alertMessage} onConfirm={() => setAlertMessage(null)}>
        {alertMessage}
      </Alert>
    </div>
  );
}
