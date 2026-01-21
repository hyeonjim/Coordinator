import { GitCommit, Sparkles } from "lucide-react";
import { Button } from "./button";
interface Activity {
  id: string;
  type: "commit" | "room_join" | "file_change";
  title: string;
  description?: string;
  repository?: string;
  commitCount?: number;
  date: string;
}

interface ActivityListProps {
  activities?: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const mockActivities: Activity[] = activities || [
    {
      id: "1",
      type: "commit",
      title: "Created 1 commit in 1 repository",
      repository: "rubytopaz-glitch/reactstudy",
      commitCount: 1,
      date: "January 16, 2026",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Contribution activity</h3>

      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="relative pl-6 border-l-2 border-muted"
          >
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-muted flex items-center justify-center">
              {activity.type === "commit" && (
                <GitCommit className="w-3 h-3 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{activity.date}</span>
                <Sparkles className="w-3 h-3" />
              </div>

              <p className="text-sm text-foreground">{activity.title}</p>

              {activity.repository && (
                <div className="flex items-center gap-4 text-sm">
                  <a href="#" className="text-primary hover:underline">
                    {activity.repository}
                  </a>
                  {activity.commitCount && (
                    <span className="text-muted-foreground">
                      {activity.commitCount} commit
                    </span>
                  )}
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-full bg-success rounded-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full bg-transparent">
        Show more activity
      </Button>
    </div>
  );
}
