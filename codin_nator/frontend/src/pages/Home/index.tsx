/**
 * Home 레이아웃 컴포넌트
 * OAuth 콜백 처리 및 인증된 사용자의 메인 레이아웃
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/home/components/avatar";
import { ContributionGraph } from "@/components/home/components/contribution-graph";
import { useAuthStore } from "@/stores/authStore";
import { aiService, type TestReportResponse } from "@/services/ai/aiService";
import { useOAuthCallback } from "@/hooks/user/useOAuthCallback";
import { useNavigate } from "react-router-dom";
import CreateRoomModal from "@/components/home/CreateRoomModal";
import {
  LogOut,
  Plus,
  Github,
  TrendingUp,
  Bug,
  Calendar,
  Activity,
} from "lucide-react";

/** contribution-graph.tsx와 동일한 형태로 맞춤 */
interface ErrorLog {
  id: string;
  roomId: string;
  time: string;
  display_name: string;
  error: string;
  stacktrace: string;
  resolution: string;
}

type ContributionData = Record<
  string,
  {
    count: number;
    logs: ErrorLog[];
  }
>;

const KST_TZ = "Asia/Seoul";

/** timestamp 문자열을 Date로 변환 (timezone 없으면 KST로 간주) */
function parseTimestamp(ts?: string | null): Date {
  const raw = (ts ?? "").trim();
  if (!raw) return new Date();

  // timezone 포함 여부 체크
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw);

  // ✅ 예전 데이터(LocalDateTime)면 "KST로 저장된 시간"이라고 가정해서 +09:00을 붙임
  const iso = hasZone ? raw : `${raw}+09:00`;

  const d = new Date(iso);
  // Invalid Date 방어
  return isNaN(d.getTime()) ? new Date() : d;
}

/** KST 기준 YYYY-MM-DD / HH:mm 추출 */
function toKstDateTime(ts?: string | null) {
  const d = parseTimestamp(ts);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d); // HH:mm

  return { date, time };
}

/** ✅ 성공 로그 필터링 (기존 DB에 남아있던 성공도 화면에서 제외) */
function isSuccessLog(displayName?: string, error?: string) {
  const s = `${displayName ?? ""} ${error ?? ""}`.toLowerCase();
  return (
    s.includes("테스트 성공") ||
    s.includes("no failure") ||
    s.includes("build successful")
  );
}

export default function HomeLayout() {
  // OAuth 콜백 처리 (URL에 토큰이 있으면 자동 로그인)
  const { isProcessing, error } = useOAuthCallback();

  const user = useAuthStore((state) => state.user);

  // ✅ “데이터를 다시 읽게 만드는” 트리거용 state
  const [refreshTick, setRefreshTick] = useState(0);

  // ✅ tick이 바뀔 때마다 백엔드에서 최신 보고서를 다시 읽어옴
  const [reports, setReports] = useState<TestReportResponse[]>([]);

  // ✅ 방별 필터 ("all"이면 내가 참여한 모든 방의 report를 합쳐서 보여줌)
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");

  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await aiService.getMyReports();
        if (mounted) setReports(list);
      } catch (e) {
        console.error("[MyPage] getMyReports 실패:", e);
        if (mounted) setReports([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  // ✅ report 목록에서 roomId 옵션 뽑기
  const roomOptions = useMemo(() => {
    const ids = Array.from(
      new Set(reports.map((r) => String(r.roomId)).filter(Boolean)),
    );
    ids.sort((a, b) => Number(a) - Number(b));
    return ids;
  }, [reports]);

  const contributionData = useMemo<ContributionData>(() => {
    const map: ContributionData = {};

    // ✅ 방 필터 적용
    const filteredReports =
      selectedRoomId === "all"
        ? reports
        : reports.filter((r) => String(r.roomId) === selectedRoomId);

    for (const r of filteredReports) {
      // ✅ 성공 로그는 잔디에서 제외 (기존에 저장된 성공도 숨김)
      if (isSuccessLog(r.display_name, r.error)) continue;

      // ✅ KST로 날짜/시간 계산
      const { date, time } = toKstDateTime(r.timestamp);

      if (!map[date]) map[date] = { count: 0, logs: [] };
      map[date].logs.push({
        id: String(r.id),
        roomId: String(r.roomId),
        time,
        display_name: r.display_name,
        error: r.error,
        stacktrace: r.stacktrace ?? "",
        resolution: r.resolution,
      });
    }

    Object.keys(map).forEach((date) => {
      map[date].logs.sort((a, b) => b.time.localeCompare(a.time));
      map[date].count = map[date].logs.length;
    });

    return map;
  }, [reports, selectedRoomId]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalErrors = Object.values(contributionData).reduce(
      (sum, day) => sum + day.count,
      0,
    );
    const daysWithErrors = Object.values(contributionData).filter(
      (day) => day.count > 0,
    ).length;
    const avgErrorsPerDay =
      daysWithErrors > 0 ? (totalErrors / daysWithErrors).toFixed(1) : "0";

    return { totalErrors, daysWithErrors, avgErrorsPerDay };
  }, [contributionData]);

  useEffect(() => {
    const bump = () => setRefreshTick((v) => v + 1);

    // 같은 탭에서 localStorage 변경은 storage 이벤트가 안 뜰 수 있어서 focus로 보강
    window.addEventListener("focus", bump);

    // 우리가 Codeeditoractions에서 쏘는 커스텀 이벤트로 즉시 갱신 가능
    window.addEventListener("codinnator:reports-updated", bump);

    return () => {
      window.removeEventListener("focus", bump);
      window.removeEventListener("codinnator:reports-updated", bump);
    };
  }, []);

  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  /**
   * 로그아웃 처리
   * 스토어 초기화 후 랜딩 페이지로 이동
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 로그인 처리 중 로딩 표시
  if (isProcessing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#3A4149" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* 로딩 스피너 */}
          <div className="relative">
            <div
              className="animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-6"
              style={{ borderColor: "#24292E", borderTopColor: "#9297A2" }}
            />
          </div>
          <p className="font-medium" style={{ color: "#ECEAEA" }}>
            Logging in...
          </p>
        </motion.div>
      </div>
    );
  }

  // 에러 발생 시 표시
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#3A4149" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div
            className="rounded-2xl shadow-xl p-10"
            style={{
              backgroundColor: "#9297A2",
              borderColor: "#9297A2",
              borderWidth: "1px",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#3A4149" }}
            >
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "#ECEAEA" }}>
              Login Error
            </h3>
            <p className="mb-6" style={{ color: "#24292E" }}>{error}</p>
            <a
              href="/"
              className="
                inline-block px-6 py-3
                rounded-lg font-medium
                shadow-lg
                transition-all duration-200
              "
              style={{
                backgroundColor: "#3A4149",
                color: "#ECEAEA",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#24292E";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3A4149";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
              }}
            >
              Try Again
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ backgroundColor: "#3A4149" }}
    >

      <div className="relative max-w-6xl mx-auto px-8 py-12 space-y-8">
        {/* 프로필 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl shadow-xl p-8"
          style={{
            backgroundColor: "#9297A2",
            borderColor: "#9297A2",
            borderWidth: "1px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="flex items-start justify-between">
            {/* 왼쪽: 프로필 */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="relative h-24 w-24 ring-1 ring-[#24292E] shadow-lg">
                  <AvatarImage
                    src={user?.imageUrl || "/placeholder.svg"}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback
                    className="text-2xl"
                    style={{ backgroundColor: "#24292E", color: "#ECEAEA" }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "#ECEAEA" }}>
                  {user?.name || "Unknown User"}
                </h2>
                <p className="text-sm" style={{ color: "#24292E" }}>
                  {user?.email || "No email provided"}
                </p>
                {user?.gitId && (
                  <div
                    className="flex items-center gap-1.5 text-sm mt-2"
                    style={{ color: "#24292E" }}
                  >
                    <Github className="w-4 h-4" />
                    <span>{user.gitId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 로그아웃 */}
            <button
              onClick={handleLogout}
              className="
                group flex items-center gap-2 px-5 py-2.5
                rounded-lg font-medium text-sm
                shadow-sm
                transition-all duration-200
              "
              style={{
                color: "#24292E",
                backgroundColor: "#3A4149",
                borderColor: "#3A4149",
                borderWidth: "1px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#24292E";
                e.currentTarget.style.color = "#ECEAEA";
                e.currentTarget.style.backgroundColor = "#24292E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#3A4149";
                e.currentTarget.style.color = "#24292E";
                e.currentTarget.style.backgroundColor = "#3A4149";
              }}
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Logout
            </button>
          </div>
        </motion.div>

        {/* 기여 그래프 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="relative rounded-2xl shadow-xl p-8"
          style={{
            backgroundColor: "#9297A2",
            borderColor: "#9297A2",
            borderWidth: "1px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: "#3A4149",
                }}
              >
                <Activity className="w-5 h-5" style={{ color: "#ECEAEA" }} />
              </div>
              <div>
                <h3
                  className="text-xl font-semibold mb-1 tracking-tight"
                  style={{ color: "#ECEAEA" }}
                >
                  Error Report Diary
                </h3>
                <p className="text-sm" style={{ color: "#24292E" }}>
                  Track your debugging journey & growth
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateRoomOpen(true)}
              className="
                group flex items-center gap-2 px-5 py-2.5
                rounded-lg font-medium text-sm
                shadow-lg
                transition-all duration-200
              "
              style={{
                backgroundColor: "#3A4149",
                color: "#ECEAEA",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#24292E";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3A4149";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
              }}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              Create Room
            </button>
          </div>

          {/* 통계 카드들 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div
              key={`total-${selectedRoomId}-${stats.totalErrors}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="p-6 rounded-xl shadow-sm transition-all duration-300"
              style={{
                backgroundColor: "#ECEAEA",
                borderColor: "#ECEAEA",
                borderWidth: "1px"
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#3A4149" }}>
                  <Bug className="w-4 h-4" style={{ color: "#ECEAEA" }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#24292E" }}>
                  Total Errors
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight" style={{ color: "#24292E" }}>
                {stats.totalErrors}
              </p>
            </motion.div>

            <motion.div
              key={`days-${selectedRoomId}-${stats.daysWithErrors}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              className="p-6 rounded-xl shadow-sm transition-all duration-300"
              style={{
                backgroundColor: "#ECEAEA",
                borderColor: "#ECEAEA",
                borderWidth: "1px"
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#3A4149" }}>
                  <Calendar className="w-4 h-4" style={{ color: "#ECEAEA" }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#24292E" }}>
                  Active Days
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight" style={{ color: "#24292E" }}>
                {stats.daysWithErrors}
              </p>
            </motion.div>

            <motion.div
              key={`avg-${selectedRoomId}-${stats.avgErrorsPerDay}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="p-6 rounded-xl shadow-sm transition-all duration-300"
              style={{
                backgroundColor: "#ECEAEA",
                borderColor: "#ECEAEA",
                borderWidth: "1px"
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#3A4149" }}>
                  <TrendingUp className="w-4 h-4" style={{ color: "#ECEAEA" }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#24292E" }}>
                  Daily Average
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight" style={{ color: "#24292E" }}>
                {stats.avgErrorsPerDay}
              </p>
            </motion.div>
          </div>

          {/* 방별 보기 - 왼쪽 정렬 */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="
                h-10 px-4 pr-10
                rounded-lg
                text-sm font-medium
                shadow-sm
                transition-all duration-200
                cursor-pointer
              "
              style={{
                backgroundColor: "#ECEAEA",
                borderColor: "#ECEAEA",
                borderWidth: "1px",
                color: "#24292E",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#24292E";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(26, 31, 36, 0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#ECEAEA";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="all">All Rooms</option>
              {roomOptions.map((id) => (
                <option key={id} value={id}>
                  Room #{id}
                </option>
              ))}
            </select>
          </motion.div>

          {/* ContributionGraph */}
          <motion.div
            key={`graph-${selectedRoomId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="p-7 rounded-xl"
            style={{
              backgroundColor: "#ECEAEA",
              borderColor: "#ECEAEA",
              borderWidth: "1px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <ContributionGraph data={contributionData} />
          </motion.div>
        </motion.div>
      </div>

      {isCreateRoomOpen && (
        <CreateRoomModal onClose={() => setIsCreateRoomOpen(false)} />
      )}
    </div>
  );
}
