export interface FormInputProps {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  note?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface CreateRoomModalProps {
  onClose: () => void;
}
