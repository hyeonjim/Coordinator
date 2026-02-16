/**
 * HomePage - 홈 대시보드 (프로필 + 에러 리포트)
 *
 * [React 기초 - 컴포넌트 합성 (Composition)]
 * - 페이지 컴포넌트가 ProfileSection, ErrorReportSection을 조합하여 화면 구성
 * - 각 섹션은 독립적인 컴포넌트로, 자체적으로 데이터를 가져오고 렌더링
 * - 이 패턴을 "컴포넌트 합성"이라 하며, React의 핵심 설계 원칙
 *
 * [React 기초 - 커스텀 훅]
 * - useOAuthCallback: GitHub OAuth 로그인 후 콜백 처리 (토큰 저장 등)
 * - 컴포넌트에서 호출하면 내부 useEffect가 자동으로 실행됨
 *
 * [사용된 기술]
 * - React Router: 라우트 설정에서 /home 경로에 이 컴포넌트를 매핑
 */
import { useOAuthCallback } from "@/hooks/user/useOAuthCallback";
import ProfileSection from "@/components/home/profile/ProfileSection";
import ErrorReportSection from "@/components/home/error-report/ErrorReportSection";

export default function HomePage() {
  // OAuth 콜백 처리: URL에 인증 코드가 있으면 토큰으로 교환
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
