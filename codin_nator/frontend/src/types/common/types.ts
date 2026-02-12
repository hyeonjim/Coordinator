import type { ReactNode } from "react";

export interface AlertProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onConfirm: () => void;
}
