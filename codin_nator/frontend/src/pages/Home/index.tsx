import { useNavigate } from "react-router-dom";

import { useOAuthCallback } from "@/hooks/user/useOAuthCallback";
import { useAuthStore } from "@/stores/authStore";

import ProfileSection from "@/components/home/profile/ProfileSection";
import ErrorReportSection from "@/components/home/error-report/ErrorReportSection";

export default function HomeLayout() {
  useOAuthCallback();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[#8e97a1]">
      <div className="relative max-w-5xl mx-auto px-8 py-12 space-y-8">
        <ProfileSection user={user} onLogout={handleLogout} />
        <ErrorReportSection />
      </div>
    </div>
  );
}
