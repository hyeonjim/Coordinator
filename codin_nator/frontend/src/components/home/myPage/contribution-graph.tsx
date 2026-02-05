import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface ErrorLog {
  id: string;
  roomId?: string; // ✅ 방 번호(없으면 unknown)
  time: string; // "08:20" 같은 형태라고 가정
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

interface ContributionGraphProps {
  data?: ContributionData; // ✅ MyPage에서 주입
}

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
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [activeLog, setActiveLog] = useState<ErrorLog | null>(null);

  // ✅ 긴 출력 때문에 모달이 터지는 것 방지: 원본 출력 접기/펴기
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    // activeLog 바뀔 때마다 원본 출력 접힘 상태로 리셋
    setShowRaw(false);
  }, [activeLog?.id]);

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
    if (count === 0) return "contrib-level-0";
    if (count === 1) return "contrib-level-1";
    if (count <= 3) return "contrib-level-2";
    if (count <= 6) return "contrib-level-3";
    return "contrib-level-4";
  };

  const years = [
    today.getFullYear(),
    today.getFullYear() - 1,
    today.getFullYear() - 2,
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

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
    <div className="space-y-4">
      {/* ===== 연도 탭 ===== */}
      <div className="flex gap-2">
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
            className={`px-3 py-1 rounded-md text-sm ${
              year === selectedYear
                ? "bg-muted-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* ===== 월 ===== */}
      <div className="flex ml-[28px] text-xs text-muted-foreground">
        {months.map((m) => (
          <span key={m} className="w-[66px]">
            {m}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* 요일 */}
        <div className="flex flex-col gap-[2px] text-xs pt-[2px] text-muted-foreground">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3">
              {i === 1 && "Mon"}
              {i === 3 && "Wed"}
              {i === 5 && "Fri"}
            </div>
          ))}
        </div>

        {/* 잔디 */}
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <button
                  key={di}
                  title={day.date ? `${day.date} · ${day.count} errors` : ""}
                  className={`w-3 h-3 rounded-sm ${getContribClass(
                    day.count,
                  )} hover:shadow-md hover:scale-110 transition`}
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

      {/* ===== 범례 ===== */}
      <div className="flex justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-3 h-3 rounded-sm contrib-level-${i}`} />
        ))}
        <span>More</span>
      </div>

      {/* ===== 오류 목록 ===== */}
      {selectedDate && (
        <div className="rounded-lg border p-4">
          <button
            onClick={() => setIsLogOpen((v) => !v)}
            className="flex w-full justify-between"
          >
            <span className="font-semibold">
              📅 {selectedDate} · {selectedLogs.length}건
            </span>
            <ChevronDown
              className={`h-4 w-4 transition ${isLogOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isLogOpen && (
            <div className="mt-3">
              {selectedLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  해당 날짜에는 발생한 오류가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {roomGroupedLogs.map(([roomId, logs]) => (
                    <div key={roomId}>
                      {shouldShowRoomHeader && (
                        <div className="flex items-center justify-between px-1 text-sm font-medium text-muted-foreground">
                          <span>
                            🏠 Room #{roomId === "unknown" ? "?" : roomId}
                          </span>
                          <span>{logs.length}건</span>
                        </div>
                      )}

                      <ul
                        className={`${shouldShowRoomHeader ? "mt-2 " : ""}space-y-2`}
                      >
                        {logs.map((log) => (
                          <li
                            key={log.id}
                            onClick={() => setActiveLog(log)}
                            className="cursor-pointer rounded border p-2 hover:bg-muted"
                          >
                            <div className="flex justify-between text-sm">
                              <span>{log.display_name}</span>
                              <span>{addHoursToTimeString(log.time, 9)}</span>
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
          className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveLog(null);
          }}
        >
          <div className="mx-auto w-full max-w-2xl bg-background rounded-lg shadow-lg border flex flex-col max-h-[85vh]">
            {/* 헤더(고정) */}
            <div className="flex items-start justify-between gap-3 p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {activeLog.display_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedDate} · {addHoursToTimeString(activeLog.time, 9)}
                  {activeLog.roomId ? ` · Room #${activeLog.roomId}` : ""}
                </p>
              </div>

              <button
                onClick={() => setActiveLog(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문(스크롤) */}
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <b>오류 내용</b>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {activeLog.error}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <b>원본 출력/Stacktrace</b>
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="text-xs px-2 py-1 rounded border hover:bg-muted"
                  >
                    {showRaw ? "접기" : "펼치기"}
                  </button>
                </div>

                {showRaw ? (
                  <pre className="mt-2 bg-muted p-3 text-xs rounded overflow-auto max-h-[40vh] whitespace-pre">
                    {rawText}
                  </pre>
                ) : (
                  <pre className="mt-2 bg-muted p-3 text-xs rounded overflow-auto max-h-[18vh] whitespace-pre">
                    {rawPreview}
                  </pre>
                )}
              </div>

              <div>
                <b>해결 방법</b>
                {resolutionBullets.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                    {resolutionBullets.map((b, i) => (
                      <li key={i} className="whitespace-pre-wrap">
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {activeLog.resolution}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
