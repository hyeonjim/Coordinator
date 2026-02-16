/**
 * ErrorReportSection - 에러 통계 대시보드 (통계 카드 + 기여 그래프 + 방 생성)
 *
 * [React 기초 - useMemo로 데이터 가공]
 * - reports 배열을 useMemo로 가공: 방 목록, 기여 데이터, 통계 등
 * - 원본 데이터(reports)가 바뀔 때만 재계산 → 성능 최적화
 *
 * [React 기초 - useEffect로 데이터 페칭]
 * - 컴포넌트 마운트 시 API로 리포트 목록을 가져옴
 * - mounted 플래그: 비동기 응답이 왔을 때 컴포넌트가 이미 언마운트되었으면 상태 업데이트 방지
 * - 이 패턴은 메모리 누수를 방지하는 중요한 패턴
 *
 * [React 기초 - 이벤트 리스너]
 * - window "focus" 이벤트: 탭에 다시 포커스가 올 때 데이터 새로고침
 * - 커스텀 이벤트 "codinnator:reports-updated": AI 분석 완료 시 자동 새로고침
 *
 * [사용된 기술]
 * - framer-motion: 카드별 시차 애니메이션 (delay 속성)
 * - Intl.DateTimeFormat: 타임존을 고려한 날짜/시간 포맷팅
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Bug, Calendar, Activity, TrendingUp } from "lucide-react";
import { ContributionGraph } from "./ContributionGraph";
import CreateRoomModal from "@/components/home/create-room";
import { aiService } from "@/services/ai/aiService";
import type { TestReportResponse } from "@/types/ai";
import type { Stats } from "@/types/home";
import type { ContributionData } from "@/types/home";

const KST_TIMEZONE = "Asia/Seoul";

function toKstDateTime(timestamp?: string | null) {
  const raw = (timestamp ?? "").trim();
  const iso = raw
    ? /[zZ]|[+-]\d{2}:\d{2}$/.test(raw) ? raw : `${raw}+09:00`
    : new Date().toISOString();
  const parsed = new Date(iso);
  const base = isNaN(parsed.getTime()) ? new Date() : parsed;

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(base);

  return { date, time };
}

export default function ErrorReportSection() {
  const [reports, setReports] = useState<TestReportResponse[]>([]); // API에서 받은 리포트 목록
  const [refreshTick, setRefreshTick] = useState(0); // 새로고침 트리거 (값이 바뀌면 useEffect 재실행)
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false); // 방 생성 모달 열림 상태

  // useEffect: 리포트 데이터 페칭
  // mounted 플래그: 비동기 응답이 왔을 때 컴포넌트가 아직 존재하는지 확인 (메모리 누수 방지)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await aiService.getMyReports();
        if (mounted) setReports(list);
      } catch {
        if (mounted) setReports([]);
      }
    })();
    return () => { mounted = false; };
  }, [refreshTick]);

  // 이벤트 리스너 등록: 탭 포커스 또는 커스텀 이벤트 시 데이터 새로고침
  useEffect(() => {
    const refresh = () => setRefreshTick((previous) => previous + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("codinnator:reports-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("codinnator:reports-updated", refresh);
    };
  }, []);

  const roomOptions = useMemo(() => {
    const ids = Array.from(new Set(reports.map((report) => String(report.roomId)).filter(Boolean)));
    ids.sort((roomIdA, roomIdB) => Number(roomIdA) - Number(roomIdB));
    return ids;
  }, [reports]);

  // useMemo: reports 배열을 날짜별 기여 데이터로 가공 (reports가 바뀔 때만 재계산)
  const contributionData = useMemo<ContributionData>(() => {
    const dataMap: ContributionData = {};

    for (const report of reports) {
      const { date, time } = toKstDateTime(report.timestamp);
      if (!dataMap[date]) dataMap[date] = { count: 0, logs: [] };
      dataMap[date].logs.push({
        id: String(report.id),
        roomId: String(report.roomId),
        time,
        display_name: report.display_name,
        error: report.error,
        stacktrace: report.stacktrace ?? "",
        resolution: report.resolution,
      });
    }

    for (const dayData of Object.values(dataMap)) {
      dayData.logs.sort((logA, logB) => logB.time.localeCompare(logA.time));
      dayData.count = dayData.logs.length;
    }

    return dataMap;
  }, [reports]);

  const stats = useMemo<Stats>(() => {
    const days = Object.values(contributionData);
    const totalErrors = days.reduce((accumulator, dayData) => accumulator + dayData.count, 0);
    const daysWithErrors = days.filter((dayData) => dayData.count > 0).length;
    const avgErrorsPerDay = daysWithErrors > 0 ? (totalErrors / daysWithErrors).toFixed(1) : "0";
    return { totalErrors, daysWithErrors, avgErrorsPerDay };
  }, [contributionData]);

  const statCards = [
    { key: `total-${stats.totalErrors}`, icon: <Bug className="w-3.5 h-3.5 text-white" />, bg: "bg-[#b66a6a]", label: "Total Errors", value: stats.totalErrors, delay: 0.2 },
    { key: `days-${stats.daysWithErrors}`, icon: <Calendar className="w-3.5 h-3.5 text-white" />, bg: "bg-[#67707a]", label: "Active Days", value: stats.daysWithErrors, delay: 0.3 },
    { key: `avg-${stats.avgErrorsPerDay}`, icon: <TrendingUp className="w-3.5 h-3.5 text-white" />, bg: "bg-[#548364]", label: "Daily Average", value: stats.avgErrorsPerDay, delay: 0.4 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      className="relative rounded-2xl shadow-xl p-8 bg-[#d4d8dd]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#cc9999]">
            <Activity className="w-5 h-5 text-gh-dark" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1 tracking-tight text-gh-dark">Error Report Diary</h3>
            <p className="text-sm text-gh-muted">Track your debugging journey & growth</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateRoomOpen(true)}
          className="group flex items-center gap-2 px-4 py-3.5 mr-4 rounded-lg font-medium text-sm shadow-md transition-all duration-200 bg-[#738da7] hover:bg-[#1775c7] text-white"
        >
          <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-200" />
          Create Room
        </button>
      </div>

      {/* map으로 통계 카드 렌더링: 배열의 각 항목을 motion.div로 변환 */}
      <div className="grid grid-cols-3 gap-12 my-10 mx-20">
        {statCards.map(({ key, icon, bg, label, value, delay }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
            className="p-5 rounded-xl shadow-sm transition-all duration-300 min-w-0 bg-[#e8ecf0] border border-[#b4b9be]"
          >
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className={`p-1.5 rounded-lg shrink-0 ${bg}`}>{icon}</div>
              <span className="text-[10px] font-medium uppercase tracking-wider truncate text-gh-muted">{label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-gh-dark">{value}</p>
          </motion.div>
        ))}
      </div>

      <ContributionGraph data={contributionData} roomOptions={roomOptions} />

      {isCreateRoomOpen && (
        <CreateRoomModal onClose={() => setIsCreateRoomOpen(false)} />
      )}
    </motion.div>
  );
}
