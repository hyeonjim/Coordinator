// Contribution (잔디) 관련 타입 정의

export interface ErrorLog {
  id: string;
  roomId?: string;
  time: string;
  display_name: string;
  error: string;
  stacktrace: string;
  resolution: string;
}

export type ContributionData = Record<
  string,
  {
    count: number;
    logs: ErrorLog[];
  }
>;

export interface ContributionGraphProps {
  data?: ContributionData;
  roomOptions?: string[];
}
