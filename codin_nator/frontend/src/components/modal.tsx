import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// 탈퇴 버튼 작성 예시
{
  /* <Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="회원 탈퇴"
  description="정말로 탈퇴하시겠습니까? 모든 데이터가 영구 삭제됩니다."
  confirmText="탈퇴하기"
  danger
  onConfirm={() => navigate("/login")}
/> */
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  danger?: boolean; // 탈퇴, 삭제 등 설정 (빨간색 버튼 변경)
  children?: ReactNode; // 자유 커스텀 콘텐츠
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  danger = false,
  children,
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 p-6 shadow-2xl text-white"
          >
            {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}

            {description && (
              <div className="text-neutral-400 mb-6 leading-relaxed">
                {description}
              </div>
            )}

            {children}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-white transition"
              >
                {cancelText}
              </button>

              {onConfirm && (
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    danger
                      ? "bg-gray-600 hover:bg-red-700"
                      : "bg-white text-black hover:opacity-90"
                  }`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
