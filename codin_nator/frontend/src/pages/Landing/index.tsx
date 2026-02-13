import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/images/logo_wh.png";
import editorGif from "@/assets/images/landing/editor.gif";
import gitGif from "@/assets/images/landing/git.gif";
import errorGif from "@/assets/images/landing/error.gif";

const GITHUB_OAUTH_URL = "/oauth2/authorization/github";

const PREVIEW_GIFS = [
  { src: editorGif, alt: "collaborative editor preview" },
  { src: gitGif, alt: "git preview" },
  { src: errorGif, alt: "error preview" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#192028] text-white overflow-hidden">
      <header className="flex items-center justify-between mb-40">
        <Link to="/">
          <img src={logo} alt="CODIN'NATOR" className="w-80" />
        </Link>
        <button
          className="px-5 py-3 mr-30 mt-20 rounded-lg border border-[#5c656d] bg-[#2b2d33] hover:bg-[#2a3f52] flex items-center gap-2"
          onClick={() => { window.location.href = GITHUB_OAUTH_URL; }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Login with GitHub
        </button>
      </header>

      <section className="flex flex-col items-center text-center px-6 mt-10">
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

      {PREVIEW_GIFS.map(({ src, alt }) => (
        <section key={alt} className="mt-10 flex justify-center px-6">
          <div className="w-full max-w-5xl rounded-2xl bg-neutral-800/60 border border-neutral-700 shadow-xl p-6">
            <div className="overflow-hidden rounded-xl bg-neutral-900">
              <img src={src} alt={alt} className="w-full h-auto object-cover" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
