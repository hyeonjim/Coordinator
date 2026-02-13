export interface CreateRoomModalProps {
  onClose: () => void;
}

// 방 생성 요청
export interface CreateRoomRequest {
  name: string;
  branch: string;
}

// 오류 수치
export interface Stats {
  totalErrors: number;
  daysWithErrors: number;
  avgErrorsPerDay: string;
}
