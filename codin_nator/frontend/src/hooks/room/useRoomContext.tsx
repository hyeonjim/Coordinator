/**
 * useRoomContext.tsx - React Context를 사용한 방 상태 공유
 *
 * [React Context란?]
 * - 컴포넌트 트리에서 "props drilling" 없이 데이터를 공유하는 메커니즘
 * - props drilling: 부모 → 자식 → 손자... 순으로 props를 계속 전달하는 번거로운 패턴
 * - Context를 사용하면 Provider 하위의 어떤 컴포넌트에서든 직접 데이터에 접근 가능
 *
 * [구조]
 * - createContext: Context 객체 생성 (초기값 null)
 * - RoomProvider: Context의 값을 제공하는 래퍼 컴포넌트
 *   → useRoom() 훅으로 모든 방 상태를 계산하고 Provider에 전달
 * - useRoomContext: 하위 컴포넌트에서 Context 값을 가져오는 커스텀 훅
 *   → Provider 밖에서 호출하면 에러를 던져 잘못된 사용을 방지
 *
 * [사용 예시]
 * // App.tsx
 * <RoomProvider>
 *   <ChatPanel />      ← useRoomContext()로 chatMessages 접근
 *   <VoicePanel />     ← useRoomContext()로 participants 접근
 *   <CodeEditor />     ← useRoomContext()로 editorCode 접근
 * </RoomProvider>
 */
import { createContext, useContext, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "@/hooks/room/chat/useRoomActions";
import type { RoomContextValue } from "@/types/room";

/** Context 객체 생성 - 초기값 null (Provider 밖에서는 값이 없음) */
const RoomContext = createContext<RoomContextValue | null>(null);

/**
 * RoomProvider - 방 상태를 하위 컴포넌트에 제공하는 래퍼 컴포넌트
 * - useParams: URL 경로에서 roomId를 추출 (예: /room/123 → roomId="123")
 * - useRoom: 모든 방 관련 상태와 액션을 통합한 최상위 훅
 */
export function RoomProvider({ children }: { children: ReactNode }) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const value = useRoom(roomId, navigate);

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

/**
 * useRoomContext - 방 상태에 접근하는 커스텀 훅
 *
 * [useContext란?]
 * - createContext로 생성된 Context의 현재 값을 가져오는 React 훅
 * - 가장 가까운 상위 Provider의 value를 반환
 * - Provider가 없으면 createContext의 초기값(null)을 반환
 *
 * [에러 처리]
 * - Provider 밖에서 호출하면 context가 null이므로 에러를 던짐
 * - 개발 시 잘못된 사용을 즉시 발견할 수 있음
 */
export function useRoomContext(): RoomContextValue {
  const context = useContext(RoomContext);
  if (!context)
    throw new Error(
      "useRoomContext는 RoomProvider 안에서만 사용할 수 있습니다.",
    );
  return context;
}
