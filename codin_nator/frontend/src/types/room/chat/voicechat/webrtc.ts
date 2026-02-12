/**
 * useWebRTC 훅의 반환 타입
 * WebRTC P2P 음성 통신 관련 모든 기능 정의
 *
 * RTCSessionDescriptionInit, RTCIceCandidateInit은 Web API 타입입니다.
 * voicechat/types.ts의 SessionDescriptionPayload, IceCandidatePayload는
 * 구조적으로 호환되므로 직접 전달할 수 있습니다.
 */
export interface UseWebRTCReturn {
  /** 로컬 미디어 스트림 (내 마이크 입력) */
  localStream: MediaStream | null;
  isMicOn: boolean;
  isSpeaking: boolean;
  toggleMic: () => void;
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  /** WebRTC Offer 생성 */
  createOffer: (peerId: string) => Promise<RTCSessionDescriptionInit | null>;
  /** WebRTC Offer 수신 및 Answer 생성 */
  handleOffer: (
    peerId: string,
    sessionDescription: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit | null>;
  /** WebRTC Answer 수신 */
  handleAnswer: (
    peerId: string,
    sessionDescription: RTCSessionDescriptionInit,
  ) => Promise<void>;
  /** ICE Candidate 수신 */
  handleIce: (peerId: string, iceCandidate: RTCIceCandidateInit) => Promise<void>;
  removePeer: (peerId: string) => void;
  getPeerSpeaking: (peerId: string) => boolean;
  /** 특정 피어 음소거 토글 */
  togglePeerMute: (peerId: string) => void;
  /** 피어 음소거 상태 확인 */
  isPeerMuted: (peerId: string) => boolean;
}
