/**
 * 백엔드 DTO(Data Transfer Object) 타입 정의
 *
 * 이 파일은 백엔드 API와 통신할 때 사용되는 데이터 타입을 정의합니다.
 * 백엔드의 Java DTO와 1:1 대응되도록 작성되었습니다.
 */

/**
 * 텍스트 채팅 메시지 타입 (백엔드 TextChatMessage.java 대응)
 *
 * 백엔드 구조:
 * - roomId: 채팅방 ID
 * - sender: 보낸 사람의 userId (이름이 아님!)
 * - message: 메시지 내용
 * - type: 메시지 유형 (ENTER: 입장 알림, TALK: 일반 채팅)
 */
export interface BackendTextChatMessage {
  roomId: string;
  sender: string;
  message: string;
  type: "ENTER" | "TALK";
}

/**
 * 음성 채팅 시그널링 메시지 타입 열거형
 *
 * 백엔드 VoiceType.java enum 대응:
 * - JOIN: 방 입장
 * - OFFER: WebRTC 연결 제안 (SDP 포함)
 * - ANSWER: WebRTC 연결 응답 (SDP 포함)
 * - ICE: ICE Candidate (네트워크 경로 정보)
 * - MIC: 마이크 상태 변경
 * - LEAVE: 방 퇴장
 * - PEER_LIST: 현재 참여자 목록
 */
export type VoiceType =
  | "JOIN"
  | "OFFER"
  | "ANSWER"
  | "ICE"
  | "MIC"
  | "LEAVE"
  | "PEER_LIST";

/**
 * 음성 채팅 시그널링 메시지 (백엔드 SignalingMessage.java 대응)
 *
 * 백엔드 구조:
 * - type: 메시지 유형 (VoiceType)
 * - roomId: 채팅방 ID
 * - senderId: 보낸 사람 ID
 * - receiverId: 받는 사람 ID (null이면 브로드캐스트)
 * - data: 실제 신호 데이터 (타입에 따라 다름)
 *   - JOIN: { userName, imageUrl }
 *   - OFFER/ANSWER: RTCSessionDescriptionInit (SDP)
 *   - ICE: RTCIceCandidateInit
 *   - PEER_LIST: string[] (userId 배열)
 */
export interface BackendSignalingMessage {
  type: VoiceType;
  roomId: string;
  senderId: string;
  receiverId: string | null;
  data: any; // 백엔드에서 Object 타입으로 정의되어 정확한 타입 불명, 런타임에 타입별로 파싱 필요
}

/**
 * 사용자 정보 (프론트엔드 전용)
 *
 * 백엔드 DTO에는 없지만, 프론트엔드에서 사용자 표시를 위해 필요한 정보입니다.
 * JOIN 메시지의 data 필드에 포함하여 다른 클라이언트에게 전달합니다.
 */
export interface UserInfo {
  userId: string;
  userName: string;
  imageUrl?: string;
}

/**
 * PEER_LIST 응답의 data 필드 타입
 *
 * 백엔드에서 Set<String>을 반환하므로 문자열 배열로 매핑됩니다.
 */
export type PeerListData = string[];

/**
 * JOIN 메시지의 data 필드 타입
 *
 * 사용자 정보를 포함합니다.
 */
export interface JoinData {
  userName: string;
  imageUrl?: string;
}
