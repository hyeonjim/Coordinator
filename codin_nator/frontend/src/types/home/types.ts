export interface ProfileSectionProps {
  user: {
    name?: string;
    email?: string;
    imageUrl?: string;
  } | null;
  onLogout: () => void;
}

export interface Stats {
  totalErrors: number;
  daysWithErrors: number;
  avgErrorsPerDay: string;
}
