/**
 * CodeEditorAi - AI 테스트 생성, 실행, 분석 버튼 컴포넌트
 *
 * [React 기초 - 비동기 이벤트 핸들링]
 * - handleGenerateTest, handleRunTest, handleAnalyze 모두 async 함수
 * - try/catch/finally 패턴: 요청 시작(loading) → 성공/실패 처리 → 로딩 해제
 * - 이 패턴을 통해 사용자에게 진행 상태를 피드백
 *
 * [React 기초 - useMemo]
 * - canAnalyze: 분석 가능 여부를 계산하는 파생 상태
 * - fileName과 latestRunOutput이 바뀔 때만 재계산
 *
 * [React 기초 - 상태 흐름]
 * - 테스트 생성 → latestTestCode 저장
 * - 테스트 실행 → latestRunOutput 저장
 * - AI 분석 → latestRunOutput을 사용하여 분석
 * - 각 단계의 결과가 다음 단계의 입력이 되는 순차적 흐름
 *
 * [사용된 기술]
 * - aiService: AI 관련 API 호출 서비스
 * - window.dispatchEvent: 커스텀 이벤트로 다른 컴포넌트에 알림
 */
import { useMemo, useState } from "react";
import { VscBeaker, VscPlay, VscGraph } from "react-icons/vsc";
import { aiService } from "@/services/ai/aiService";
import Alert from "@/components/common/Alert";
import type { AiActionsProps } from "@/types/ai";

// 유틸리티 함수: 테스트 코드에서 Java 패키지명을 정규식으로 추출
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
  roomId, // 현재 룸 ID
  fileName, // 현재 파일 이름
  code, // 현재 에디터 코드
  onTestGenerated, // 테스트 코드 생성 완료 콜백
  onAppendTerminal, // 터미널에 출력 추가 콜백
}: AiActionsProps) {
  // 여러 개의 독립적인 상태: 알림, 각 단계별 로딩 상태, 결과 저장
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // 테스트 생성 중
  const [isRunning, setIsRunning] = useState(false); // 테스트 실행 중
  const [isAnalyzing, setIsAnalyzing] = useState(false); // AI 분석 중
  const [latestTestCode, setLatestTestCode] = useState<string | null>(null); // 생성된 테스트 코드
  const [latestRunOutput, setLatestRunOutput] = useState<string | null>(null); // 실행 결과

  // useMemo: 분석 가능 여부를 의존성이 바뀔 때만 재계산
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

  // async 이벤트 핸들러: try/catch/finally 패턴
  // try: 정상 처리, catch: 에러 처리, finally: 항상 실행 (로딩 해제)
  const handleGenerateTest = async () => {
    if (!validateBeforeGenerate()) return;

    try {
      setIsGenerating(true); // 로딩 시작
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
    disabled
      ? "flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-(--rc-ai-border) transition-all duration-150 active:scale-[0.98] focus:outline-none bg-(--rc-ai-dis-bg) text-(--rc-ai-dis-text) cursor-not-allowed"
      : "flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-(--rc-ai-border) transition-all duration-150 active:scale-[0.98] focus:outline-none bg-(--rc-ai-bg) text-(--rc-ai-text) hover:bg-(--rc-ai-hover) hover:text-(--rc-ai-hover-text)";

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
