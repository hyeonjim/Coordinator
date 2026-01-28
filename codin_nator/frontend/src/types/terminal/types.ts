export interface TerminalStatus {
  language: string;
  encoding: string;
  connectedUsers: number;
  cursorInfo: string;
}

export interface TerminalProps {
  projectName: string;
  branchName: string;
  userName: string;
  command: string;
  output: string;
  status?: TerminalStatus;
}

export const DEFAULT_TERMINAL_STATUS: TerminalStatus = {
  language: "Java",
  encoding: "UTF-8",
  connectedUsers: 0,
  cursorInfo: "Ln 1, Col 1",
};
