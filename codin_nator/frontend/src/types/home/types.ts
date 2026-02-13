export interface CreateRoomModalProps {
  onClose: () => void;
}

// 오류 수치
export interface Stats {
  totalErrors: number;
  daysWithErrors: number;
  avgErrorsPerDay: string;
}
