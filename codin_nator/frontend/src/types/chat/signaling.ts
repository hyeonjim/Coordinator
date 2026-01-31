/**
 * WebSocket 시그널링 메시지 타입
 * WebRTC 연결을 위해 서버와 주고받는 메시지 정의
 */

/**
 * 간단한 참여자 정보 (joined 메시지에서 사용)
 */
export interface PeerInfo {
  userId: string;
  userName: string;
}

/**
 * 시그널링 서버로 보내는/받는 모든 메시지 타입
 * WebRTC 연결을 위해서는 시그널링 서버가 필요합니다:
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
