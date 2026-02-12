/**
 * 텍스트 채팅 컴포넌트
 * - 스크롤 자동 이동 (useRef + scrollIntoView)
 */

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, TextChatProps } from "@/types/room/chat/message";

/**
 * 내 메시지는 오른쪽, 상대 메시지는 왼쪽에 표시
 * 입장/퇴장 메시지는 중앙에 표시
 */

function MessageBubble({ message }: { message: ChatMessage }) {
  // 시간 포맷 (HH:MM)
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 입장/퇴장 메시지는 별도로 표시
  if (message.type === "ENTER" || message.type === "LEAVE") {
    return (
      <div className="message-system-notification">
        <p className="message-system-text">
          {message.type === "ENTER"
            ? `${message.userName}님이 입장하셨습니다.`
            : `${message.userName}님이 퇴장하셨습니다.`}
        </p>
        <span className="message-system-time">{time}</span>
      </div>
    );
  }

  return (
    <div
      className={`message-bubble ${message.isMe ? "message-bubble-mine" : "message-bubble-other"}`}
    >
      {/* 아바타 (상대방 메시지만 왼쪽에 표시) */}
      {!message.isMe && (
        <div className="shrink-0">
          <div className="message-avatar">
            {message.imageUrl ? (
              <img
                src={message.imageUrl}
                alt={message.userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs">
                {(message.userName?.trim()?.[0] ?? "?").toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="message-content">
        {/* 메시지 내용 */}
        <div
          className={`message-text ${message.isMe ? "message-text-mine" : "message-text-other"}`}
        >
          <p>{message.message}</p>
        </div>

        {/* 시간 및 발신자 이름 (상대방 메시지만 이름 표시) */}
        <div
          className={`message-meta ${message.isMe ? "justify-end" : "justify-start"}`}
        >
          {!message.isMe && <span className="pr-3">{message.userName}</span>}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 텍스트 채팅 컴포넌트
 * 사이드바 토글 기능을 제공합니다.
 */
export function TextChat({
  messages,
  onSendMessage,
  disabled,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: TextChatProps) {
  // 입력 상태
  const [inputText, setInputText] = useState("");

  // 스크롤 참조 (새 메시지 시 자동 스크롤용)
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * 새 메시지가 추가되면 자동으로 스크롤
   */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const text = inputText.trim();
    if (!text) return;

    try {
      onSendMessage(text);
      setInputText(""); // 전송 성공 시에만 입력창 초기화
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      // 입력창은 유지하여 재시도 가능하도록 함
    }
  };

  return (
    <div className="text-chat-container">
      {/* 사이드바 컨텐츠 */}
      <div
        className={`text-chat-sidebar ${isSidebarCollapsed ? "w-0" : "w-80"}`}
      >
        <aside className="text-chat-panel">
          {/* 텍스트 채팅 */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* 텍스트 채팅 탭 */}
            <div className="absolute inset-0 flex flex-col">
              {/* 메시지 목록 */}
              <div className="text-chat-messages room-scrollbar">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* 메시지가 없을 때 */}
                {messages.length === 0 && (
                  <p className="text-chat-empty">메시지가 없습니다</p>
                )}

                {/* 스크롤 타겟 (항상 맨 아래에 위치) */}
                <div ref={scrollRef} />
              </div>

              {/* 입력 폼 */}
              <form onSubmit={handleSubmit} className="text-chat-input-form">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      disabled
                        ? "방에 먼저 참여해주세요"
                        : "메시지를 입력하세요..."
                    }
                    disabled={disabled}
                    className="text-chat-input"
                  />
                  <button type="submit" className="text-chat-send-btn">
                    전송
                  </button>
                </div>
              </form>
            </div>
          </div>
        </aside>
      </div>

      {/* 사이드바 토글 버튼 */}
      <button
        onClick={() => setIsSidebarCollapsed((previous) => !previous)}
        className="text-chat-toggle"
      >
        {isSidebarCollapsed ? "◀" : "▶"}
      </button>
    </div>
  );
}
