import { useMemo } from "react";

interface ContributionGraphProps {
  data?: Record<string, number>;
}

export function ContributionGraph({ data }: ContributionGraphProps) {
  // Generate mock data if none provided
  const contributionData = useMemo(() => {
    if (data) return data;

    const mockData: Record<string, number> = {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 13);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      mockData[dateStr] =
        Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;
    }

    return mockData;
  }, [data]);

  // Group contributions by week
  const weeks = useMemo(() => {
    const result: { date: string; level: number }[][] = [];
    const dates = Object.keys(contributionData).sort();

    if (dates.length === 0) return result;

    let currentWeek: { date: string; level: number }[] = [];
    const firstDate = new Date(dates[0]);
    const dayOfWeek = firstDate.getDay();

    // Pad the first week
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: "", level: -1 });
    }

    dates.forEach((date) => {
      const d = new Date(date);
      if (d.getDay() === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date, level: contributionData[date] });
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [contributionData]);

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

  const getContribClass = (level: number) => {
    if (level < 0) return "bg-transparent";
    if (level === 0) return "contrib-level-0";
    if (level === 1) return "contrib-level-1";
    if (level === 2) return "contrib-level-2";
    if (level === 3) return "contrib-level-3";
    return "contrib-level-4";
  };

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex gap-1 ml-0 text-xs text-muted-foreground">
        {months.map((month) => (
          <span
            key={month}
            className="flex-1 text-center"
            style={{ minWidth: `${100 / months.length}%` }}
          >
            {month}
          </span>
        ))}
      </div>

      {/* Contribution grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm ${getContribClass(day.level)}`}
                title={
                  day.date ? `${day.date}: ${day.level} contributions` : ""
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm contrib-level-0" />
        <div className="w-3 h-3 rounded-sm contrib-level-1" />
        <div className="w-3 h-3 rounded-sm contrib-level-2" />
        <div className="w-3 h-3 rounded-sm contrib-level-3" />
        <div className="w-3 h-3 rounded-sm contrib-level-4" />
        <span>More</span>
      </div>
    </div>
  );
}
