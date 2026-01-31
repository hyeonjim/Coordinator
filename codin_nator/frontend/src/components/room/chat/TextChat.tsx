/**
 * 텍스트 채팅 및 AI 기능 컴포넌트
 * - 탭 전환 (AI/채팅)
 * - 사이드바 토글
 * - 폼 제출 처리 (onSubmit)
 * - 스크롤 자동 이동 (useRef + scrollIntoView)
 */

import { useEffect, useRef, useState } from "react";
import type {
  ChatMessage,
  TextChatProps,
} from "@/types/chat/message";

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
      className={["flex gap-2 items-end", message.isMe ? "justify-end" : "justify-start"].join(" ")}
    >
      {/* 아바타 (상대방 메시지만 왼쪽에 표시, 호스트는 표시 안함) */}
      {!message.isMe && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold overflow-hidden border border-slate-200">
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
 * AI 기능 탭과 채팅 탭을 포함하며, 사이드바 토글 기능을 제공합니다.
 */
export function TextChat({
  messages,
  onSendMessage,
  disabled,
  activeTab,
  setActiveTab,
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
    <div className="relative h-full flex">
      {/* 사이드바 컨텐츠 */}
      <div
        className={`
          h-full
          transition-all
          duration-300
          ease-in-out
          overflow-hidden
          ${isSidebarCollapsed ? "w-0" : "w-80"}
        `}
      >
        <aside className="h-full w-80 border-l border-slate-200 bg-white flex flex-col">
          {/* 탭 헤더 */}
          <div className="h-10 flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 text-sm font-medium transition-colors ${
                activeTab === "ai"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              AI 기능
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              채팅방
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {activeTab === "ai" ? (
              /* AI 어시스턴트 탭 */
              <div className="absolute inset-0 p-4 bg-slate-50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-slate-900 font-bold mb-1">
                  AI Assistant
                </h3>
                <p className="text-slate-500 text-sm">
                  안녕하세요! 코드에 대해 질문하거나,
                  <br />
                  테스트 코드 생성을 요청해주세요.
                </p>
              </div>
            ) : (
              /* 텍스트 채팅 탭 */
              <div className="absolute inset-0 flex flex-col bg-white">
                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}

                  {/* 메시지가 없을 때 */}
                  {messages.length === 0 && (
                    <p className="text-center text-slate-400 py-8">
                      메시지가 없습니다
                    </p>
                  )}

                  {/* 스크롤 타겟 (항상 맨 아래에 위치) */}
                  <div ref={scrollRef} />
                </div>

                {/* 입력 폼 */}
                <form
                  onSubmit={handleSubmit}
                  className="p-4 border-t border-slate-100"
                >
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
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 disabled:bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={disabled || !inputText.trim()}
                      className="rounded-xl bg-indigo-400 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70 transition-colors whitespace-nowrap"
                    >
                      전송
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 사이드바 토글 버튼 */}
      <button
        onClick={() => setIsSidebarCollapsed((previous) => !previous)}
        className="
          absolute
          -left-6
          top-1/2
          -translate-y-1/2
          bg-neutral-700
          hover:bg-neutral-600
          px-1
          py-2
          rounded
          text-sm
          transition
          z-20
        "
      >
        {isSidebarCollapsed ? "◀" : "▶"}
      </button>
    </div>
  );
}
