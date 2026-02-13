import { createContext, useContext, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "@/hooks/room/chat/useRoomActions";
import type { RoomContextValue } from "@/types/room/types";

export const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  return (
    <RoomContext.Provider value={useRoom(roomId, navigate)}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext(): RoomContextValue {
  const context = useContext(RoomContext);
  if (!context)
    throw new Error(
      "useRoomContext는 RoomProvider 안에서만 사용할 수 있습니다.",
    );
  return context;
}
