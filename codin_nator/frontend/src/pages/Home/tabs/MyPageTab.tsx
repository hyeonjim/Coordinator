/**
 * 마이페이지 탭 컴포넌트
 * 로그인한 사용자의 GitHub 프로필 정보를 표시
 *
 * ✅ 변경점
 * - ContributionGraph에 data를 내려서 mock 대신 실제 저장 데이터로 잔디를 그리게 함
 * - focus/custom event 때 refreshTick만 올려서 최신 반영
 * - ✅ 시간은 무조건 KST(Asia/Seoul)로 표시
 * - ✅ 테스트 성공(예: "테스트 성공", "No Failure", "BUILD SUCCESSFUL")은 잔디에서 제외
 * - ✅ 실패일 때만 잔디에 심기 (기존 DB에 남아있는 성공 로그도 화면에서는 제거)
 */

import { useEffect, useMemo, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/home/myPage/avatar";
import { ContributionGraph } from "@/components/home/myPage/contribution-graph";
import { useAuthStore } from "@/stores/authStore";
import { aiService, type TestReportResponse } from "@/services/ai/aiService";

/** contribution-graph.tsx와 동일한 형태로 맞춤 */
interface ErrorLog {
  id: string;
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

export default function MyPage() {
  const user = useAuthStore((state) => state.user);

  // ✅ “데이터를 다시 읽게 만드는” 트리거용 state
  const [refreshTick, setRefreshTick] = useState(0);

  // ✅ tick이 바뀔 때마다 백엔드에서 최신 보고서를 다시 읽어옴
  const [reports, setReports] = useState<TestReportResponse[]>([]);

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

  const contributionData = useMemo<ContributionData>(() => {
    const map: ContributionData = {};

    for (const r of reports) {
      // ✅ 성공 로그는 잔디에서 제외 (기존에 저장된 성공도 숨김)
      if (isSuccessLog(r.display_name, r.error)) continue;

      // ✅ KST로 날짜/시간 계산
      const { date, time } = toKstDateTime(r.timestamp);

      if (!map[date]) map[date] = { count: 0, logs: [] };
      map[date].logs.push({
        id: String(r.id),
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
  }, [reports]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* 프로필 섹션 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* 사용자 프로필 이미지 */}
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={user?.imageUrl || "/placeholder.svg"}
              alt={user?.name || "User"}
            />
            <AvatarFallback className="text-2xl">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* 사용자 이름과 이메일 */}
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
      </div>

      {/* 기여 그래프 섹션 */}
      <div className="bg-card rounded-xl border p-6">
        {/* ✅ mock 대신 실제 data 주입 */}
        <ContributionGraph data={contributionData} />
      </div>
    </div>
  );
}
