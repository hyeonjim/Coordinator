export interface CreateRoomModalProps {
  onClose: () => void;
}

export interface ErrorReportSectionProps {
  onCreateRoom: () => void;
}

export interface ProfileSectionProps {
  user: {
    name?: string;
    email?: string;
    imageUrl?: string;
  } | null;
  onLogout: () => void;
}

// 오류 수치
export interface Stats {
  totalErrors: number;
  daysWithErrors: number;
  avgErrorsPerDay: string;
}
