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
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white overflow-hidden">
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
          className="px-5 py-2 rounded-lg border border-neutral-700 hover:border-white transition flex items-center gap-2"
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
      <section className="flex flex-col items-center text-center px-6 mt-28">
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

        {/* <p className="max-w-2xl text-lg text-neutral-300 mb-12">
          CODIN'NATOR is a real-time collaborative code editor that enables
          teams to write, review, and debug code simultaneously with seamless
          synchronization. Built for speed, clarity, and modern collaboration.
        </p> */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl text-neutral-300 mb-12"
        >
          A real-time collaborative code editor powered by CRDT, WebRTC, and AI.
        </motion.p>

        <div className="flex gap-4">
          <button className="px-8 py-4 rounded-xl bg-white text-black font-semibold shadow-xl hover:scale-105 transition">
            {/* <button className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition shadow-lg"> */}
            Start Collaborating
          </button>

          <button
            onClick={() =>
              previewRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
            className="px-8 py-4 rounded-xl border border-neutral-600 hover:border-white transition"
          >
            View Demo
          </button>
        </div>
      </section>

      {/* ================= PREVIEW AREA ================= */}
      <section ref={previewRef} className="mt-32 flex justify-center px-6">
        <div className="w-full max-w-5xl rounded-2xl bg-neutral-800/60 border border-neutral-700 shadow-xl p-6">
          <div className="h-64 md:h-80 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-500">
            Live Collaborative Editor Preview
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mt-36 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-semibold text-center mb-20">
          Built for Agile Development Teams
        </h2>
        {/* 
//           title="⚡ Real-time Sync"
//           desc="Code updates are instantly shared across all collaborators using CRDT-based synchronization."
//         />

//         <FeatureCard
//           title="🎨 Block Highlighting"
//           desc="Each contributor’s active code block is visually highlighted for clear collaboration."
//         />

//         <FeatureCard
//           title="👥 Smart Collaboration"
//           desc="Avoid conflicts and merge issues with intelligent real-time editing." */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <Feature
            title="⚡ Real-time Synchronization"
            desc="CRDT-powered live updates ensure conflict-free and seamless editing across multiple users."
          />

          <Feature
            title="✨ Automated Test Code Runner"
            desc="Developer-friendly environment with instant test code generation and execution."
          />

          <Feature
            title="🚨 Error Report Diary"
            desc="AI-powered error analysis with automatic documentation and structured error logs."
          />

          <Feature
            title="🎙️ Live Voice Chat"
            desc="WebRTC-powered voice communication with high quality and ultra-low latency."
          />

          <Feature
            title="🎨 Smart Highlight"
            desc="Visually highlighted active code blocks and manual highlighting support."
          />

          <Feature
            title="👥 Seamless Collaboration"
            desc="Git integration, instant link sharing, and a user-friendly interface for efficient team workflows."
          />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mt-40 text-center px-6">
        <h3 className="text-4xl font-bold mb-6">Start Coding Together Today</h3>

        <p className="text-neutral-400 mb-10">
          Experience the future of collaborative development.
        </p>

        <button className="px-10 py-4 rounded-xl bg-white text-black font-semibold text-lg hover:opacity-90 transition shadow-xl">
          Get Started for Free
        </button>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-40 py-10 text-center text-neutral-500 text-sm">
        © 2026 CODIN'NATOR · Real-time Coding Collaboration Platform
      </footer>
    </div>
  );
}

/* ================= COMPONENT ================= */

interface FeatureProps {
  title: string;
  desc: string;
}

// function Feature({ title, desc }: FeatureProps) {
//   return (
//     <div className="rounded-2xl bg-neutral-800/60 border border-neutral-700 p-8 hover:shadow-xl transition">
//       <h3 className="text-xl font-semibold mb-3">{title}</h3>

//       <p className="text-neutral-400 leading-relaxed">{desc}</p>
//     </div>
//   );
// }
function Feature({ title, desc }: FeatureProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="group rounded-2xl bg-neutral-800/60 border border-neutral-700 p-8 cursor-pointer
                 hover:border-white/60 hover:shadow-2xl hover:bg-neutral-800 transition"
    >
      <h3 className="text-xl font-semibold mb-3 group-hover:text-white transition">
        {title}
      </h3>

      <p className="text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition">
        {desc}
      </p>
    </motion.div>
  );
}
