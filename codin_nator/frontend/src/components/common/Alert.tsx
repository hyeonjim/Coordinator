import type { AlertProps } from "@/types/common/types";

export default function Alert({
  open,
  title = "알림",
  children,
  onConfirm,
}: AlertProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999">
      <div className="absolute inset-0 bg-black/40" />
      {/* 모달 - 상단 중앙 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="w-[320px] rounded-lg bg-[#2B2B2B] shadow-lg">
          <div className="px-4 py-3 text-sm font-semibold text-[#d2d7db]">
            {title}
          </div>
          <div className="px-4 py-4 text-sm text-[#d2d7db]">{children}</div>
          <div className="flex justify-end px-4 py-3">
            <button
              onClick={onConfirm}
              className="rounded px-4 py-1.5 text-sm font-semibold bg-[#d2d7db] text-[#2B2B2B] hover:bg-[#bfc6cc] active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
