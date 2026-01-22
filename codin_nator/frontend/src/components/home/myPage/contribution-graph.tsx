import { useMemo, useState } from "react";

/* ================= 타입 정의 ================= */

interface ErrorLog {
  id: string;
  message: string;
  level: "INFO" | "WARN" | "ERROR";
  time: string;
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

/* ================= 컴포넌트 ================= */

export function ContributionGraph({ data }: ContributionGraphProps) {
  /* ====== 상태는 컴포넌트 최상단 ====== */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);

  /* ====== 데이터 생성 ====== */
  const contributionData = useMemo<ContributionData>(() => {
    if (data) return data;
    const mock: ContributionData = {};
    const today = new Date();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31); // Dec 31
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      // const dateStr = d.toISOString().split("T")[0];
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const logCount = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;

      const logs: ErrorLog[] = Array.from({ length: logCount }).map((_, i) => ({
        id: crypto.randomUUID(),
        level: ["INFO", "WARN", "ERROR"][
          Math.floor(Math.random() * 3)
        ] as ErrorLog["level"],
        time: `14:${30 + i}`,
        message: `Example log ${i + 1}`,
      }));

      mock[dateStr] = {
        count: logs.length,
        logs,
      };
    }
    return mock;
  }, [data]);

  /* ====== 주 단위로 변환 ====== */
  const weeks = useMemo(() => {
    const result: { date: string; level: number }[][] = [];
    const dates = Object.keys(contributionData).sort();

    let currentWeek: { date: string; level: number }[] = [];
    const firstDate = new Date(dates[0]);
    const padding = firstDate.getDay();

    for (let i = 0; i < padding; i++) {
      currentWeek.push({ date: "", level: -1 });
    }

    dates.forEach((date) => {
      const d = new Date(date);
      if (d.getDay() === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({
        date,
        level: contributionData[date].count,
      });
    });

    if (currentWeek.length) result.push(currentWeek);
    return result;
  }, [contributionData]);

  /* ====== 색상 ====== */
  const getContribClass = (level: number) => {
    if (level < 0) return "bg-transparent";
    if (level === 0) return "contrib-level-0";
    if (level === 1) return "contrib-level-1";
    if (level === 2) return "contrib-level-2";
    if (level === 3) return "contrib-level-3";
    return "contrib-level-4";
  };

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

  return (
    <div className="space-y-4">
      {/* Month labels */}
      <div className="flex gap-[0px] ml-[28px] text-xs text-muted-foreground">
        {months.map((month) => (
          <span
            key={month}
            className="w-[67px] text-left"
            // style={{ minWidth: `${100 / months.length}%` }}
          >
            {month}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        {/* 요일 라벨 */}
        <div className="flex flex-col gap-[2px] text-xs text-muted-foreground pt-[2px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 flex items-center">
              {i === 1 && "Mon"}
              {i === 3 && "Wed"}
              {i === 5 && "Fri"}
            </div>
          ))}
        </div>

        {/* <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pt-[2px]">
          {weekLabels.map((label, i) => (
            <div key={i} className="h-3 flex items-center">
              {label}
            </div>
          ))}
        </div> */}
        {/* ===== 잔디 ===== */}
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <button
                  key={`${wi}-${di}`}
                  className={`w-3 h-3 rounded-sm ${getContribClass(
                    day.level,
                  )} hover:ring-2 hover:ring-ring transition`}
                  // disabled={day.level <= 0}
                  onClick={() => {
                    if (!day.date) {
                      setSelectedDate(null);
                      setSelectedLogs([]);
                      return;
                    }
                    setSelectedDate(day.date);

                    if (day.level <= 0) {
                      setSelectedLogs([]);
                    } else {
                      setSelectedLogs(contributionData[day.date].logs);
                    }
                    // setSelectedLogs(contributionData[day.date].logs);

                    // if (!day.date) return;
                    // [];
                    // setSelectedDate(day.date);
                    // setSelectedLogs(contributionData[day.date].logs);
                  }}
                  // title={day.date ? `${day.date}: ${day.level} errors` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* 범례 */}
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm contrib-level-0" />
        <div className="w-3 h-3 rounded-sm contrib-level-1" />
        <div className="w-3 h-3 rounded-sm contrib-level-2" />
        <div className="w-3 h-3 rounded-sm contrib-level-3" />
        <div className="w-3 h-3 rounded-sm contrib-level-4" />
        <span>More</span>
      </div>

      {/* 잔디 클릭하면 나오는 카드 */}
      {selectedDate && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-2">
            📅 {selectedDate} 오류 내역
          </h3>

          {selectedLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              오류 내역이 없습니다. 굿~
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedLogs.map((log) => (
                <li key={log.id} className="rounded-md border p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{log.level}</span>
                    <span className="text-muted-foreground">{log.time}</span>
                  </div>
                  <p className="mt-1">{log.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
