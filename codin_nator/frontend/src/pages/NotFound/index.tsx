/**
 * NotFound - 404 페이지 (존재하지 않는 경로 접근 시 표시)
 *
 * [React 기초 - 라우팅과 404 처리]
 * - React Router에서 어떤 경로에도 매칭되지 않을 때 이 컴포넌트를 렌더링
 * - path="*"로 설정하여 모든 미매칭 경로를 캐치
 *
 * [React 기초 - 프로그래밍 방식 네비게이션]
 * - useNavigate: 버튼 클릭 시 navigate("/")로 홈으로 이동
 * - <Link>와 달리, 조건부 로직이나 이벤트 핸들러 안에서 사용
 *
 * [사용된 기술]
 * - 코드 에디터 스타일 UI: 404 에러를 코드 형태로 표현 (사용자 경험)
 * - <pre> 태그: 코드 블록을 있는 그대로 표시 (공백, 줄바꿈 보존)
 */
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  // useNavigate: 프로그래밍 방식으로 페이지 이동하는 React Router 훅
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
      <div className="w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-lg">
        {/* fake editor header */}
        <div className="mb-6 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-3 text-sm text-neutral-400">not-found.tsx</span>
        </div>

        {/* code-like content */}
        <pre className="mb-6 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-sm text-neutral-200">
          {`// Error: Page not found

throw new Error("404: Route does not exist");

export default function NotFound() {
  return null;
}
`}
        </pre>

        <p className="mb-6 text-neutral-400">
          요청한 경로에 매핑된 페이지가 없습니다. 라우트를 다시 확인하거나
          홈으로 돌아가세요.
        </p>

        <div className="flex gap-3">
          {/* onClick: 버튼 클릭 시 navigate("/")로 홈페이지 이동 */}
          <button
            onClick={() => navigate("/")}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium transition hover:bg-blue-700"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
