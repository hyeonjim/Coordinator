import { useNavigate } from "react-router-dom";

export default function NotFound() {
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
