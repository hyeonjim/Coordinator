/**
 * VoiceChat 메시지 타입 정의
 * 백엔드 VoiceType enum과 매핑
 */
export type VoiceMessageType =
  | "JOIN"       // 방 입장
  | "OFFER"      // WebRTC offer
  | "ANSWER"     // WebRTC answer
  | "ICE"        // ICE candidate
  | "MIC"        // 마이크 상태 변경
  | "LEAVE"      // 방 퇴장
  | "PEER_LIST"; // 참여자 목록

/**
 * 서버로 전송하는 VoiceChat 메시지
 * 백엔드 SignalingMessage DTO와 매핑
 */
export interface VoiceChatMessagePayload {
  type: VoiceMessageType;
  roomId: string;
  senderId: string;
  receiverId?: string; // peer-to-peer 메시지용 (optional)
  data?: unknown;      // SDP, ICE candidate, mic status 등
}

/**
 * 서버로부터 수신하는 VoiceChat 메시지
 */
export interface VoiceChatMessageReceived {
  type: VoiceMessageType;
  roomId: string;
  senderId: string;
  receiverId?: string;
  data?: unknown;
}

/**
 * WebRTC Offer/Answer 페이로드
 */
export interface SessionDescriptionPayload {
  type: "offer" | "answer";
  sdp: string;
}

/**
 * ICE Candidate 페이로드
 */
export interface IceCandidatePayload {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

/**
 * 마이크 상태 페이로드
 */
export interface MicrophoneStatusPayload {
  microphoneOn: boolean;
}

/**
 * 참여자 정보 (PEER_LIST data)
 */
export type ParticipantList = string[]; // userId 배열
