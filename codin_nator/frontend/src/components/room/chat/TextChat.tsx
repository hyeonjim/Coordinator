/**
 * - 폼 제출 처리 (onSubmit)
 * - 스크롤 자동 이동 (useRef + scrollIntoView)
 * - 입력 상태 관리
 */

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../../types/room/types";

interface TextChatProps {
  /** 채팅 메시지 목록 */
  messages: ChatMessage[];
  /** 메시지 전송 핸들러 */
  onSendMessage: (text: string) => void;
  /** 비활성화 여부 (방 미참여 시) <---- 이 부분은 테스트용이라 나중에 삭제 할 예정 */
  disabled?: boolean;
}

/**
 * 내 메시지는 오른쪽, 상대 메시지는 왼쪽에 표시
 */

function MessageBubble({ message }: { message: ChatMessage }) {
  // 시간 포맷 (HH:MM)
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={["flex", message.isMe ? "justify-end" : "justify-start"].join(
        " ",
      )}
    >
      <div
        className={["max-w-[70%]", message.isMe ? "order-1" : "order-2"].join(
          " ",
        )}
      >
        {/* 발신자 이름 (상대방 메시지만) */}
        {!message.isMe && (
          <p className="text-xs text-slate-500 mb-1 px-1">{message.userName}</p>
        )}

        {/* 메시지 내용 */}
        <div
          className={[
            "rounded-2xl px-4 py-2",
            message.isMe
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-slate-100 text-slate-900 rounded-bl-md",
          ].join(" ")}
        >
          <p className="text-sm break-words">{message.message}</p>
        </div>

        {/* 시간 */}
        <p
          className={[
            "text-xs text-slate-400 mt-1 px-1",
            message.isMe ? "text-right" : "text-left",
          ].join(" ")}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

/**
 * 텍스트 채팅 컴포넌트
 *
 * 사용 예시:
 * <TextChat
 *   messages={chatMessages}
 *   onSendMessage={(text) => sendChat(text)}
 * />
 */

export function TextChat({ messages, onSendMessage, disabled }: TextChatProps) {
  // 입력 상태
  const [inputText, setInputText] = useState("");

  // 스크롤 참조 (새 메시지 시 자동 스크롤용)
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * 새 메시지가 추가되면 자동으로 스크롤
   * useEffect의 의존성 배열에 messages.length를 넣어서
   * 메시지가 추가될 때마다 실행되도록 함
   */

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /**
   * 폼 제출 핸들러
   * preventDefault()로 페이지 새로고침 방지
   */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const text = inputText.trim();
    if (!text) return;

    onSendMessage(text);
    setInputText(""); // 입력창 초기화
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 제거됨 (상위 탭으로 대체) */}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 메시지가 없을 때 */}
        {messages.length === 0 && (
          <p className="text-center text-slate-400 py-8">메시지가 없습니다</p>
        )}

        {/* 스크롤 타겟 (항상 맨 아래에 위치) */}
        <div ref={scrollRef} />
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              disabled ? "방에 먼저 참여해주세요" : "메시지를 입력하세요..."
            }
            disabled={disabled}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={disabled || !inputText.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
