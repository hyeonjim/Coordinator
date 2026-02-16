/**
 * App 컴포넌트 - 애플리케이션의 최상위 컴포넌트
 *
 * [역할]
 * 1. 앱 시작 시 JWT 토큰 유효성 검증 (bootstrapAuth)
 * 2. BrowserRouter로 클라이언트 사이드 라우팅 설정
 * 3. 라우트 설정을 AppRoutes 컴포넌트에 위임
 *
 * [React 기초 - useEffect]
 * - 컴포넌트가 화면에 나타난 후(마운트) 실행되는 부수 효과(Side Effect)
 * - 두 번째 인자 []: 빈 배열 → 최초 1회만 실행
 * - API 호출, 이벤트 리스너 등록 등에 사용
 *
 * [React 기초 - useState]
 * - 컴포넌트 내부의 변경 가능한 데이터(상태)를 관리
 * - [값, 변경함수] = useState(초기값)
 * - 값이 변경되면 컴포넌트가 자동으로 다시 렌더링됨
 *
 * [async/await 기초]
 * - async: 이 함수는 비동기 작업을 포함한다는 선언
 * - await: Promise가 완료될 때까지 기다림
 * - useEffect 내부에서 직접 async를 사용할 수 없어서 내부 함수를 만들어 호출
 */

import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";

import { bootstrapAuth } from "@/services/auth/bootstrapAuth";
import LoadingPage from "@/components/common/Loading";
import AppRoutes from "@/routes";

export default function App() {
  // 앱 초기화 완료 여부 (JWT 검증이 끝날 때까지 true)
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    /**
     * useEffect 안에서 async 함수를 직접 쓸 수 없으므로
     * 내부에 async 함수를 정의하고 즉시 호출하는 패턴 사용
     */
    const init = async () => {
      await bootstrapAuth();
      setIsInitializing(false);
    };

    init();
  }, []); // 빈 배열: 컴포넌트 최초 마운트 시 1회만 실행

  // 초기화 중이면 로딩 화면 표시
  if (isInitializing) {
    return <LoadingPage />;
  }

  return (
    /**
     * BrowserRouter: HTML5 History API를 사용한 라우터
     * - URL이 변경되면 해당하는 컴포넌트를 렌더링
     * - 페이지 새로고침 없이 화면 전환 가능 (SPA)
     */
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
