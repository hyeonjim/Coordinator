import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";
import { fetchGitHubUserInfo } from "@/services/user/gitHubService";
import type { AuthTokens, UseOAuthCallbackResult } from "@/types/user/types";

/**
 * OAuth 콜백 URL에서 토큰 추출 및 로그인 처리 훅
 * URL 형식: /home?token=<JWT>&gitToken=<GITHUB_TOKEN>
 *
 * @returns 처리 상태와 에러 정보
 */

export function useOAuthCallback(): UseOAuthCallbackResult {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const accessToken = searchParams.get("token");
  const gitHubToken = searchParams.get("gitToken");
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    if (!accessToken || !gitHubToken) return;
    hasProcessedRef.current = true;
    processOAuthCallback(accessToken, gitHubToken);
  }, [accessToken, gitHubToken, processOAuthCallback]);

  return { isProcessing, error };
}
