/**
 * React 애플리케이션 진입점 (Entry Point)
 *
 * [React 기초]
 * - createRoot(): React 18+의 새로운 렌더링 API
 *   → DOM의 특정 요소(#root)에 React 앱을 마운트(렌더링)함
 * - StrictMode: 개발 모드에서만 활성화되는 안전장치
 *   → 잠재적 문제를 감지하여 경고를 표시 (프로덕션에서는 영향 없음)
 *   → useEffect가 2번 실행되는 것도 StrictMode 때문 (의도적 동작)
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/style/index.css";
import App from "@/App";

/**
 * document.getElementById("root")!
 * - index.html의 <div id="root"></div>를 찾음
 * - '!'는 TypeScript의 Non-null Assertion → "이 값은 null이 아니다"라고 단언
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
