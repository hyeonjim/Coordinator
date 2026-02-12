import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type {
  ErrorLog,
  ContributionData,
  ContributionGraphProps,
} from "@/types/home/contribution";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// contrib-level 0~4 에 대응하는 Tailwind 배경색 클래스
const CONTRIB_LEVEL_CLASSES = [
  "bg-[#dcdfe2]",
  "bg-[oklch(0.93_0.05_25)]",
  "bg-[oklch(0.85_0.1_25)]",
  "bg-[oklch(0.75_0.14_25)]",
  "bg-[oklch(0.6_0.18_25)]",
] as const;

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** ✅ "HH:mm" 문자열에 hours만 더해서 다시 "HH:mm"로 반환 (24시간 순환) */
function addHoursToTimeString(time: string, addHours: number): string {
  // 기대 포맷: "HH:mm"
  const m = /^(\d{1,2}):(\d{2})$/.exec((time ?? "").trim());
  if (!m) return time; // 포맷이 다르면 그냥 원본 표시

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return time;

  const total = (hh * 60 + mm + addHours * 60) % (24 * 60);
  const normalized = total < 0 ? total + 24 * 60 : total;

  const newH = Math.floor(normalized / 60);
  const newM = normalized % 60;

  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/** ✅ 해결 방법을 글머리표로 예쁘게 만들기 (안전 버전) */
function splitResolutionToBullets(text: string): string[] {
  const t = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (!t) return [];

  // 1) 줄바꿈이 있으면 줄 단위로
  let parts: string[] = t.includes("\n") ? t.split("\n") : [t];

  // 2) 한 줄인데 • 로 이어붙인 형태면 분리
  if (parts.length === 1 && parts[0].includes("•")) {
    parts = parts[0].split("•");
  }

  // 3) 한 줄인데 "1) ... 2) ..." / "1. ... 2. ..." 형태면 분리
  // ✅ 단, 문장이 '번호로 시작'할 때만 분리 (수식의 90) 같은 걸 번호로 오해하지 않게)
  if (parts.length === 1 && /^\s*\d+[.)]\s+/.test(parts[0])) {
    const maybe = parts[0]
      .split(/\s*(?=\d+[.)]\s+)/g)
      .map((x) => x.replace(/^\d+[.)]\s+/, "").trim())
      .filter(Boolean);

    if (maybe.length > 1) parts = maybe;
  }

  // 4) (fallback) 그래도 한 줄이면, "한국어 문장형"일 때만 마침표 기준 분리
  // - OrderService.calculateFinalPrice 같은 식별자 '.'는 앞이 영문이라 잘 안 잘리게 함
  if (parts.length === 1) {
    const one = parts[0].trim();

    // "한글(또는 ) ] ) + 마침표 + 공백" 패턴이 있을 때만 시도
    const splitByPeriod = one
      .split(/(?<=[가-힣)\]])\.\s+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    if (splitByPeriod.length > 1) parts = splitByPeriod;
  }

  // 5) 정리: 공백 제거 + 앞에 붙은 번호/불릿 제거
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, "").trim())
    .filter(Boolean);
}

export function ContributionGraph({ data }: ContributionGraphProps) {
  const today = useMemo(() => new Date(), []);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [activeLog, setActiveLog] = useState<ErrorLog | null>(null);

  // ✅ 긴 출력 때문에 모달이 터지는 것 방지: 원본 출력 접기/펴기
  // activeLog가 바뀔 때마다 접힘 상태로 리셋 (파생 state 패턴)
  const [showRawLogId, setShowRawLogId] = useState<string | null>(null);
  const showRaw = showRawLogId === activeLog?.id;
  const setShowRaw = (v: boolean) =>
    setShowRawLogId(v ? (activeLog?.id ?? null) : null);

  useEffect(() => {
    // ESC로 모달 닫기
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveLog(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const contributionData = useMemo<ContributionData>(() => {
    const result: ContributionData = {};

    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = formatDate(d);

      // 미래 날짜(올해 기준)는 0 처리
      if (selectedYear === today.getFullYear() && d > today) {
        result[dateStr] = { count: 0, logs: [] };
        continue;
      }

      const logs = data?.[dateStr]?.logs ?? [];
      result[dateStr] = { count: logs.length, logs };
    }

    return result;
  }, [data, selectedYear, today]);

  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    const dates = Object.keys(contributionData).sort();

    let currentWeek: { date: string; count: number }[] = [];
    const padding = new Date(dates[0]).getDay();

    for (let i = 0; i < padding; i++) {
      currentWeek.push({ date: "", count: -1 });
    }

    dates.forEach((date) => {
      const d = new Date(date);
      if (d.getDay() === 0 && currentWeek.length) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({
        date,
        count: contributionData[date].count,
      });
    });

    if (currentWeek.length) result.push(currentWeek);
    return result;
  }, [contributionData]);

  const getContribClass = (count: number) => {
    if (count < 0) return "bg-transparent";
    if (count === 0) return CONTRIB_LEVEL_CLASSES[0];
    if (count === 1) return CONTRIB_LEVEL_CLASSES[1];
    if (count <= 3) return CONTRIB_LEVEL_CLASSES[2];
    if (count <= 6) return CONTRIB_LEVEL_CLASSES[3];
    return CONTRIB_LEVEL_CLASSES[4];
  };

  const years = [
    today.getFullYear(),
    today.getFullYear() - 1,
    today.getFullYear() - 2,
  ];

  /**
   * 각 week 열마다 표시할 월 레이블 (월이 바뀌는 첫 번째 열에만 표시, 나머지는 null)
   */
  const monthLabels = useMemo<(string | null)[]>(() => {
    const labels: (string | null)[] = [];
    let lastMonth = -1;
    for (const week of weeks) {
      const firstReal = week.find((d) => d.date !== "");
      if (!firstReal) {
        labels.push(null);
        continue;
      }
      const month = new Date(firstReal.date).getMonth();
      if (month !== lastMonth) {
        labels.push(MONTHS[month]);
        lastMonth = month;
      } else {
        labels.push(null);
      }
    }
    return labels;
  }, [weeks]);

  const rawText = activeLog?.stacktrace ?? "";
  const rawPreview =
    rawText.length > 2000
      ? rawText.slice(0, 2000) + "\n... (더보기로 전체 확인)"
      : rawText;

  const resolutionBullets = splitResolutionToBullets(
    activeLog?.resolution ?? "",
  );

  /**
   * ✅ 선택된 날짜의 로그를 방(roomId)별로 묶어서 보여주기
   * - "전체"일 때는 여기서 roomId 기준으로 구분해서 보여준다.
   */
  const roomGroupedLogs = useMemo(() => {
    const buckets: Record<string, ErrorLog[]> = {};
    for (const log of selectedLogs) {
      const key = (log.roomId ?? "").trim() || "unknown";
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(log);
    }

    const entries = Object.entries(buckets).sort(([a], [b]) => {
      if (a === "unknown" && b === "unknown") return 0;
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return Number(a) - Number(b);
    });

    // 방 내부는 시간 내림차순
    for (const [, logs] of entries) {
      logs.sort((x, y) => y.time.localeCompare(x.time));
    }

    return entries;
  }, [selectedLogs]);

  // ✅ 방이 2개 이상 섞여 있을 때만 헤더(ROOM 섹션)를 보여주기
  const shouldShowRoomHeader = true;
  // const shouldShowRoomHeader = roomGroupedLogs.length > 1;

  return (
    <div className="space-y-7">
      {/* ===== 연도 탭 ===== */}
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
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border shadow-md
              ${
                year === selectedYear
                  ? "bg-[#7F838D] text-white border-[#7F838D]"
                  : "bg-white text-[#24292E] border-[#9297A2] hover:bg-[#DCD8D8] hover:text-[#24292E] hover:border-[#7F838D]"
              }`}
          >
            {year}
          </button>
        ))}
      </div>
      {/* ===== 월 & 잔디 (큰 화면: 중앙 정렬 / 작은 화면: 가로 스크롤) ===== */}
      <div className="w-full overflow-x-auto pb-3">
        <div className="table mx-auto">
          <div className="inline-flex flex-col px-[15px]">
            {/* 월 레이블 — week 열과 1:1 매핑 */}
            <div className="flex gap-[3px] mb-3">
              {weeks.map((_, wi) => (
                <div
                  key={wi}
                  className="w-[11px] text-[12px] font-medium text-[#586069] overflow-visible whitespace-nowrap"
                >
                  {monthLabels[wi] ?? ""}
                </div>
              ))}
            </div>
            {/* 잔디 */}
            <div className="flex gap-[4px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) => (
                    <button
                      key={di}
                      title={
                        day.date ? `${day.date} · ${day.count} errors` : ""
                      }
                      className={`w-[11px] h-[15px] rounded-sm ${getContribClass(day.count)}
                      hover:ring-1 hover:ring-offset-1
                      ${day.count > 0 ? "hover:ring-[#24292E]/40" : "hover:ring-[#9297A2]/40"}
                      hover:scale-125 transition-all duration-200`}
                      onClick={() => {
                        if (!day.date) return;
                        setSelectedDate(day.date);
                        setSelectedLogs(
                          [...(contributionData[day.date]?.logs ?? [])].sort(
                            (a, b) => b.time.localeCompare(a.time),
                          ),
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
      {/* ===== 범례 ===== */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-3 text-xs font-medium px-5 py-2.5 rounded-lg text-[#24292E] bg-transparent border border-[#afb4be] shadow-md">
          <span>Less</span>
          <div className="flex gap-2">
            {CONTRIB_LEVEL_CLASSES.map((cls, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${cls}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      {/* ===== 오류 목록 ===== */}
      {selectedDate && (
        <div
          key={`logs-${selectedDate}`}
          className="rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-30 bg-[#9297A2] border border-[#9297A2] shadow-lg"
        >
          <button
            onClick={() => setIsLogOpen((v) => !v)}
            className="flex w-full justify-between items-center group"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#24292E]" />
              <span className="font-semibold text-white">{selectedDate}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#24292E] text-white">
                {selectedLogs.length}건
              </span>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform group-hover:scale-110 text-white ${isLogOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {isLogOpen && (
            <div className="mt-4">
              {selectedLogs.length === 0 ? (
                <div className="text-sm py-8 text-center text-white">
                  해당 날짜에는 발생한 오류가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {roomGroupedLogs.map(([roomId, logs]) => (
                    <div key={roomId}>
                      {shouldShowRoomHeader && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-2 bg-[#586069] text-white">
                          <span>
                            Room #{roomId === "unknown" ? "?" : roomId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[#7F838D] text-white">
                            {logs.length}건
                          </span>
                        </div>
                      )}

                      <ul className="space-y-2.5">
                        {logs.map((log) => (
                          <li
                            key={log.id}
                            onClick={() => setActiveLog(log)}
                            className="cursor-pointer rounded-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 bg-white border border-white shadow-md hover:bg-[#3A4149] hover:border-[#3A4149] hover:shadow-lg group"
                          >
                            <div className="flex justify-between items-center">
                              <span className="log-name text-sm font-medium text-[#24292E] group-hover:text-white transition-colors">
                                {log.display_name}
                              </span>
                              <span className="log-time-container text-xs font-medium px-2 py-1 rounded-lg bg-[#9297A2] group-hover:bg-[#24292E] transition-colors">
                                <span className="log-time text-[#24292E] group-hover:text-white transition-colors">
                                  {addHoursToTimeString(log.time, 9)}
                                </span>
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
      {/* ===== 상세 모달 ===== */}
      {activeLog && (
        <div
          key={`modal-${activeLog.id}`}
          className="fixed inset-0 z-50 p-4 overflow-y-auto backdrop-blur-md animate-in fade-in duration-300 bg-[rgba(58,65,73,0.8)]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveLog(null);
          }}
        >
          <div className="mx-auto w-full max-w-3xl rounded-xl shadow-2xl flex flex-col h-[95vh] animate-in slide-in-from-bottom-8 duration-500 bg-[#9297A2] border border-[#9297A2]">
            {/* 헤더(고정) */}
            <div className="flex items-start justify-between gap-3 p-7 rounded-t-xl bg-[#414c58] border-b border-[#24292E]">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {activeLog.display_name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-white">
                  <span>{selectedDate}</span>
                  <span>·</span>
                  <span>{addHoursToTimeString(activeLog.time, 9)}</span>
                  {activeLog.roomId && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-1 rounded-lg bg-[#7F838D] text-white">
                        Room #{activeLog.roomId}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveLog(null)}
                className="shrink-0 p-2 rounded-lg transition-all hover:scale-110 text-white hover:bg-[#3A4149]"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문(스크롤) */}
            <div className="flex-1 p-7 overflow-y-auto space-y-6">
              <div>
                <div className="text-sm font-semibold mb-3 flex items-center gap-2.5 text-white">
                  <div className="w-1.5 h-5 rounded-full bg-[#d87a7a]" />
                  오류 내용
                </div>
                <div className="p-5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed bg-white border border-[#d87a7a] text-[#24292E]">
                  {activeLog.error}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold flex items-center gap-2.5 text-white">
                    <div className="w-1.5 h-5 rounded-full bg-[#7F838D]" />
                    원본 출력/Stacktrace
                  </div>
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-[#24292E] text-white border border-[#24292E] hover:bg-[#3A4149]"
                  >
                    {showRaw ? "접기" : "펼치기"}
                  </button>
                </div>

                {showRaw ? (
                  <pre className="p-4 text-xs rounded-lg overflow-auto max-h-[60vh] whitespace-pre bg-white border border-[#ECEAEA] text-[#24292E]">
                    {rawText}
                  </pre>
                ) : (
                  <pre className="p-4 text-xs rounded-lg overflow-auto max-h-[30vh] whitespace-pre bg-white border border-[#ECEAEA] text-[#24292E]">
                    {rawPreview}
                  </pre>
                )}
              </div>

              <div>
                <div className="text-sm font-semibold mb-3 flex items-center gap-2.5 text-white">
                  <div className="w-1.5 h-5 rounded-full bg-[#7ba87b]" />
                  해결 방법
                </div>
                {resolutionBullets.length > 0 ? (
                  <ul className="space-y-2.5">
                    {resolutionBullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-3 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed bg-white border border-[#7ba87b] text-[#24292E]"
                      >
                        <span className="text-[#7ba87b] font-bold text-[1.1rem]">
                          •
                        </span>
                        <span>{b}</span>
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
    </div>
  );
}
