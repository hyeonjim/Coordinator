import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

/* ================= 타입 정의 ================= */

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
                  className={`w-3 h-3 rounded-sm ${getContribClass(day.count)} hover:ring-2 hover:ring-ring transition`}
                  onClick={() => {
                    if (!day.date) return;
                    setSelectedDate(day.date);
                    setSelectedLogs(contributionData[day.date].logs);
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
            <ul className="mt-3 space-y-2">
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

// import { useMemo, useState } from "react";
// import { ChevronDown } from "lucide-react";

// /* ================= 타입 정의 ================= */

// interface ErrorLog {
//   id: string;
//   level: "INFO" | "WARN" | "ERROR";
//   time: string;

//   display_name: string;
//   error: string;
//   stacktrace: string;
//   resolution: string;
// }

// type ContributionData = Record<
//   string,
//   {
//     count: number;
//     logs: ErrorLog[];
//   }
// >;

// interface ContributionGraphProps {
//   data?: ContributionData;
// }

// /* ================= 유틸 ================= */

// const formatDate = (d: Date) =>
//   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
//     d.getDate(),
//   ).padStart(2, "0")}`;

// const mockErrorLog = (): ErrorLog => ({
//   id: crypto.randomUUID(),
//   level: ["INFO", "WARN", "ERROR"][
//     Math.floor(Math.random() * 3)
//   ] as ErrorLog["level"],
//   time: "14:32",
//   display_name: "Database Connection Error",
//   error: "Connection timeout",
//   stacktrace: "at connect(db.ts:42)\nat retry(db.ts:30)",
//   resolution: "DB 상태 확인 후 재시작",
// });

// /* ================= 컴포넌트 ================= */

// export function ContributionGraph({ data }: ContributionGraphProps) {
//   const today = new Date();

//   /* ===== 상태 ===== */
//   const [selectedYear, setSelectedYear] = useState(today.getFullYear());
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);
//   const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);
//   const [isLogOpen, setIsLogOpen] = useState(false);
//   const [activeLog, setActiveLog] = useState<ErrorLog | null>(null);

//   /* ===== 데이터 생성 ===== */
//   const contributionData = useMemo<ContributionData>(() => {
//     if (data) return data;

//     const mock: ContributionData = {};
//     const startDate = new Date(selectedYear, 0, 1);
//     const endDate = new Date(selectedYear, 11, 31);

//     for (
//       let d = new Date(startDate);
//       d <= endDate;
//       d.setDate(d.getDate() + 1)
//     ) {
//       const dateStr = formatDate(d);

//       // 미래 날짜 비워두기 (현재 연도만)
//       if (selectedYear === today.getFullYear() && d > today) {
//         mock[dateStr] = { count: 0, logs: [] };
//         continue;
//       }

//       const logCount = Math.random() > 0.3 ? Math.floor(Math.random() * 4) : 0;
//       const logs = Array.from({ length: logCount }).map(mockErrorLog);

//       mock[dateStr] = { count: logs.length, logs };
//     }
//     return mock;
//   }, [data, selectedYear]);

//   /* ===== 주 단위 변환 ===== */
//   const weeks = useMemo(() => {
//     const result: { date: string; level: number }[][] = [];
//     const dates = Object.keys(contributionData).sort();

//     let currentWeek: { date: string; level: number }[] = [];
//     const firstDate = new Date(dates[0]);
//     const padding = firstDate.getDay();

//     for (let i = 0; i < padding; i++) {
//       currentWeek.push({ date: "", level: -1 });
//     }

//     dates.forEach((date) => {
//       const d = new Date(date);
//       if (d.getDay() === 0 && currentWeek.length) {
//         result.push(currentWeek);
//         currentWeek = [];
//       }
//       currentWeek.push({
//         date,
//         level: contributionData[date].count,
//       });
//     });

//     if (currentWeek.length) result.push(currentWeek);
//     return result;
//   }, [contributionData]);

//   /* ===== 색상 ===== */
//   const getContribClass = (level: number) => {
//     if (level < 0) return "bg-transparent";
//     if (level === 0) return "contrib-level-0";
//     if (level === 1) return "contrib-level-1";
//     if (level === 2) return "contrib-level-2";
//     if (level === 3) return "contrib-level-3";
//     return "contrib-level-4";
//   };

//   const years = [
//     today.getFullYear(),
//     today.getFullYear() - 1,
//     today.getFullYear() - 2,
//   ];
//   const months = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   /* ================= 렌더 ================= */

//   return (
//     <div className="space-y-4">
//       {/* ===== 연도 탭 (무채색) ===== */}
//       <div className="flex gap-2">
//         {years.map((year) => (
//           <button
//             key={year}
//             onClick={() => {
//               setSelectedYear(year);
//               setSelectedDate(null);
//               setSelectedLogs([]);
//             }}
//             className={`px-3 py-1 rounded-md text-sm transition ${
//               year === selectedYear
//                 ? "bg-muted-foreground text-background"
//                 : "bg-muted text-muted-foreground hover:bg-muted/70"
//             }`}
//           >
//             {year}
//           </button>
//         ))}
//       </div>
//       <div className="flex gap-[0px] ml-[28px] text-xs text-muted-foreground">
//         {months.map((month) => (
//           <span
//             key={month}
//             className="w-[66px] text-left"
//             // style={{ minWidth: `${100 / months.length}%` }}
//           >
//             {month}
//           </span>
//         ))}
//       </div>
//       <div className="flex gap-2">
//         <div className="flex flex-col gap-[2px] text-xs pt-[2px] text-muted-foreground">
//           {Array.from({ length: 7 }).map((_, i) => (
//             <div key={i} className="h-3">
//               {i === 1 && "Mon"}
//               {i === 3 && "Wed"}
//               {i === 5 && "Fri"}
//             </div>
//           ))}
//         </div>

//         <div className="flex gap-[3px] overflow-x-auto">
//           {weeks.map((week, wi) => (
//             <div key={wi} className="flex flex-col gap-[3px]">
//               {week.map((day, di) => (
//                 <button
//                   key={`${wi}-${di}`}
//                   title={day.date ? `${day.date} · ${day.level} errors` : ""}
//                   className={`w-3 h-3 rounded-sm ${getContribClass(
//                     day.level,
//                   )} hover:ring-2 hover:ring-ring`}
//                   onClick={() => {
//                     if (!day.date) return;
//                     setSelectedDate(day.date);
//                     setSelectedLogs(contributionData[day.date].logs);
//                     setIsLogOpen(false);
//                   }}
//                 />
//               ))}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ===== 범례 (복구) ===== */}
//       <div className="flex justify-end items-center gap-1 text-xs text-muted-foreground">
//         <span>Less</span>
//         <div className="w-3 h-3 rounded-sm contrib-level-0" />
//         <div className="w-3 h-3 rounded-sm contrib-level-1" />
//         <div className="w-3 h-3 rounded-sm contrib-level-2" />
//         <div className="w-3 h-3 rounded-sm contrib-level-3" />
//         <div className="w-3 h-3 rounded-sm contrib-level-4" />
//         <span>More</span>
//       </div>

//       {/* ===== 날짜 요약 + 토글 ===== */}
//       {selectedDate && (
//         <div className="rounded-lg border p-4">
//           <button
//             onClick={() => setIsLogOpen((v) => !v)}
//             className="flex w-full justify-between items-center"
//           >
//             <span className="font-semibold">
//               📅 {selectedDate} · {selectedLogs.length}건
//             </span>
//             <ChevronDown
//               className={`h-4 w-4 transition ${isLogOpen ? "rotate-180" : ""}`}
//             />
//           </button>

//           <div
//             className={`transition-all overflow-hidden ${
//               isLogOpen ? "max-h-[400px] mt-3" : "max-h-0"
//             }`}
//           >
//             {selectedLogs.length === 0 ? (
//               <p className="text-sm text-muted-foreground">
//                 오류 내역이 없습니다. 굿~
//               </p>
//             ) : (
//               <ul className="space-y-2">
//                 {selectedLogs.map((log) => (
//                   <li
//                     key={log.id}
//                     onClick={() => setActiveLog(log)}
//                     className="cursor-pointer rounded border p-2 hover:bg-muted"
//                   >
//                     <div className="flex justify-between text-sm">
//                       <span>{log.display_name}</span>
//                       <span>{log.level}</span>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ===== 상세 모달 ===== */}
//       {activeLog && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//           <div className="bg-background rounded-lg p-6 w-[500px] space-y-3">
//             <h3 className="font-semibold">{activeLog.display_name}</h3>
//             <p>
//               <b>오류:</b> {activeLog.error}
//             </p>
//             <pre className="bg-muted p-2 text-xs rounded">
//               {activeLog.stacktrace}
//             </pre>
//             <p>
//               <b>해결방법:</b> {activeLog.resolution}
//             </p>
//             <button
//               onClick={() => setActiveLog(null)}
//               className="mt-2 text-sm text-muted-foreground hover:underline"
//             >
//               닫기
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useMemo, useState } from "react";

// /* ================= 타입 정의 ================= */

// interface ErrorLog {
//   id: string;
//   message: string;
//   level: "INFO" | "WARN" | "ERROR";
//   time: string;
// }

// type ContributionData = Record<
//   string,
//   {
//     count: number;
//     logs: ErrorLog[];
//   }
// >;

// interface ContributionGraphProps {
//   data?: ContributionData;
// }

// /* ================= 컴포넌트 ================= */

// export function ContributionGraph({ data }: ContributionGraphProps) {
//   /* ====== 상태는 컴포넌트 최상단 ====== */
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);
//   const [selectedLogs, setSelectedLogs] = useState<ErrorLog[]>([]);

//   /* ====== 데이터 생성 ====== */
//   const contributionData = useMemo<ContributionData>(() => {
//     if (data) return data;
//     const mock: ContributionData = {};
//     const today = new Date();
//     const year = today.getFullYear();
//     const startDate = new Date(year, 0, 1); // Jan 1
//     const endDate = new Date(year, 11, 31); // Dec 31
//     for (
//       let d = new Date(startDate);
//       d <= endDate;
//       d.setDate(d.getDate() + 1)
//     ) {
//       // const dateStr = d.toISOString().split("T")[0];
//       const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

//       const logCount = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;

//       const logs: ErrorLog[] = Array.from({ length: logCount }).map((_, i) => ({
//         id: crypto.randomUUID(),
//         level: ["INFO", "WARN", "ERROR"][
//           Math.floor(Math.random() * 3)
//         ] as ErrorLog["level"],
//         time: `14:${30 + i}`,
//         message: `Example log ${i + 1}`,
//       }));

//       mock[dateStr] = {
//         count: logs.length,
//         logs,
//       };
//     }
//     return mock;
//   }, [data]);

//   /* ====== 주 단위로 변환 ====== */
//   const weeks = useMemo(() => {
//     const result: { date: string; level: number }[][] = [];
//     const dates = Object.keys(contributionData).sort();

//     let currentWeek: { date: string; level: number }[] = [];
//     const firstDate = new Date(dates[0]);
//     const padding = firstDate.getDay();

//     for (let i = 0; i < padding; i++) {
//       currentWeek.push({ date: "", level: -1 });
//     }

//     dates.forEach((date) => {
//       const d = new Date(date);
//       if (d.getDay() === 0 && currentWeek.length > 0) {
//         result.push(currentWeek);
//         currentWeek = [];
//       }
//       currentWeek.push({
//         date,
//         level: contributionData[date].count,
//       });
//     });

//     if (currentWeek.length) result.push(currentWeek);
//     return result;
//   }, [contributionData]);

//   /* ====== 색상 ====== */
//   const getContribClass = (level: number) => {
//     if (level < 0) return "bg-transparent";
//     if (level === 0) return "contrib-level-0";
//     if (level === 1) return "contrib-level-1";
//     if (level === 2) return "contrib-level-2";
//     if (level === 3) return "contrib-level-3";
//     return "contrib-level-4";
//   };

//   const months = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   return (
//     <div className="space-y-4">
//       {/* Month labels */}
//       <div className="flex gap-[0px] ml-[28px] text-xs text-muted-foreground">
//         {months.map((month) => (
//           <span
//             key={month}
//             className="w-[67px] text-left"
//             // style={{ minWidth: `${100 / months.length}%` }}
//           >
//             {month}
//           </span>
//         ))}
//       </div>
//       <div className="flex gap-2">
//         {/* 요일 라벨 */}
//         <div className="flex flex-col gap-[2px] text-xs text-muted-foreground pt-[2px]">
//           {Array.from({ length: 7 }).map((_, i) => (
//             <div key={i} className="h-3 flex items-center">
//               {i === 1 && "Mon"}
//               {i === 3 && "Wed"}
//               {i === 5 && "Fri"}
//             </div>
//           ))}
//         </div>

//         {/* <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pt-[2px]">
//           {weekLabels.map((label, i) => (
//             <div key={i} className="h-3 flex items-center">
//               {label}
//             </div>
//           ))}
//         </div> */}
//         {/* ===== 잔디 ===== */}
//         <div className="flex gap-[3px] overflow-x-auto">
//           {weeks.map((week, wi) => (
//             <div key={wi} className="flex flex-col gap-[3px]">
//               {week.map((day, di) => (
//                 <button
//                   key={`${wi}-${di}`}
//                   className={`w-3 h-3 rounded-sm ${getContribClass(
//                     day.level,
//                   )} hover:ring-2 hover:ring-ring transition`}
//                   // disabled={day.level <= 0}
//                   onClick={() => {
//                     if (!day.date) {
//                       setSelectedDate(null);
//                       setSelectedLogs([]);
//                       return;
//                     }
//                     setSelectedDate(day.date);

//                     if (day.level <= 0) {
//                       setSelectedLogs([]);
//                     } else {
//                       setSelectedLogs(contributionData[day.date].logs);
//                     }
//                     // setSelectedLogs(contributionData[day.date].logs);

//                     // if (!day.date) return;
//                     // [];
//                     // setSelectedDate(day.date);
//                     // setSelectedLogs(contributionData[day.date].logs);
//                   }}
//                   // title={day.date ? `${day.date}: ${day.level} errors` : ""}
//                 />
//               ))}
//             </div>
//           ))}
//         </div>
//       </div>
//       {/* 범례 */}
//       <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
//         <span>Less</span>
//         <div className="w-3 h-3 rounded-sm contrib-level-0" />
//         <div className="w-3 h-3 rounded-sm contrib-level-1" />
//         <div className="w-3 h-3 rounded-sm contrib-level-2" />
//         <div className="w-3 h-3 rounded-sm contrib-level-3" />
//         <div className="w-3 h-3 rounded-sm contrib-level-4" />
//         <span>More</span>
//       </div>

//       {/* 잔디 클릭하면 나오는 카드 */}
//       {selectedDate && (
//         <div className="rounded-lg border bg-card p-4 shadow-sm">
//           <h3 className="text-sm font-semibold mb-2">
//             📅 {selectedDate} 오류 내역
//           </h3>

//           {selectedLogs.length === 0 ? (
//             <p className="text-sm text-muted-foreground">
//               오류 내역이 없습니다. 굿~
//             </p>
//           ) : (
//             <ul className="space-y-2">
//               {selectedLogs.map((log) => (
//                 <li key={log.id} className="rounded-md border p-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="font-medium">{log.level}</span>
//                     <span className="text-muted-foreground">{log.time}</span>
//                   </div>
//                   <p className="mt-1">{log.message}</p>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
