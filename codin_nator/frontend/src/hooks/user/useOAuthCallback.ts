/**
 * useOAuthCallback.ts - GitHub OAuth 콜백 처리 훅
 *
 * [OAuth 2.0 인증 흐름 (간략)]
 * 1. 사용자가 "GitHub로 로그인" 버튼 클릭
 * 2. GitHub 로그인 페이지로 리다이렉트
 * 3. 사용자가 GitHub에서 로그인/권한 승인
 * 4. GitHub이 우리 앱의 콜백 URL로 리다이렉트 (인가 코드 포함)
 * 5. 백엔드가 인가 코드로 토큰을 교환하고, 프론트엔드 URL에 토큰을 쿼리 파라미터로 전달
 * 6. (이 훅) URL에서 토큰 추출 → GitHub API로 사용자 정보 조회 → 로그인 완료
 *
 * [이 훅의 역할]
 * - URL 쿼리 파라미터에서 JWT 토큰과 GitHub 토큰을 추출
 * - GitHub API로 사용자 정보(이름, 아바타 등)를 조회
 * - zustand 스토어(useAuthStore)에 로그인 상태 저장
 * - URL에서 토큰 파라미터를 제거하고 홈으로 이동
 *
 * [사용된 React 훅 설명]
 * - useSearchParams: URL의 쿼리 파라미터(?key=value)를 읽고 수정하는 react-router 훅
 * - useNavigate: 프로그래밍 방식으로 페이지를 이동하는 react-router 훅
 * - useRef: hasProcessedRef로 중복 처리 방지 (StrictMode에서 useEffect가 2번 실행되는 것 대응)
 *
 * @returns 처리 상태(isProcessing)와 에러 정보(error)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";
import { fetchGitHubUserInfo } from "@/services/user/gitHubService";
import type { AuthTokens, UseOAuthCallbackResult } from "@/types/auth";

export function useOAuthCallback(): UseOAuthCallbackResult {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * OAuth 콜백 처리 함수
   * - async/await: 비동기 작업(API 호출)을 순차적으로 처리
   * - try/catch/finally: 에러 처리와 로딩 상태 관리
   *   → try: 정상 흐름, catch: 에러 발생 시, finally: 항상 실행 (로딩 해제)
   */
  const processOAuthCallback = useCallback(
    async (accessToken: string, gitHubToken: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const user = await fetchGitHubUserInfo(gitHubToken);

        const tokens: AuthTokens = {
          accessToken,
          gitHubToken,
        };

        login(user, tokens);

        const newParams = new URLSearchParams(searchParams);
        newParams.delete("token");
        newParams.delete("gitToken");
        setSearchParams(newParams, { replace: true });

        navigate("/home", { replace: true });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "로그인 처리 중 오류가 발생했습니다.";
        setError(errorMessage);
        console.error("OAuth 콜백 처리 실패:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [login, navigate, searchParams, setSearchParams],
  );
  /**
   * URL 쿼리 파라미터에서 토큰 추출
   * - searchParams.get("token"): ?token=xxx에서 xxx 값을 가져옴
   * - 토큰이 없으면 null → useEffect에서 처리하지 않음
   */
  const accessToken = searchParams.get("token");
  const gitHubToken = searchParams.get("gitToken");

  /**
   * 중복 처리 방지 Ref
   * - React StrictMode에서 useEffect가 2번 실행될 수 있어 ref로 1회만 처리되도록 보장
   */
  const hasProcessedRef = useRef(false);

  /**
   * 토큰이 URL에 있으면 자동으로 OAuth 콜백 처리 시작
   * - 의존성: accessToken, gitHubToken이 존재할 때 실행
   * - hasProcessedRef로 중복 실행 방지
   */
  useEffect(() => {
    if (hasProcessedRef.current) return;
    if (!accessToken || !gitHubToken) return;
    hasProcessedRef.current = true;
    processOAuthCallback(accessToken, gitHubToken);
  }, [accessToken, gitHubToken, processOAuthCallback]);

  return { isProcessing, error };
}
