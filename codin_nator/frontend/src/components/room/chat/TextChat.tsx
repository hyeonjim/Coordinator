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
      <div className="flex flex-col items-center gap-1 py-2 px-2">
        <p className="text-xs font-medium text-(--rc-system-text)">
          {message.type === "ENTER"
            ? `${message.userName}님이 입장하셨습니다.`
            : `${message.userName}님이 퇴장하셨습니다.`}
        </p>
        <span className="text-xs text-(--rc-system-text)">{time}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 items-end ${message.isMe ? "justify-end" : "justify-start"}`}
    >
      {!message.isMe && (
        <div className="shrink-0">
          <div className="h-8 w-8 rounded-full flex items-center justify-center font-semibold overflow-hidden shrink-0 bg-(--rc-msg-avatar-bg) text-(--rc-msg-avatar-text)">
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

      <div className="max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-2 text-sm break-words ${
            message.isMe
              ? "bg-(--rc-msg-mine-bg) text-(--rc-msg-mine-text) rounded-br-[4px]"
              : "bg-(--rc-msg-other-bg) text-(--rc-msg-other-text) rounded-bl-[4px]"
          }`}
        >
          <p>{message.message}</p>
        </div>

        {/* 시간 및 발신자 이름 (상대방 메시지만 이름 표시) */}
        <div
          className={`flex items-center gap-1 mt-1 px-1 text-xs text-(--rc-msg-meta) ${
            message.isMe ? "justify-end" : "justify-start"
          }`}
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
    <div className="relative h-full flex">
      <div
        className={`h-full transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? "w-0" : "w-80"}`}
      >
        <aside className="h-full flex flex-col w-80 bg-(--rc-tc-panel-bg) border-l border-(--rc-tc-panel-border)">
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 room-scrollbar bg-(--rc-tc-messages-bg)">
                {chatMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-center py-8 text-(--rc-text-muted)">메시지가 없습니다</p>
                )}
                {/* 스크롤 타겟 (항상 맨 아래에 위치) */}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={handleSubmit} className="p-3 bg-(--rc-tc-input-form-bg)">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder={
                      isJoined ? "메시지를 입력하세요..." : "방에 먼저 참여해주세요"
                    }
                    disabled={!isJoined}
                    className="flex-1 rounded-lg px-3 py-1 text-sm bg-(--rc-tc-input-bg) text-(--rc-tc-input-text) placeholder:text-(--rc-tc-input-placeholder) focus:outline-none focus:border-(--rc-text-muted) disabled:bg-(--rc-tc-input-dis-bg) disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    className="rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap bg-(--rc-tc-send-bg) text-(--rc-tc-send-text) hover:bg-(--rc-tc-send-hover) disabled:bg-(--rc-tc-send-dis-bg) disabled:text-(--rc-tc-send-dis-text) disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150"
                  >
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
        className="absolute -left-6 top-1/2 -translate-y-1/2 px-1 py-1.5 rounded text-sm z-20 bg-(--rc-tc-toggle-bg) text-(--rc-tc-toggle-text) hover:bg-(--rc-tc-toggle-hover) transition-all duration-150"
      >
        {isSidebarCollapsed ? "◀" : "▶"}
      </button>
    </div>
  );
}
