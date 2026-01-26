import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

// 에러 로그 데모
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

interface ContributionGraphProps {
  data?: ContributionData;
}

/* ================= 유틸 ================= */

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const mockErrorLog = (): ErrorLog => ({
  id: crypto.randomUUID(),
  time: `14:${Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, "0")}`,
  display_name: "Database Connection Error",
  error: "Connection timeout",
  stacktrace: "at connect(db.ts:42)\nat retry(db.ts:30)",
  resolution: "DB 상태 확인 후 재시작",
});

/* ================= 컴포넌트 ================= */

export function ContributionGraph({ data }: ContributionGraphProps) {
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [activeLog, setActiveLog] = useState<ErrorLog | null>(null);

  /* ===== 데이터 생성 ===== */
  const contributionData = useMemo<ContributionData>(() => {
    if (data) return data;

    const mock: ContributionData = {};
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    // selectedYear === 2026
    //   ? new Date(2026, 0, 31)
    //   : new Date(selectedYear, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = formatDate(d);

      if (d > today && selectedYear === today.getFullYear()) {
        mock[dateStr] = { count: 0, logs: [] };
        continue;
      }

      const logCount = Math.floor(Math.random() * 10); // 0~7
      const logs = Array.from({ length: logCount }).map(mockErrorLog);

      mock[dateStr] = { count: logs.length, logs };
    }
    return mock;
  }, [data, selectedYear]);

  /* ===== 주 단위 변환 ===== */
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

  /* ===== 색상 (오류 개수 기준) ===== */
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

  /* ================= 렌더 ================= */

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
                    // setSelectedLogs(contributionData[day.date].logs);
                    setSelectedLogs(
                      [...contributionData[day.date].logs].sort((a, b) =>
                        b.time.localeCompare(a.time),
                      ),
                    );
                    setIsLogOpen(false);
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
                <ul className="space-y-2">
                  {selectedLogs.map((log) => (
                    <li
                      key={log.id}
                      onClick={() => setActiveLog(log)}
                      className="cursor-pointer rounded border p-2 hover:bg-muted"
                    >
                      <div className="flex justify-between text-sm">
                        <span>{log.display_name}</span>
                        <span>{log.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 상세 모달 ===== */}
      {activeLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="relative bg-background rounded-lg p-6 w-[520px] space-y-4">
            <button
              onClick={() => setActiveLog(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-semibold">{activeLog.display_name}</h3>

            <div>
              <b>오류 내용</b>
              <p className="mt-1 text-sm">{activeLog.error}</p>
            </div>

            <div>
              <b>Stacktrace</b>
              <pre className="mt-1 bg-muted p-2 text-xs rounded">
                {activeLog.stacktrace}
              </pre>
            </div>

            <div>
              <b>해결 방법</b>
              <p className="mt-1 text-sm">{activeLog.resolution}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
