/**
 * Home 레이아웃 컴포넌트
 * OAuth 콜백 처리 및 인증된 사용자의 메인 레이아웃
 */
import { useEffect, useMemo, useState } from "react";

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
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          {/* 로딩 스피너 */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-foreground">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생 시 표시
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center text-red-500">
          <p className="mb-4">로그인 오류: {error}</p>
          <a
            href="/"
            className="underline text-foreground hover:text-muted-foreground"
          >
            다시 시도하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-y-scroll">
      <div className="flex flex-1">
        <div className="max-w-4xl mx-auto space-y-8 p-6">
          {/* 프로필 섹션 */}
          <div className="flex items-start justify-between">
            {/* 왼쪽: 프로필 */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user?.imageUrl || "/placeholder.svg"}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {user?.name || "Unknown User"}
                </h2>
                <p className="text-muted-foreground">
                  {user?.email || "No email provided"}
                </p>
                {user?.gitId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    GitHub ID: {user.gitId}
                  </p>
                )}
              </div>
            </div>

            {/* 오른쪽: 로그아웃 */}
            <button
              onClick={handleLogout}
              className="
      h-10 px-4
      rounded-lg
      text-sm font-medium
      text-muted-foreground
      border border-border
      hover:text-destructive
      hover:border-destructive
      hover:bg-destructive/10
      transition
    "
            >
              Logout
            </button>
          </div>

          {/* 기여 그래프 섹션 */}
          <div className="bg-card rounded-xl border p-6 relative">
            <button
              className="
    absolute top-6 right-6
    px-4 py-2
    text-sm font-medium
    rounded-lg
    border border-neutral-300
    bg-background
    hover:bg-neutral-100
    transition
  "
              onClick={() => setIsCreateRoomOpen(true)}
            >
              방 만들기
            </button>
            {/* ✅ 방별 보기 */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="all">전체 (참여한 모든 방)</option>
                {roomOptions.map((id) => (
                  <option key={id} value={id}>
                    Room #{id}
                  </option>
                ))}
              </select>
            </div>
            <ContributionGraph data={contributionData} />
          </div>
        </div>
      </div>
      {isCreateRoomOpen && (
        <CreateRoomModal onClose={() => setIsCreateRoomOpen(false)} />
      )}
    </div>
  );
}
