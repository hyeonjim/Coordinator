/**
 * useWebRTC 훅의 반환 타입
 * WebRTC P2P 음성 통신 관련 모든 기능 정의
 */
export interface UseWebRTCReturn {
  /** 로컬 미디어 스트림 (내 마이크 입력) */
  localStream: MediaStream | null;
  /** 마이크 켜짐 여부 */
  isMicOn: boolean;
  /** 현재 말하고 있는지 (음성 감지) */
  isSpeaking: boolean;
  /** 마이크 토글 함수 */
  toggleMic: () => void;
  /** 오디오 스트림 시작 */
  startAudio: () => Promise<void>;
  /** 오디오 스트림 중지 */
  stopAudio: () => void;
  /** WebRTC Offer 생성 */
  createOffer: (peerId: string) => Promise<RTCSessionDescriptionInit | null>;
  /** WebRTC Offer 수신 및 Answer 생성 */
  handleOffer: (
    peerId: string,
    sdp: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit | null>;
  /** WebRTC Answer 수신 */
  handleAnswer: (
    peerId: string,
    sdp: RTCSessionDescriptionInit,
  ) => Promise<void>;
  /** ICE Candidate 수신 */
  handleIce: (peerId: string, candidate: RTCIceCandidateInit) => Promise<void>;
  /** 피어 연결 제거 */
  removePeer: (peerId: string) => void;
  /** 피어 음성 상태 조회 */
  getPeerSpeaking: (peerId: string) => boolean;
  /** 테스트용 오디오 시뮬레이션 */
  simulateIncomingAudio: (peerId: string) => void;
  /** 특정 피어 음소거 토글 */
  togglePeerMute: (peerId: string) => void;
  /** 피어 음소거 상태 확인 */
  isPeerMuted: (peerId: string) => boolean;
}
