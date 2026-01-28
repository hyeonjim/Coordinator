// // export default function LoginButton() {
// //   return (
// //     <button>
// //       <img src="" alt="이미지" />
// //       <span>LoginButton</span>
// //     </button>
// //   );
// // }

// export default function LandingPage() {
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
//       {/* ===== 로고 ===== */}
//       <img
//         src="/logo.png" // public 폴더에 이미지 넣기
//         alt="CODIN'NATOR Logo"
//         className="w-[320px] mb-8"
//       />

//       {/* ===== 서비스 설명 ===== */}
//       <h1 className="text-3xl font-semibold text-center mb-4">
//         Real-time Collaborative Code Editor
//       </h1>

//       <p className="max-w-xl text-center text-muted-foreground mb-10 leading-relaxed">
//         Codin’nator is a real-time collaborative coding platform that allows
//         developers to write, edit, and debug code together seamlessly. Share
//         blocks of code, track changes instantly, and build faster as a team.
//       </p>

//       {/* ===== 핵심 포인트 ===== */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl w-full">
//         <FeatureCard
//           title="⚡ Real-time Sync"
//           desc="Code updates are instantly shared across all collaborators using CRDT-based synchronization."
//         />

//         <FeatureCard
//           title="🎨 Block Highlighting"
//           desc="Each contributor’s active code block is visually highlighted for clear collaboration."
//         />

//         <FeatureCard
//           title="👥 Smart Collaboration"
//           desc="Avoid conflicts and merge issues with intelligent real-time editing."
//         />
//       </div>

//       {/* ===== 로그인 버튼 ===== */}
//       <button
//         onClick={() => {
//           // 추후 라우팅 연결
//           console.log("Login clicked");
//         }}
//         className="px-10 py-3 rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:opacity-90 transition shadow-md"
//       >
//         Login & Start Coding
//       </button>

//       {/* ===== 푸터 ===== */}
//       <p className="mt-12 text-xs text-muted-foreground">
//         © 2026 CODIN'NATOR · Coding Coordinator Platform
//       </p>
//     </div>
//   );
// }

// /* ================= 하위 컴포넌트 ================= */

// interface FeatureCardProps {
//   title: string;
//   desc: string;
// }

// function FeatureCard({ title, desc }: FeatureCardProps) {
//   return (
//     <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow transition">
//       <h3 className="font-semibold mb-2">{title}</h3>
//       <p className="text-sm text-muted-foreground">{desc}</p>
//     </div>
//   );
// }

import { motion } from "framer-motion";
import { useRef } from "react";
import logo from "./logo.png";

export default function LandingPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white overflow-hidden">
      {/* ================= HEADER ================= */}
      <header className="flex items-center justify-between px-10 py-6">
        <img src={logo} alt="CODIN'NATOR" className="w-48" />

        <button className="px-5 py-2 rounded-lg border border-neutral-700 hover:border-white transition">
          Login
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
