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
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
            style={{
              backgroundColor: year === selectedYear ? "#4a535c" : "transparent",
              color: year === selectedYear ? "#ECEAEA" : "#24292E",
              borderWidth: "1px",
              borderColor: year === selectedYear ? "#24292E" : "#9297A2",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              if (year !== selectedYear) {
                e.currentTarget.style.backgroundColor = "#24292E";
                e.currentTarget.style.color = "#ECEAEA";
                e.currentTarget.style.borderColor = "#24292E";
              }
            }}
            onMouseLeave={(e) => {
              if (year !== selectedYear) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#24292E";
                e.currentTarget.style.borderColor = "#9297A2";
              }
            }}
          >
            {year}
          </button>
        ))}
      </div>
      {/* ===== 월 & 잔디 (가로 스크롤 영역) ===== */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          {/* 월 */}
          <div className="flex justify-center mb-2">
            <div
              className="flex ml-[28px] text-xs font-medium tracking-wide"
              style={{ color: "#24292E" }}
            >
              {months.map((m) => (
                <span key={m} className="w-[70px]">
                  {m}
                </span>
              ))}
            </div>
          </div>
          {/* 잔디 */}
          <div className="flex gap-2 justify-center">
            <div className="flex gap-[4px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) => (
                    <button
                      key={di}
                      title={day.date ? `${day.date} · ${day.count} errors` : ""}
                      className={`w-3 h-3 rounded-sm ${getContribClass(day.count)}
                        hover:ring-2 hover:ring-offset-1
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
      <div className="flex justify-center">
        <div
          className="flex items-center gap-3 text-xs font-medium px-5 py-2.5 rounded-lg"
          style={{
            color: "#24292E",
            backgroundColor: "transparent",
            borderColor: "#9297A2",
            borderWidth: "1px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <span>Less</span>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-sm contrib-level-${i} transition-all duration-200 hover:scale-150 hover:ring-2 hover:ring-offset-1 hover:ring-[#24292E]`}
                style={{
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      {/* ===== 오류 목록 ===== */}
      {selectedDate && (
        <div
          key={`logs-${selectedDate}`}
          className="rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-30"
          style={{
            backgroundColor: "#9297A2",
            borderColor: "#9297A2",
            borderWidth: "1px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <button
            onClick={() => setIsLogOpen((v) => !v)}
            className="flex w-full justify-between items-center group"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#24292E" }}
              />
              <span className="font-semibold" style={{ color: "#ECEAEA" }}>
                {selectedDate}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#24292E",
                  color: "#ECEAEA",
                }}
              >
                {selectedLogs.length}건
              </span>
            </div>
            <ChevronDown
              className="h-5 w-5 transition-transform group-hover:scale-110"
              style={{
                color: "#ECEAEA",
                transform: isLogOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {isLogOpen && (
            <div className="mt-4">
              {selectedLogs.length === 0 ? (
                <div
                  className="text-sm py-8 text-center"
                  style={{ color: "#ECEAEA" }}
                >
                  해당 날짜에는 발생한 오류가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {roomGroupedLogs.map(([roomId, logs]) => (
                    <div key={roomId}>
                      {shouldShowRoomHeader && (
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-2"
                          style={{
                            backgroundColor: "#24292E",
                            color: "#ECEAEA",
                          }}
                        >
                          <span>
                            Room #{roomId === "unknown" ? "?" : roomId}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              backgroundColor: "#3A4149",
                              color: "#ECEAEA",
                            }}
                          >
                            {logs.length}건
                          </span>
                        </div>
                      )}

                      <ul className="space-y-2.5">
                        {logs.map((log) => (
                          <li
                            key={log.id}
                            onClick={() => setActiveLog(log)}
                            className="cursor-pointer rounded-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5"
                            style={{
                              backgroundColor: "#ECEAEA",
                              borderColor: "#ECEAEA",
                              borderWidth: "1px",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#3A4149";
                              e.currentTarget.style.borderColor = "#3A4149";
                              e.currentTarget.style.boxShadow =
                                "0 3px 10px rgba(0, 0, 0, 0.3)";
                              const nameSpan = e.currentTarget.querySelector('.log-name') as HTMLElement;
                              const timeSpan = e.currentTarget.querySelector('.log-time') as HTMLElement;
                              const timeContainer = e.currentTarget.querySelector('.log-time-container') as HTMLElement;
                              if (nameSpan) nameSpan.style.color = "#ECEAEA";
                              if (timeSpan) timeSpan.style.color = "#ECEAEA";
                              if (timeContainer) timeContainer.style.backgroundColor = "#24292E";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#ECEAEA";
                              e.currentTarget.style.borderColor = "#ECEAEA";
                              e.currentTarget.style.boxShadow =
                                "0 2px 6px rgba(0, 0, 0, 0.1)";
                              const nameSpan = e.currentTarget.querySelector('.log-name') as HTMLElement;
                              const timeSpan = e.currentTarget.querySelector('.log-time') as HTMLElement;
                              const timeContainer = e.currentTarget.querySelector('.log-time-container') as HTMLElement;
                              if (nameSpan) nameSpan.style.color = "#24292E";
                              if (timeSpan) timeSpan.style.color = "#24292E";
                              if (timeContainer) timeContainer.style.backgroundColor = "#9297A2";
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span
                                className="log-name text-sm font-medium"
                                style={{ color: "#24292E" }}
                              >
                                {log.display_name}
                              </span>
                              <span
                                className="log-time-container text-xs font-medium px-2 py-1 rounded-lg"
                                style={{
                                  backgroundColor: "#9297A2",
                                }}
                              >
                                <span className="log-time" style={{ color: "#24292E" }}>
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
          className="fixed inset-0 z-50 p-4 overflow-y-auto backdrop-blur-md animate-in fade-in duration-300"
          style={{ backgroundColor: "rgba(58, 65, 73, 0.8)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveLog(null);
          }}
        >
          <div
            className="mx-auto w-full max-w-3xl rounded-xl shadow-2xl flex flex-col h-[95vh] animate-in slide-in-from-bottom-8 duration-500"
            style={{
              backgroundColor: "#9297A2",
              borderColor: "#9297A2",
              borderWidth: "1px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* 헤더(고정) */}
            <div
              className="flex items-start justify-between gap-3 p-7 rounded-t-xl bg-[#414c58]"
              style={{
                borderBottomColor: "#24292E",
                borderBottomWidth: "1px",
              }}
            >
              <div>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: "#ECEAEA" }}
                >
                  {activeLog.display_name}
                </h3>
                <div
                  className="flex items-center gap-2 text-xs font-medium"
                  style={{ color: "#ECEAEA" }}
                >
                  <span>{selectedDate}</span>
                  <span>·</span>
                  <span>{addHoursToTimeString(activeLog.time, 9)}</span>
                  {activeLog.roomId && (
                    <>
                      <span>·</span>
                      <span
                        className="px-2 py-1 rounded-lg bg-[#3A4149]"
                        style={{
                          color: "#ECEAEA",
                        }}
                      >
                        Room #{activeLog.roomId}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveLog(null)}
                className="shrink-0 p-2 rounded-lg transition-all hover:scale-110"
                style={{ color: "#ECEAEA" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3A4149";
                  e.currentTarget.style.color = "#ECEAEA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#ECEAEA";
                }}
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문(스크롤) */}
            <div className="flex-1 p-7 overflow-y-auto space-y-6">
              <div>
                <div
                  className="text-sm font-semibold mb-3 flex items-center gap-2.5"
                  style={{ color: "#ECEAEA" }}
                >
                  <div
                    className="w-1.5 h-5 rounded-full"
                    style={{
                      backgroundColor: "#24292E",
                    }}
                  />
                  오류 내용
                </div>
                <div
                  className="p-5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed"
                  style={{
                    backgroundColor: "#ECEAEA",
                    borderColor: "#ECEAEA",
                    borderWidth: "1px",
                    color: "#24292E",
                  }}
                >
                  {activeLog.error}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-sm font-semibold flex items-center gap-2.5"
                    style={{ color: "#ECEAEA" }}
                  >
                    <div
                      className="w-1.5 h-5 rounded-full"
                      style={{
                        backgroundColor: "#24292E",
                      }}
                    />
                    원본 출력/Stacktrace
                  </div>
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    style={{
                      backgroundColor: "#24292E",
                      color: "#ECEAEA",
                      borderColor: "#24292E",
                      borderWidth: "1px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3A4149";
                      e.currentTarget.style.color = "#ECEAEA";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#24292E";
                      e.currentTarget.style.color = "#ECEAEA";
                    }}
                  >
                    {showRaw ? "접기" : "펼치기"}
                  </button>
                </div>

                {showRaw ? (
                  <pre
                    className="p-4 text-xs rounded-lg overflow-auto max-h-[60vh] whitespace-pre"
                    style={{
                      backgroundColor: "#ECEAEA",
                      borderColor: "#ECEAEA",
                      borderWidth: "1px",
                      color: "#24292E",
                    }}
                  >
                    {rawText}
                  </pre>
                ) : (
                  <pre
                    className="p-4 text-xs rounded-lg overflow-auto max-h-[30vh] whitespace-pre"
                    style={{
                      backgroundColor: "#ECEAEA",
                      borderColor: "#ECEAEA",
                      borderWidth: "1px",
                      color: "#24292E",
                    }}
                  >
                    {rawPreview}
                  </pre>
                )}
              </div>

              <div>
                <div
                  className="text-sm font-semibold mb-3 flex items-center gap-2.5"
                  style={{ color: "#ECEAEA" }}
                >
                  <div
                    className="w-1.5 h-5 rounded-full"
                    style={{
                      backgroundColor: "#24292E",
                    }}
                  />
                  해결 방법
                </div>
                {resolutionBullets.length > 0 ? (
                  <ul className="space-y-2.5">
                    {resolutionBullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-3 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed"
                        style={{
                          backgroundColor: "#ECEAEA",
                          borderColor: "#ECEAEA",
                          borderWidth: "1px",
                          color: "#24292E",
                        }}
                      >
                        <span
                          style={{
                            color: "#24292E",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                          }}
                        >
                          •
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    className="p-5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed"
                    style={{
                      backgroundColor: "#ECEAEA",
                      borderColor: "#ECEAEA",
                      borderWidth: "1px",
                      color: "#24292E",
                    }}
                  >
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
