import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useOAuthCallback } from "@/hooks/user/useOAuthCallback";
import { useAuthStore } from "@/stores/authStore";

import ProfileSection from "@/components/home/profile/ProfileSection";
import ErrorReportSection from "@/components/home/error-report/ErrorReportSection";

export default function HomeLayout() {
  const { isProcessing, error } = useOAuthCallback();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#8e97a1]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-6 border-[#d4d8dd] border-t-[#7F838D]" />
          <p className="font-medium text-[#24292E]">Logging in...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#8e97a1]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="rounded-2xl shadow-xl p-10 bg-[#d4d8dd] border border-[#c4c9ce]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#d87a7a]">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#24292E]">Login Error</h3>
            <p className="mb-6 text-[#586069]">{error}</p>
            <a
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-200 bg-[#d87a7a] hover:bg-[#c76a6a] text-white"
            >
              Try Again
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#8e97a1]">
      <div className="relative max-w-5xl mx-auto px-8 py-12 space-y-8">
        <ProfileSection user={user} onLogout={handleLogout} />
        <ErrorReportSection />
      </div>
    </div>
  );
}
