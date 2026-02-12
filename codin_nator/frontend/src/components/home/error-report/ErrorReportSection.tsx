import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Bug, Calendar, Activity, TrendingUp } from "lucide-react";
import { ContributionGraph } from "./contribution-graph";
import CreateRoomModal from "@/components/home/CreateRoomModal";
import { aiService } from "@/services/ai/aiService";
import type { TestReportResponse } from "@/types/ai/types";
import type { Stats } from "@/types/home/types";
import type { ContributionData } from "@/types/home/contribution";

const KST_TZ = "Asia/Seoul";

function parseTimestamp(ts?: string | null): Date {
  const raw = (ts ?? "").trim();
  if (!raw) return new Date();
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw);
  const iso = hasZone ? raw : `${raw}+09:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

function toKstDateTime(ts?: string | null) {
  const d = parseTimestamp(ts);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  return { date, time };
}

function isSuccessLog(displayName?: string, error?: string) {
  const s = `${displayName ?? ""} ${error ?? ""}`.toLowerCase();
  return (
    s.includes("테스트 성공") ||
    s.includes("no failure") ||
    s.includes("build successful")
  );
}

export default function ErrorReportSection() {
  const [reports, setReports] = useState<TestReportResponse[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await aiService.getMyReports();
        if (mounted) setReports(list);
      } catch (e) {
        console.error("[ErrorReportSection] getMyReports 실패:", e);
        if (mounted) setReports([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    const bump = () => setRefreshTick((v) => v + 1);
    window.addEventListener("focus", bump);
    window.addEventListener("codinnator:reports-updated", bump);
    return () => {
      window.removeEventListener("focus", bump);
      window.removeEventListener("codinnator:reports-updated", bump);
    };
  }, []);

  const roomOptions = useMemo(() => {
    const ids = Array.from(
      new Set(reports.map((r) => String(r.roomId)).filter(Boolean)),
    );
    ids.sort((a, b) => Number(a) - Number(b));
    return ids;
  }, [reports]);

  const contributionData = useMemo<ContributionData>(() => {
    const map: ContributionData = {};

    const filteredReports =
      selectedRoomId === "all"
        ? reports
        : reports.filter((r) => String(r.roomId) === selectedRoomId);

    for (const r of filteredReports) {
      if (isSuccessLog(r.display_name, r.error)) continue;

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

  const stats = useMemo<Stats>(() => {
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        className="relative rounded-2xl shadow-xl p-8 bg-[#d4d8dd]"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#cc9999]">
              <Activity className="w-5 h-5 text-[#24292E]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1 tracking-tight text-[#24292E]">
                Error Report Diary
              </h3>
              <p className="text-sm text-[#586069]">
                Track your debugging journey & growth
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateRoomOpen(true)}
            className="
              group flex items-center gap-2 px-5 py-3.5
              rounded-lg font-medium text-sm
              shadow-md
              transition-all duration-200
              bg-[#738da7] hover:bg-[#1775c7]
              text-white
            "
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Create Room
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-12 my-7 mx-20">
          <motion.div
            key={`total-${selectedRoomId}-${stats.totalErrors}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="p-5 rounded-xl shadow-sm transition-all duration-300 min-w-0 bg-[#e8ecf0] border border-[#b4b9be]"
          >
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className="p-1.5 rounded-lg shrink-0 bg-[#b66a6a]">
                <Bug className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider truncate text-[#586069]">
                Total Errors
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-[#24292E]">
              {stats.totalErrors}
            </p>
          </motion.div>

          <motion.div
            key={`days-${selectedRoomId}-${stats.daysWithErrors}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="p-5 rounded-xl shadow-sm transition-all duration-300 min-w-0 bg-[#e8ecf0] border border-[#b4b9be]"
          >
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className="p-1.5 rounded-lg shrink-0 bg-[#67707a]">
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider truncate text-[#586069]">
                Active Days
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-[#24292E]">
              {stats.daysWithErrors}
            </p>
          </motion.div>

          <motion.div
            key={`avg-${selectedRoomId}-${stats.avgErrorsPerDay}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            className="p-5 rounded-xl shadow-sm transition-all duration-300 min-w-0 bg-[#e8ecf0] border border-[#b4b9be]"
          >
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className="p-1.5 rounded-lg shrink-0 bg-[#548364]">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider truncate text-[#586069]">
                Daily Average
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-[#24292E]">
              {stats.avgErrorsPerDay}
            </p>
          </motion.div>
        </div>

        {/* 방별 필터 */}
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
              bg-[#f6f8fa]
              border border-[#d1d5da]
              text-[#24292E]
              focus:border-[#0366d6]
              focus:ring-2
              focus:ring-[#0366d6]/20
              outline-none
            "
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
          className="p-7 rounded-xl bg-[#f6f8fa] border border-[#e1e4e8] shadow-sm"
        >
          <ContributionGraph data={contributionData} />
        </motion.div>
      </motion.div>

      {isCreateRoomOpen && (
        <CreateRoomModal onClose={() => setIsCreateRoomOpen(false)} />
      )}
    </>
  );
}
