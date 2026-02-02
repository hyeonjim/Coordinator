/**
 * 음성 채팅 시그널링 메시지 어댑터
 *
 * 역할:
 * - WebRTC 시그널링 메시지 ↔ 백엔드 SignalingMessage 변환
 * - 사용자 정보를 data 필드에 포함/추출
 *
 * WebRTC 시그널링이란?
 * - WebRTC는 P2P(Peer-to-Peer) 연결을 만듦
 * - 하지만 처음 연결할 때는 서버를 거쳐야 함 (시그널링)
 * - 시그널링 과정:
 *   1. Offer 생성 (연결 제안, SDP 포함)
 *   2. Offer를 서버 통해 상대방에게 전송
 *   3. Answer 생성 (연결 응답, SDP 포함)
 *   4. Answer를 서버 통해 전송
 *   5. ICE Candidate 교환 (네트워크 경로 정보)
 *   6. P2P 연결 완료!
 *
 * SDP(Session Description Protocol)란?
 * - 연결에 필요한 정보 (코덱, 네트워크 주소 등)
 * - Offer와 Answer에 포함됨
 *
 * ICE Candidate란?
 * - 실제 연결 가능한 네트워크 경로
 * - NAT 통과를 위해 여러 후보를 교환
 */

import type {
  BackendSignalingMessage,
  JoinData,
  UserInfo,
} from "@/types/chat/backendDto";

/**
 * JOIN 메시지 생성 (백엔드 형식)
 *
 * 사용 시점: 방 입장 시
 *
 * data 필드에 사용자 정보를 포함하여
 * 다른 참여자들이 이름과 이미지를 알 수 있도록 함
 *
 * @param userId - 사용자 ID
 * @param userName - 사용자 이름
 * @param imageUrl - 사용자 프로필 이미지 URL
 * @param roomId - 채팅방 ID
 * @returns 백엔드 JOIN 메시지
 */
export function createJoinMessage(
  userId: string,
  userName: string,
  imageUrl: string | undefined,
  roomId: string,
): BackendSignalingMessage {
  console.log(`[SignalingAdapter] 📥 JOIN 메시지 생성: ${userName} (${userId})`);

  const data: JoinData = {
    userName,
    imageUrl,
  };

  return {
    type: "JOIN",
    roomId,
    senderId: userId,
    receiverId: null, // 브로드캐스트
    data,
  };
}

/**
 * OFFER 메시지 생성 (WebRTC 연결 제안)
 *
 * 사용 시점: 새로운 피어와 연결 시작
 *
 * @param senderId - 보내는 사람 ID
 * @param receiverId - 받는 사람 ID
 * @param roomId - 채팅방 ID
 * @param sdp - WebRTC SDP (Session Description)
 * @returns 백엔드 OFFER 메시지
 */
export function createOfferMessage(
  senderId: string,
  receiverId: string,
  roomId: string,
  sdp: RTCSessionDescriptionInit,
): BackendSignalingMessage {
  console.log(
    `[SignalingAdapter] 📤 OFFER 전송: ${senderId} → ${receiverId}`,
  );

  return {
    type: "OFFER",
    roomId,
    senderId,
    receiverId,
    data: sdp,
  };
}

/**
 * ANSWER 메시지 생성 (WebRTC 연결 응답)
 *
 * 사용 시점: OFFER 받았을 때 응답
 *
 * @param senderId - 보내는 사람 ID
 * @param receiverId - 받는 사람 ID
 * @param roomId - 채팅방 ID
 * @param sdp - WebRTC SDP (Session Description)
 * @returns 백엔드 ANSWER 메시지
 */
export function createAnswerMessage(
  senderId: string,
  receiverId: string,
  roomId: string,
  sdp: RTCSessionDescriptionInit,
): BackendSignalingMessage {
  console.log(
    `[SignalingAdapter] 📤 ANSWER 전송: ${senderId} → ${receiverId}`,
  );

  return {
    type: "ANSWER",
    roomId,
    senderId,
    receiverId,
    data: sdp,
  };
}

/**
 * ICE Candidate 메시지 생성 (네트워크 경로 정보)
 *
 * 사용 시점: ICE Candidate 발견 시
 *
 * ICE Candidate란?
 * - 실제로 연결 가능한 네트워크 주소
 * - 여러 개가 발견되며 최적의 경로를 찾음
 *
 * @param senderId - 보내는 사람 ID
 * @param receiverId - 받는 사람 ID
 * @param roomId - 채팅방 ID
 * @param candidate - ICE Candidate 정보
 * @returns 백엔드 ICE 메시지
 */
export function createIceMessage(
  senderId: string,
  receiverId: string,
  roomId: string,
  candidate: RTCIceCandidateInit,
): BackendSignalingMessage {
  console.log(
    `[SignalingAdapter] 📤 ICE Candidate 전송: ${senderId} → ${receiverId}`,
  );

  return {
    type: "ICE",
    roomId,
    senderId,
    receiverId,
    data: candidate,
  };
}

/**
 * LEAVE 메시지 생성 (방 퇴장)
 *
 * 사용 시점: 방 퇴장 시
 *
 * @param userId - 사용자 ID
 * @param roomId - 채팅방 ID
 * @returns 백엔드 LEAVE 메시지
 */
export function createLeaveMessage(
  userId: string,
  roomId: string,
): BackendSignalingMessage {
  console.log(`[SignalingAdapter] 📤 LEAVE 메시지 전송: ${userId}`);

  return {
    type: "LEAVE",
    roomId,
    senderId: userId,
    receiverId: null,
    data: null,
  };
}

/**
 * JOIN 메시지에서 사용자 정보 추출
 *
 * 사용 시점: JOIN 메시지 수신 시
 *
 * @param message - 백엔드 JOIN 메시지
 * @returns 사용자 정보 (추출 실패 시 null)
 */
export function extractUserInfoFromJoin(
  message: BackendSignalingMessage,
): UserInfo | null {
  if (message.type !== "JOIN") {
    console.warn(
      `[SignalingAdapter] ⚠️ JOIN이 아닌 메시지에서 사용자 정보 추출 시도:`,
      message.type,
    );
    return null;
  }

  const data = message.data as JoinData | undefined;

  if (!data || !data.userName) {
    console.warn(
      `[SignalingAdapter] ⚠️ JOIN 메시지에 사용자 정보 없음:`,
      message,
    );
    return null;
  }

  console.log(
    `[SignalingAdapter] 📨 JOIN 수신: ${data.userName} (${message.senderId})`,
  );

  return {
    userId: message.senderId,
    userName: data.userName,
    imageUrl: data.imageUrl,
  };
}

/**
 * 시그널링 메시지 타입 가드
 *
 * 백엔드 메시지의 타입을 체크하는 유틸리티 함수들
 */
export const isOfferMessage = (
  msg: BackendSignalingMessage,
): msg is BackendSignalingMessage & { type: "OFFER" } => msg.type === "OFFER";

export const isAnswerMessage = (
  msg: BackendSignalingMessage,
): msg is BackendSignalingMessage & { type: "ANSWER" } => msg.type === "ANSWER";

export const isIceMessage = (
  msg: BackendSignalingMessage,
): msg is BackendSignalingMessage & { type: "ICE" } => msg.type === "ICE";

export const isJoinMessage = (
  msg: BackendSignalingMessage,
): msg is BackendSignalingMessage & { type: "JOIN" } => msg.type === "JOIN";

export const isLeaveMessage = (
  msg: BackendSignalingMessage,
): msg is BackendSignalingMessage & { type: "LEAVE" } => msg.type === "LEAVE";

export const isPeerListMessage = (
  msg: BackendSignalingMessage,
): msg is BackendSignalingMessage & { type: "PEER_LIST" } => msg.type === "PEER_LIST";
