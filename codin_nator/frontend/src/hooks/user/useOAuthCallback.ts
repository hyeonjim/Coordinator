/**
 * OAuth 콜백 처리 커스텀 훅
 * URL 파라미터에서 토큰을 추출하고 GitHub API로 사용자 정보를 가져와 로그인 처리
 */

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { AuthTokens } from "@/types/user/types";

/**
 * OAuth 콜백 처리 결과 타입
 */
interface UseOAuthCallbackResult {
  /** 로그인 처리 중 여부 */
  isProcessing: boolean;
  /** 에러 메시지 (에러 발생 시) */
  error: string | null;
}

/**
 * OAuth 콜백 URL에서 토큰 추출 및 로그인 처리 훅
 * URL 형식: /home?token=<JWT>&gitToken=<GITHUB_TOKEN>
 *
 * @returns 처리 상태와 에러 정보
 */
export function useOAuthCallback(): UseOAuthCallbackResult {
  // URL 쿼리 파라미터 접근
  const [searchParams, setSearchParams] = useSearchParams();
  // 페이지 이동
  const navigate = useNavigate();
  // authStore의 login 함수
  const login = useAuthStore((state) => state.login);

  // 로컬 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL에서 토큰 파라미터 추출
    const accessToken = searchParams.get("token");

    // 토큰이 없으면 OAuth 콜백이 아니므로 처리하지 않음
    if (!accessToken) {
      return;
    }

    /**
     * 비동기 로그인 처리 함수
     */
    async function processOAuthCallback() {
      setIsProcessing(true);
      setError(null);

      try {
        // GitHub API를 호출하여 사용자 정보 가져오기

        // 토큰 객체 생성
        const tokens: AuthTokens = {
          accessToken: accessToken!,
        };

        // authStore에 로그인 정보 저장
        login(tokens);

        // URL에서 토큰 파라미터 제거 (보안: URL에 토큰 노출 방지)
        searchParams.delete("token");
        searchParams.delete("gitToken");
        setSearchParams(searchParams, { replace: true });

        // mypage로 리다이렉트
        navigate("/home/mypage", { replace: true });
      } catch (err) {
        // 에러 처리
        const errorMessage =
          err instanceof Error
            ? err.message
            : "로그인 처리 중 오류가 발생했습니다.";
        setError(errorMessage);
        console.error("OAuth 콜백 처리 실패:", err);
      } finally {
        setIsProcessing(false);
      }
    }

    // 비동기 함수 실행
    processOAuthCallback();
  }, [searchParams, setSearchParams, login, navigate]);

  return { isProcessing, error };
}
