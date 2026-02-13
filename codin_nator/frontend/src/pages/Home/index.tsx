import { useOAuthCallback } from "@/hooks/user/useOAuthCallback";
import ProfileSection from "@/components/home/profile/ProfileSection";
import ErrorReportSection from "@/components/home/error-report/ErrorReportSection";

export default function HomePage() {
  useOAuthCallback();

  return (
    <div className="min-h-screen overflow-y-auto bg-[#8e97a1]">
      <div className="relative max-w-5xl mx-auto px-8 py-12 space-y-8">
        <ProfileSection />
        <ErrorReportSection />
      </div>
    </div>
  );
}
