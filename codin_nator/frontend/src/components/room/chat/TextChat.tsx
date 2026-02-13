/**
 * 텍스트 채팅 컴포넌트
 * - 내 메시지는 오른쪽, 상대 메시지는 왼쪽에 표시
 * - 입장/퇴장 메시지는 중앙에 표시
 * - 스크롤 자동 이동 (useRef + scrollIntoView)
 */

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/room/chat/textchat/types";
import { useRoomContext } from "@/hooks/room/useRoomContext";

function MessageBubble({ message }: { message: ChatMessage }) {
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

export function TextChat() {
  const {
    chatMessages,
    handleSendChat,
    isJoined,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useRoomContext();

  const [inputText, setInputText] = useState("");
  // 새 메시지 시 자동 스크롤용
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    try {
      handleSendChat(text);
      setInputText("");
    } catch {
      // 전송 실패 시 입력창 유지하여 재시도 가능
    }
  };

  return (
    <div className="text-chat-container">
      <div
        className={`text-chat-sidebar ${isSidebarCollapsed ? "w-0" : "w-80"}`}
      >
        <aside className="text-chat-panel">
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <div className="absolute inset-0 flex flex-col">
              <div className="text-chat-messages room-scrollbar">
                {chatMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-chat-empty">메시지가 없습니다</p>
                )}
                {/* 스크롤 타겟 (항상 맨 아래에 위치) */}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={handleSubmit} className="text-chat-input-form">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder={
                      isJoined ? "메시지를 입력하세요..." : "방에 먼저 참여해주세요"
                    }
                    disabled={!isJoined}
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
