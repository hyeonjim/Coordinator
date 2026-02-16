/**
 * Room 페이지 (협업 코딩 방)
 *
 * [구조]
 * RoomProvider로 Room 전체 상태를 Context에 제공한 후,
 * RoomLayout에서 실제 UI를 렌더링합니다.
 *
 * [React Context 패턴]
 * - RoomProvider: 방의 모든 상태(참여자, 채팅, 파일 등)를 하위 컴포넌트에 제공
 * - Provider 내부의 모든 컴포넌트가 useRoomContext()로 상태에 접근 가능
 * - Props Drilling(props를 여러 단계로 전달)을 방지하는 패턴
 */

import { RoomProvider } from "@/hooks/room/useRoomContext";
import RoomLayout from "@/layouts/RoomLayout";

export default function RoomPage() {
  return (
    <RoomProvider>
      <RoomLayout />
    </RoomProvider>
  );
}
