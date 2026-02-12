import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import type {
  ErrorLog,
  ContributionData,
  ContributionGraphProps,
} from "@/types/home/contribution";

// 월 이름
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 기여도 레벨별 배경색 (0: 없음 ~ 4: 많음)
const LEVEL_CLASSES = [
  "bg-[#dcdfe2]",
  "bg-[oklch(0.93_0.05_25)]",
  "bg-[oklch(0.85_0.1_25)]",
  "bg-[oklch(0.75_0.14_25)]",
  "bg-[oklch(0.6_0.18_25)]",
] as const;

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// UTC 시간 문자열에 시간 오프셋 적용 (KST +9)
function addHoursToTime(time: string, hours: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  const totalMinutes = ((Number(match[1]) * 60 + Number(match[2]) + hours * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

// 해결 방법 텍스트를 글머리표 배열로 파싱
function parseResolution(rawText: string): string[] {
  const text = (rawText ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  let parts = text.includes("\n") ? text.split("\n") : [text];

  if (parts.length === 1 && parts[0].includes("•")) parts = parts[0].split("•");

  if (parts.length === 1 && /^\s*\d+[.)]\s+/.test(parts[0])) {
    const numberedParts = parts[0]
      .split(/\s*(?=\d+[.)]\s+)/g)
      .map((part) => part.replace(/^\d+[.)]\s+/, "").trim())
      .filter(Boolean);
    if (numberedParts.length > 1) parts = numberedParts;
  }

  if (parts.length === 1) {
    const periodSplitParts = parts[0].split(/(?<=[가-힣)\]])\.\s+/g).map((part) => part.trim()).filter(Boolean);
    if (periodSplitParts.length > 1) parts = periodSplitParts;
  }

  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim())
    .filter(Boolean);
}

export function ContributionGraph({ data, roomOptions }: ContributionGraphProps) {
  const today = useMemo(() => new Date(), []);
  const years = [today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2];

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [activeLog, setActiveLog] = useState<ErrorLog | null>(null);
  const [showRawLogId, setShowRawLogId] = useState<string | null>(null);

  const isShowingRaw = showRawLogId === activeLog?.id;
  const setShowRaw = (visible: boolean) => setShowRawLogId(visible ? (activeLog?.id ?? null) : null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveLog(null); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 선택 연도의 날짜별 기여 데이터
  const contributionData = useMemo<ContributionData>(() => {
    const dataByDate: ContributionData = {};
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateKey = formatDate(currentDate);
      if (selectedYear === today.getFullYear() && currentDate > today) {
        dataByDate[dateKey] = { count: 0, logs: [] };
      } else {
        const allLogs = data?.[dateKey]?.logs ?? [];
        const filteredLogs = selectedRoomId === "all" ? allLogs : allLogs.filter((log) => log.roomId === selectedRoomId);
        dataByDate[dateKey] = { count: filteredLogs.length, logs: filteredLogs };
      }
    }
    return dataByDate;
  }, [data, selectedYear, selectedRoomId, today]);

  // 주 단위로 날짜 분류
  const weeks = useMemo(() => {
    const weekGrid: { date: string; count: number }[][] = [];
    const sortedDates = Object.keys(contributionData).sort();
    let currentWeek: { date: string; count: number }[] = [];

    for (let emptyDayIndex = 0; emptyDayIndex < new Date(sortedDates[0]).getDay(); emptyDayIndex++) {
      currentWeek.push({ date: "", count: -1 });
    }

    for (const date of sortedDates) {
      if (new Date(date).getDay() === 0 && currentWeek.length) { weekGrid.push(currentWeek); currentWeek = []; }
      currentWeek.push({ date, count: contributionData[date].count });
    }
    if (currentWeek.length) weekGrid.push(currentWeek);
    return weekGrid;
  }, [contributionData]);

  // 월 레이블
  const monthLabels = useMemo(() => {
    let lastMonth = -1;
    return weeks.map((week) => {
      const firstRealDay = week.find((day) => day.date !== "");
      if (!firstRealDay) return null;
      const month = new Date(firstRealDay.date).getMonth();
      if (month === lastMonth) return null;
      lastMonth = month;
      return MONTHS[month];
    });
  }, [weeks]);

  // 로그를 방(roomId)별로 그룹화
  const roomGroupedLogs = useMemo(() => {
    const roomBuckets: Record<string, ErrorLog[]> = {};
    for (const log of selectedLogs) {
      const roomKey = (log.roomId ?? "").trim() || "unknown";
      if (!roomBuckets[roomKey]) roomBuckets[roomKey] = [];
      roomBuckets[roomKey].push(log);
    }
    return Object.entries(roomBuckets)
      .sort(([roomIdA], [roomIdB]) =>
        roomIdA === "unknown" ? 1 : roomIdB === "unknown" ? -1 : Number(roomIdA) - Number(roomIdB)
      )
      .map(([roomId, logs]) => ({
        roomId,
        logs: logs.sort((logA, logB) => logB.time.localeCompare(logA.time)),
      }));
  }, [selectedLogs]);

  const getLevelClass = (count: number) => {
    if (count < 0) return "bg-transparent";
    if (count === 0) return LEVEL_CLASSES[0];
    if (count === 1) return LEVEL_CLASSES[1];
    if (count <= 3) return LEVEL_CLASSES[2];
    if (count <= 6) return LEVEL_CLASSES[3];
    return LEVEL_CLASSES[4];
  };

  const rawStacktraceText = activeLog?.stacktrace ?? "";
  const stacktracePreview = rawStacktraceText.length > 2000 ? rawStacktraceText.slice(0, 2000) + "\n... (더보기로 전체 확인)" : rawStacktraceText;
  const resolutionBullets = parseResolution(activeLog?.resolution ?? "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      className="p-7 rounded-xl bg-[#f6f8fa] border border-[#e1e4e8] shadow-sm space-y-7"
    >
      {/* 연도 탭 + 방 필터 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => {
                setSelectedYear(year);
                setSelectedDate(null);
                setSelectedLogs([]);
                setIsLogOpen(false);
                setActiveLog(null);
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border shadow-md ${
                year === selectedYear
                  ? "bg-[#7F838D] text-white border-[#7F838D]"
                  : "bg-white text-[#24292E] border-[#9297A2] hover:bg-[#DCD8D8] hover:border-[#7F838D]"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        {roomOptions && roomOptions.length > 0 && (
          <select
            value={selectedRoomId}
            onChange={(event) => {
              setSelectedRoomId(event.target.value);
              setSelectedDate(null);
              setSelectedLogs([]);
              setIsLogOpen(false);
              setActiveLog(null);
            }}
            className="h-10 px-3 rounded-lg text-sm font-medium shadow-sm cursor-pointer bg-[#fafafa] text-[#24292E] outline-none"
          >
            <option value="all">All Rooms</option>
            {roomOptions.map((roomId) => (
              <option key={roomId} value={roomId}>Room #{roomId}</option>
            ))}
          </select>
        )}
      </div>

      {/* 잔디 그래프 */}
      <div className="w-full overflow-x-auto pb-3">
        <div className="table mx-auto">
          <div className="inline-flex flex-col px-[15px]">
            <div className="flex gap-[3px] mb-4">
              {weeks.map((_, weekIndex) => (
                <div key={weekIndex} className="w-[12px] text-[12px] font-medium text-[#586069] overflow-visible whitespace-nowrap">
                  {monthLabels[weekIndex] ?? ""}
                </div>
              ))}
            </div>
            <div className="flex gap-[4px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => (
                    <button
                      key={dayIndex}
                      title={day.date ? `${day.date} · ${day.count} errors` : ""}
                      className={`w-[11px] h-[15px] rounded-sm ${getLevelClass(day.count)} hover:ring-1 hover:ring-offset-1 ${day.count > 0 ? "hover:ring-[#24292E]/40" : "hover:ring-[#9297A2]/40"} hover:scale-125 transition-all duration-200`}
                      onClick={() => {
                        if (!day.date) return;
                        setSelectedDate(day.date);
                        setSelectedLogs(
                          [...(contributionData[day.date]?.logs ?? [])].sort((logA, logB) =>
                            logB.time.localeCompare(logA.time)
                          )
                        );
                        setIsLogOpen(true);
                        setActiveLog(null);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg text-[#24292E] border border-[#afb4be] shadow-md">
          <span>Less</span>
          <div className="flex gap-1">
            {LEVEL_CLASSES.map((levelClass, levelIndex) => (
              <div key={levelIndex} className={`w-3 h-3 rounded-sm ${levelClass}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* 선택된 날짜의 오류 목록 */}
      {selectedDate && (
        <div className="rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-30 bg-[#b3b8c3] border border-[#bcc2d0] shadow-lg">
          <button
            onClick={() => setIsLogOpen((isOpen) => !isOpen)}
            className="flex w-full justify-between items-center group"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4c5156]" />
              <span className="font-semibold text-white">{selectedDate}</span>
              <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-[#7a8692] text-white">
                {selectedLogs.length}건
              </span>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform group-hover:scale-110 text-white ${isLogOpen ? "rotate-180" : ""}`} />
          </button>

          {isLogOpen && (
            <div className="mt-4">
              {selectedLogs.length === 0 ? (
                <p className="text-sm py-8 text-center text-white">해당 날짜에는 발생한 오류가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {roomGroupedLogs.map(({ roomId, logs }) => (
                    <div key={roomId}>
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-2 bg-[#8c949f] text-white">
                        <span>Room #{roomId === "unknown" ? "?" : roomId}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#7F838D] text-white">{logs.length}건</span>
                      </div>
                      <ul className="space-y-2.5">
                        {logs.map((log) => (
                          <li
                            key={log.id}
                            onClick={() => setActiveLog(log)}
                            className="cursor-pointer rounded-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 bg-white shadow-md hover:bg-[#a8b6c7] hover:shadow-lg group"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-[#24292E] group-hover:text-white transition-colors">
                                {log.display_name}
                              </span>
                              <span className="text-xs font-medium px-2 py-1 rounded-lg bg-[#d8dde8] group-hover:bg-[#94a2b0] text-[#24292E] group-hover:text-white transition-colors">
                                {addHoursToTime(log.time, 9)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 오류 상세 모달 */}
      {activeLog && (
        <div
          className="fixed inset-0 z-50 p-4 overflow-y-auto backdrop-blur-md animate-in fade-in duration-300 bg-[rgba(70,82,96,0.8)]"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveLog(null); }}
        >
          <div className="mx-auto w-full max-w-3xl rounded-xl shadow-2xl flex flex-col h-[95vh] animate-in slide-in-from-bottom-8 duration-500 bg-[#e2e4ea] border border-[#9297A2]">
            {/* 모달 헤더 */}
            <div className="flex items-start justify-between gap-3 p-5 rounded-t-xl bg-[#91a7c0] border-b border-[#a0aab6]">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">{activeLog.display_name}</h3>
                <div className="flex items-center gap-2 text-xs font-medium text-white">
                  <span>{selectedDate}</span>
                  <span>·</span>
                  <span>{addHoursToTime(activeLog.time, 9)}</span>
                  {activeLog.roomId && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-1 rounded-lg bg-[#778097]">Room #{activeLog.roomId}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="shrink-0 p-2 rounded-lg hover:bg-[#3A4149] text-white transition-all hover:scale-110"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="flex-1 p-7 overflow-y-auto space-y-6">
              {/* 오류 내용 */}
              <div>
                <div className="text-sm font-semibold mb-3 flex items-center gap-2.5 text-[#41454a]">
                  <div className="w-1.5 h-5 rounded-full bg-[#d87a7a]" />오류 내용
                </div>
                <div className="p-5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed bg-white border border-[#d87a7a] text-[#24292E]">
                  {activeLog.error}
                </div>
              </div>

              {/* 스택 트레이스 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold flex items-center gap-2.5 text-[#41454a]">
                    <div className="w-1.5 h-5 rounded-full bg-[#7F838D]" />원본 출력/Stacktrace
                  </div>
                  <button
                    onClick={() => setShowRaw(!isShowingRaw)}
                    className="text-xs px-4 py-2 rounded-lg font-medium bg-[#7d8791] text-[#f8f8f8] border border-[#91a0ad] hover:bg-[#5d6771] transition-all duration-200"
                  >
                    {isShowingRaw ? "접기" : "펼치기"}
                  </button>
                </div>
                <pre className={`p-4 text-xs rounded-lg overflow-auto whitespace-pre bg-white border border-[#a3a3a5] text-[#24292E] ${isShowingRaw ? "max-h-[60vh]" : "max-h-[30vh]"}`}>
                  {isShowingRaw ? rawStacktraceText : stacktracePreview}
                </pre>
              </div>

              {/* 해결 방법 */}
              <div>
                <div className="text-sm font-semibold mb-3 flex items-center gap-2.5 text-[#41454a]">
                  <div className="w-1.5 h-5 rounded-full bg-[#7ba87b]" />해결 방법
                </div>
                {resolutionBullets.length > 0 ? (
                  <ul className="space-y-2.5">
                    {resolutionBullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex gap-3 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed bg-white border border-[#7ba87b] text-[#24292E]">
                        <span className="text-[#7ba87b] font-bold text-[1.1rem]">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed bg-white border border-[#7ba87b] text-[#24292E]">
                    {activeLog.resolution}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
