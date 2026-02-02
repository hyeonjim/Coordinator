/**
 * 텍스트 채팅 메시지 어댑터
 *
 * 역할:
 * - 백엔드 DTO ↔ 프론트엔드 타입 변환
 * - 참여자 스토어를 사용하여 사용자 정보 보강
 *
 * 어댑터 패턴(Adapter Pattern)이란?
 * - 서로 호환되지 않는 인터페이스를 연결해주는 디자인 패턴
 * - 여기서는 백엔드의 메시지 형식과 프론트엔드의 메시지 형식을 변환
 *
 * 왜 필요한가?
 * - 백엔드: { sender: "userId" } ← userId만 있음
 * - 프론트엔드: { userId, userName, imageUrl } ← 전부 필요
 * - 어댑터가 중간에서 변환해줌
 */

import type { BackendTextChatMessage } from "@/types/chat/backendDto";
import type { ChatMessage } from "@/types/chat/message";
import { generateId } from "@/utils/room/idGenerator";

/**
 * 프론트엔드 메시지 → 백엔드 DTO 변환
 *
 * 사용 시점: 메시지 전송 시
 *
 * 변환 과정:
 * 1. userName, imageUrl 제거 (백엔드 DTO에 없음)
 * 2. userId → sender로 매핑
 * 3. type을 "TALK"로 설정
 *
 * @param message - 전송할 메시지 내용
 * @param userId - 현재 사용자 ID
 * @param roomId - 채팅방 ID
 * @returns 백엔드 DTO 형식 메시지
 */
export function toBackendTextChatMessage(
  message: string,
  userId: string,
  roomId: string,
): BackendTextChatMessage {
  console.log(
    `[ChatAdapter] 🔄 프론트엔드 → 백엔드 변환 [${roomId}]:`,
    message,
  );

  return {
    roomId,
    sender: userId, // userId를 sender로 매핑
    message,
    type: "TALK",
  };
}

/**
 * 백엔드 DTO → 프론트엔드 메시지 변환
 *
 * 사용 시점: 메시지 수신 시
 *
 * 변환 과정:
 * 1. sender(userId) 추출
 * 2. 참여자 스토어에서 userName, imageUrl 조회
 * 3. 조회 실패 시 "Unknown User" 대체
 * 4. 프론트엔드 ChatMessage 형식으로 변환
 *
 * @param backendMessage - 백엔드 DTO 메시지
 * @param getParticipant - 참여자 정보 조회 함수
 * @param myUserId - 현재 사용자 ID (내 메시지인지 판별용)
 * @returns 프론트엔드 채팅 메시지
 */
export function fromBackendTextChatMessage(
  backendMessage: BackendTextChatMessage,
  getParticipant: (userId: string) => { userName: string; imageUrl?: string } | undefined,
  myUserId: string,
): ChatMessage {
  // sender(userId)로 참여자 정보 조회
  const participant = getParticipant(backendMessage.sender);

  // 참여자 정보가 없으면 Unknown User 대체
  const userName = participant?.userName ?? "Unknown User";
  const imageUrl = participant?.imageUrl;

  console.log(
    `[ChatAdapter] 🔄 백엔드 → 프론트엔드 변환:`,
    `${userName} (${backendMessage.sender}): ${backendMessage.message}`,
  );

  // 프론트엔드 ChatMessage 형식으로 변환
  return {
    id: generateId("message"),
    userId: backendMessage.sender,
    userName,
    imageUrl,
    message: backendMessage.message,
    timestamp: Date.now(),
    isMe: backendMessage.sender === myUserId,
  };
}

/**
 * 입장 메시지 생성 (백엔드 형식)
 *
 * 사용 시점: 방 입장 시
 *
 * @param userId - 사용자 ID
 * @param userName - 사용자 이름
 * @param roomId - 채팅방 ID
 * @returns 백엔드 ENTER 메시지
 */
export function createEnterMessage(
  userId: string,
  userName: string,
  roomId: string,
): BackendTextChatMessage {
  console.log(`[ChatAdapter] 📥 입장 메시지 생성: ${userName} (${userId})`);

  return {
    roomId,
    sender: userId,
    message: `${userName}님이 입장하셨습니다.`, // 백엔드에서 덮어쓰지만 일단 설정
    type: "ENTER",
  };
}
