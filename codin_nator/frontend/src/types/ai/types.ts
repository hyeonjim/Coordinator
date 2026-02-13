export interface TestReportResponse {
  id: number;
  roomId: number;
  timestamp: string;
  stacktrace: string;
  display_name: string;
  error: string;
  resolution: string;
}
