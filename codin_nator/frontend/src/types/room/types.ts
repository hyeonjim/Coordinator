/**
 * 시그널링 서버로 보내는/받는 모든 메시지 타입
 *    WebRTC 연결을 위해서는 시그널링 서버가 필요합니다:
 * 1. join: 방에 입장 요청
 * 2. joined: 방 입장 성공 (기존 참여자 목록 포함)
 * 3. peer-joined: 새로운 참여자가 들어왔을 때
 * 4. offer: WebRTC 연결 제안 (SDP 포함)
 * 5. answer: WebRTC 연결 응답 (SDP 포함)
 * 6. ice: ICE 후보 교환 (NAT 통과용)
 * 7. leave: 방 퇴장
 * 8. peer-left: 다른 참여자가 나갔을 때
 * 9. chat: 텍스트 채팅 메시지
 */
export type SignalMessage =
  // 방 입장 요청
  | { type: "join"; roomId: string; userId: string; userName: string }
  // 방 입장 성공 응답
  | { type: "joined"; roomId: string; userId: string; peers: PeerInfo[] }
  // 새 참여자 알림
  | { type: "peer-joined"; roomId: string; userId: string; userName: string }
  // WebRTC Offer (연결 제안)
  | {
      type: "offer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  // WebRTC Answer (연결 응답)
  | {
      type: "answer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  // ICE Candidate (네트워크 경로 정보)
  | {
      type: "ice";
      roomId: string;
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    }
  // 방 퇴장
  | { type: "leave"; roomId: string; userId: string }
  // 참여자 퇴장 알림
  | { type: "peer-left"; roomId: string; userId: string }
  // 텍스트 채팅 메시지
  | {
      type: "chat";
      roomId: string;
      userId: string;
      userName: string;
      message: string;
      timestamp: number;
    };

// 참여자 관련 타입
/**
 * 간단한 참여자 정보 (joined 메시지에서 사용)
 */
export interface PeerInfo {
  userId: string;
  userName: string;
}

/**
 * 참여자의 전체 상태
 * - userId: 고유 식별자
 * - userName: 화면에 표시할 이름
 * - isSpeaking: 현재 말하고 있는지 (음성 감지)
 * - micOn: 마이크 켜짐 여부
 */
export interface Participant {
  userId: string;
  userName: string;
  isSpeaking: boolean;
  micOn: boolean;
}

/**
 * 텍스트 채팅 메시지
 */
export interface ChatMessage {
  id: string; // 메시지 고유 ID
  userId: string; // 발신자 ID
  userName: string; // 발신자 이름
  message: string; // 메시지 내용
  timestamp: number; // 발송 시간 (Unix timestamp)
  isMe: boolean; // 내가 보낸 메시지인지
}

/**
 * useWebSocket 훅의 반환 타입
 */
export interface UseWebSocketReturn {
  isConnected: boolean;
  send: (message: SignalMessage) => void;
  lastMessage: SignalMessage | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * useWebRTC 훅의 반환 타입
 */
export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  isMicOn: boolean;
  isSpeaking: boolean;
  toggleMic: () => void;
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  createOffer: (peerId: string) => Promise<RTCSessionDescriptionInit | null>;
  handleOffer: (
    peerId: string,
    sdp: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit | null>;
  handleAnswer: (
    peerId: string,
    sdp: RTCSessionDescriptionInit,
  ) => Promise<void>;
  handleIce: (peerId: string, candidate: RTCIceCandidateInit) => Promise<void>;
  removePeer: (peerId: string) => void;
  getPeerSpeaking: (peerId: string) => boolean;
  simulateIncomingAudio: (peerId: string) => void;
  togglePeerMute: (peerId: string) => void;
  isPeerMuted: (peerId: string) => boolean;
}
