import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef } from "react";
import logo from "@/assets/images/logo_wh.png";

// GitHub OAuth 인증 시작 URL (백엔드에서 처리)
const GITHUB_OAUTH_URL = "/oauth2/authorization/github";

export default function LandingPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);

  /**
   * GitHub OAuth 로그인 시작
   * 백엔드의 OAuth2 인증 엔드포인트로 리다이렉트
   */
  const handleGitHubLogin = () => {
    window.location.href = GITHUB_OAUTH_URL;
  };
  return (
    <div className="min-h-screen bg-[#0d1c2a] from-neutral-950 to-neutral-900 text-white overflow-hidden">
      {/* ================= HEADER ================= */}
      <header className="flex items-center justify-between px-10 py-6">
        <Link to="/">
          <img
            src={logo}
            alt="CODIN'NATOR"
            className="w-54 h-32 overflow-hidden rounded-xl"
          />
        </Link>
        {/* GitHub 로그인 버튼 */}
        <button
          className="px-5 py-2 rounded-lg border bg-[#05192b] hover:bg-[#324e69] flex items-center gap-2"
          onClick={handleGitHubLogin}
        >
          {/* GitHub 아이콘 (SVG) */}
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Login with GitHub
        </button>
      </header>

      {/* ================= HERO ================= */}
      <section className="flex flex-col items-center text-center px-6 mt-10">
        {/* className="text-5xl md:text-6xl font-bold leading-tight mb-6" */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-bold mb-6"
        >
          Coordinate Codes. <br />
          <span className="text-neutral-400">In Real Time.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl text-neutral-300"
        >
          A real-time collaborative code editor powered by CRDT, WebRTC, and AI.
        </motion.p>
      </section>

      {/* ================= PREVIEW AREA ================= */}
      <section ref={previewRef} className="mt-10 flex justify-center px-6">
        <div className="w-full max-w-5xl rounded-2xl bg-neutral-800/60 border border-neutral-700 shadow-xl p-6">
          <div className="h-64 md:h-80 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-500">
            Live Collaborative Editor Preview
          </div>
        </div>
      </section>
    </div>
  );
}
