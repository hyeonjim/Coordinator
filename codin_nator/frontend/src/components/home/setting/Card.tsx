import type CardProps from "../../../types/setting/card";

export default function Card({ children, border }: CardProps) {
  return (
    <div
      className={`bg-white flex flex-col gap-6 rounded-xl py-6 shadow-sm ${border ? "border " + border : ""}`}
    >
      {children}
    </div>
  );
}
