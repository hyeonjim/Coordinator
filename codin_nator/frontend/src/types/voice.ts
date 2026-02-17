/**
 * @file voice.ts - 음성 채팅(VoiceChat) 및 WebRTC 관련 타입 정의
 *
 * 실시간 음성 통화 기능의 전체 타입을 정의합니다.
 *
 * 아키텍처 개요:
 * 1. 시그널링(Signaling): STOMP over SockJS로 WebRTC 연결 협상 메시지 교환
 *    - JOIN → OFFER → ANSWER → ICE_CANDIDATE 순서로 P2P 연결 수립
 * 2. 미디어 전송: WebRTC P2P 연결로 실제 음성 데이터 송수신
 *    - getUserMedia()로 마이크 입력 획득
 *    - RTCPeerConnection으로 피어 간 직접 통신
 *
 * WebRTC(Web Real-Time Communication):
 * - 브라우저 간 플러그인 없이 실시간 음성/영상/데이터 통신을 가능하게 하는 Web API
 * - P2P(Peer-to-Peer) 방식으로, 서버를 거치지 않고 클라이언트끼리 직접 통신
 * - SDP(Session Description Protocol): 미디어 형식 협상
 * - ICE(Interactive Connectivity Establishment): NAT/방화벽 통과를 위한 연결 후보 교환
 *
 * 통합 출처:
 * - types/room/chat/voicechat/types.ts (시그널링, 참여자, UI)
 * - types/room/chat/voicechat/webrtc.ts (WebRTC 훅 반환 타입)
 */

import type { Participant } from "@/types/room";

/**
 * 음성 채팅 시그널링 메시지 타입
 *
 * WebRTC P2P 연결을 수립하기 위한 시그널링 메시지의 종류입니다.
 * 연결 수립 흐름: JOIN → PEER_LIST → OFFER → ANSWER → ICE
 *
 * - JOIN: 방 입장 알림
 * - OFFER: WebRTC SDP Offer 전송 (연결 제안)
 * - ANSWER: WebRTC SDP Answer 전송 (연결 수락)
 * - ICE: ICE Candidate 교환 (네트워크 경로 후보)
 * - MIC: 마이크 on/off 상태 변경 알림
 * - LEAVE: 방 퇴장 알림
 * - PEER_LIST: 현재 방 참여자 목록 (서버가 JOIN 시 전송)
 * - IDENTITY: 사용자 신원 정보 (이름, 이미지)
 */
export type VoiceMessageType =
  | "JOIN"
  | "OFFER"
  | "ANSWER"
  | "ICE"
  | "MIC"
  | "LEAVE"
  | "PEER_LIST"
  | "IDENTITY";

/**
 * 서버로 전송하는 VoiceChat 시그널링 메시지
 *
 * 백엔드 SignalingMessage DTO와 매핑됩니다.
 * data 필드에는 메시지 타입에 따라 다른 페이로드가 들어갑니다.
 */
export interface VoiceChatMessagePayload {
  /** 메시지 타입 */
  type: VoiceMessageType;

  /** 방 ID */
  roomId: string;

  /** 발신자 ID */
  senderId: string;

  /** 수신자 ID (peer-to-peer 메시지용, 브로드캐스트 시 생략) */
  receiverId?: string;

  /** 메시지 데이터 (SDP, ICE candidate, mic status 등) */
  data?: unknown;
}

/**
 * 서버로부터 수신하는 VoiceChat 시그널링 메시지
 */
export interface VoiceChatMessageReceived {
  /** 메시지 타입 */
  type: VoiceMessageType;

  /** 방 ID */
  roomId: string;

  /** 발신자 ID */
  senderId: string;

  /** 수신자 ID */
  receiverId?: string;

  /** 메시지 데이터 */
  data?: unknown;
}

/**
 * JOIN/IDENTITY 메시지의 사용자 정보 데이터
 *
 * 방 입장 시 다른 참여자에게 자신의 정보를 알리는 데 사용됩니다.
 */
export interface UserPresenceData {
  /** 사용자 이름 */
  userName?: string;

  /** 프로필 이미지 URL */
  imageUrl?: string;

  /** 마이크 상태 */
  micOn?: boolean;
}

/**
 * WebRTC SDP(Session Description Protocol) 페이로드
 *
 * Offer 또는 Answer에 포함되는 SDP 데이터입니다.
 * SDP는 미디어 코덱, 해상도, 전송 프로토콜 등을 협상하는 텍스트 형식입니다.
 */
export interface SessionDescriptionPayload {
  /** "offer" 또는 "answer" */
  type: "offer" | "answer";

  /** SDP 문자열 */
  sdp: string;
}

/**
 * WebRTC Offer 페이로드 (SDP + 발신자 정보 포함)
 *
 * JOIN 시 기존 참여자들이 새 참여자에게 Offer를 보낼 때
 * SDP와 함께 자신의 사용자 정보도 전달합니다.
 * extends를 사용하여 두 인터페이스를 결합합니다.
 */
export interface OfferPayload extends SessionDescriptionPayload, UserPresenceData {}

/**
 * ICE Candidate 페이로드
 *
 * ICE(Interactive Connectivity Establishment) 후보 정보입니다.
 * NAT/방화벽 뒤에 있는 피어를 찾기 위한 네트워크 경로 후보입니다.
 */
export interface IceCandidatePayload {
  /** ICE candidate 문자열 */
  candidate: string;

  /** SDP 미디어 라인 인덱스 */
  sdpMLineIndex: number | null;

  /** SDP 미디어 ID */
  sdpMid: string | null;
}

/**
 * 마이크 상태 변경 페이로드
 *
 * MIC 타입 메시지의 data 필드에 담깁니다.
 */
export interface MicrophoneStatusPayload {
  /** 마이크 켜짐 여부 */
  microphoneOn: boolean;
}

/**
 * 참여자 목록 (PEER_LIST data)
 *
 * 서버가 JOIN 시 응답하는 현재 방의 참여자 ID 배열입니다.
 */
export type ParticipantList = string[];

/**
 * useVoiceChatWebSocket 훅 반환 타입
 *
 * 음성 채팅 시그널링을 위한 STOMP 연결을 관리합니다.
 * 실제 음성 데이터는 WebRTC로 전송하고,
 * 이 WebSocket은 P2P 연결 수립을 위한 시그널링 전용입니다.
 */
export interface UseVoiceChatWebSocketReturn {
  /** WebSocket 연결 상태 */
  isConnected: boolean;

  /**
   * 방을 구독하여 시그널링 메시지 수신을 시작합니다.
   * @param roomId - 구독할 방 ID
   * @param onMessage - 메시지 수신 콜백
   */
  subscribeToRoom(
    roomId: string,
    onMessage: (message: VoiceChatMessageReceived) => void,
  ): void;

  /** 방 구독 해제 */
  unsubscribeFromRoom(): void;

  /** 시그널링 메시지 전송 */
  sendMessage(payload: VoiceChatMessagePayload): void;

  /** STOMP 연결 시작 */
  connect(): void;

  /** STOMP 연결 종료 */
  disconnect(): void;
}

/**
 * useWebRTC 훅의 반환 타입
 *
 * WebRTC P2P 음성 통신 관련 모든 기능을 정의합니다.
 * RTCSessionDescriptionInit, RTCIceCandidateInit은 브라우저 내장 Web API 타입입니다.
 *
 * voicechat의 SessionDescriptionPayload, IceCandidatePayload는
 * Web API 타입과 구조적으로 호환되므로 직접 전달할 수 있습니다.
 * (TypeScript의 구조적 타이핑 덕분)
 */
export interface UseWebRTCReturn {
  /** 로컬 미디어 스트림 (내 마이크 입력, null이면 미획득 상태) */
  localStream: MediaStream | null;

  /** 내 마이크 켜짐 여부 */
  isMicOn: boolean;

  /** 내가 현재 말하고 있는지 여부 (오디오 레벨 감지) */
  isSpeaking: boolean;

  /** 마이크 on/off 토글 */
  toggleMic: () => void;

  /** 마이크 입력 시작 (getUserMedia 호출) */
  startAudio: () => Promise<void>;

  /** 마이크 입력 중지 (스트림 해제) */
  stopAudio: () => void;

  /**
   * WebRTC Offer를 생성합니다.
   * 새 피어에게 연결을 제안할 때 호출합니다.
   * @param peerId - 상대방 사용자 ID
   * @returns SDP Offer (실패 시 null)
   */
  createOffer: (peerId: string) => Promise<RTCSessionDescriptionInit | null>;

  /**
   * 상대방의 Offer를 받고 Answer를 생성합니다.
   * @param peerId - 상대방 사용자 ID
   * @param sessionDescription - 수신한 SDP Offer
   * @returns SDP Answer (실패 시 null)
   */
  handleOffer: (
    peerId: string,
    sessionDescription: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit | null>;

  /**
   * 상대방의 Answer를 수신하여 연결을 완료합니다.
   * @param peerId - 상대방 사용자 ID
   * @param sessionDescription - 수신한 SDP Answer
   */
  handleAnswer: (
    peerId: string,
    sessionDescription: RTCSessionDescriptionInit,
  ) => Promise<void>;

  /**
   * ICE Candidate를 수신하여 연결 후보를 추가합니다.
   * @param peerId - 상대방 사용자 ID
   * @param iceCandidate - ICE Candidate 정보
   */
  handleIce: (peerId: string, iceCandidate: RTCIceCandidateInit) => Promise<void>;

  /** 특정 피어와의 연결을 제거합니다. */
  removePeer: (peerId: string) => void;

  /** 특정 피어가 현재 말하고 있는지 확인합니다. */
  getPeerSpeaking: (peerId: string) => boolean;

  /** 특정 피어의 오디오 음소거를 토글합니다 (로컬에서만 적용). */
  togglePeerMute: (peerId: string) => void;

  /** 특정 피어가 로컬에서 음소거 상태인지 확인합니다. */
  isPeerMuted: (peerId: string) => boolean;
}

/**
 * 음성 채팅 훅들이 공통으로 필요로 하는 사용자/방 컨텍스트
 *
 * useRoomVoice와 useVoiceChatMessageHandler 모두 이 필드들을 사용합니다.
 * 공통 필드를 인터페이스로 추출하여 중복을 제거합니다.
 */
export interface VoiceChatUserContext {
  /** 현재 방 ID */
  currentRoomId: string;

  /** 현재 사용자 ID */
  userId: string;

  /** 현재 사용자 이름 */
  userName: string;

  /** 현재 사용자 프로필 이미지 */
  userImageUrl?: string;

  /** 방 참여 완료 여부 */
  isJoined: boolean;
}

/**
 * useVoiceChatMessageHandler 훅 파라미터
 *
 * 시그널링 메시지를 수신하여 WebRTC 연결을 관리하는 훅의 의존성입니다.
 * VoiceChatUserContext를 extends하여 공통 필드를 재사용합니다.
 */
export interface UseVoiceChatMessageHandlerParams extends VoiceChatUserContext {
  /** VoiceChat WebSocket 인스턴스 (시그널링용 STOMP) */
  voiceChatWebSocket: UseVoiceChatWebSocketReturn;

  /** WebRTC 인스턴스 (실제 음성 P2P 연결) */
  webRTC: UseWebRTCReturn;

  /** 참여자 추가 함수 */
  addParticipant: (
    participantId: string,
    participantName: string,
    imageUrl?: string,
    micOn?: boolean,
  ) => void;

  /** 참여자 제거 함수 */
  removeParticipant: (participantId: string) => void;

  /** 참여자 마이크 상태 업데이트 함수 */
  updateParticipantMicStatus: (participantId: string, micOn: boolean) => void;
}

/**
 * useRoomVoice 훅 파라미터
 *
 * 음성 채팅의 진입점 훅에 필요한 의존성입니다.
 * VoiceChatUserContext를 extends하여 공통 필드를 재사용합니다.
 */
export interface UseRoomVoiceParams extends VoiceChatUserContext {
  /** 참여자 목록 상태 업데이트 함수 */
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
}

/**
 * useRoomVoice 훅 반환 타입
 *
 * 음성 채팅 관련 기능을 하나로 묶은 통합 훅의 반환 타입입니다.
 */
export interface UseRoomVoiceReturn {
  /** WebSocket(STOMP) 연결 상태 */
  isWebSocketConnected: boolean;

  /** 내 마이크 켜짐 여부 */
  isMicOn: boolean;

  /** 마이크 on/off 토글 핸들러 */
  handleToggleMic: () => Promise<void>;

  /** 특정 피어 오디오 음소거 토글 */
  togglePeerMute: (peerId: string) => void;

  /** 특정 피어 음소거 상태 확인 */
  isPeerMuted: (peerId: string) => boolean;

  /** WebRTC 인스턴스 */
  webRTC: UseWebRTCReturn;

  /** 음성 채팅 WebSocket 인스턴스 (시그널링용) */
  voiceChatWebSocket: UseVoiceChatWebSocketReturn;
}

/**
 * 마이크 아이콘 컴포넌트 Props
 */
export interface MicIconProps {
  /** 마이크 켜짐 여부 */
  on: boolean;

  /** 피어가 로컬에서 음소거된 상태인지 */
  isPeerMuted?: boolean;
}

/**
 * 아바타 컴포넌트 Props
 */
export interface AvatarProps {
  /** 사용자 이름 (이미지 없을 때 이니셜 표시에 사용) */
  name: string;

  /** 프로필 이미지 URL */
  imageUrl?: string;
}

/**
 * 개별 참여자 행 컴포넌트 Props
 *
 * 음성 채팅 참여자 목록에서 한 명의 참여자를 표시하는 행입니다.
 */
export interface ParticipantRowProps {
  /** 참여자 사용자 ID */
  id?: string;

  /** 참여자 이름 */
  name: string;

  /** 프로필 이미지 URL */
  imageUrl?: string;

  /** 마이크 켜짐 여부 */
  micOn: boolean;

  /** 현재 발화 중 여부 (발화 중이면 글로우 효과) */
  isSpeaking: boolean;

  /** 자기 자신인지 여부 */
  isMe?: boolean;

  /** 로컬에서 음소거한 상태인지 */
  isRemoteMuted?: boolean;

  /** 클릭 시 음소거 토글 핸들러 */
  onToggle: () => void;
}

/**
 * VoiceChat 컴포넌트 Props
 *
 * 음성 채팅 전체 UI 컴포넌트입니다.
 * 참여자 목록, 마이크 토글, 음소거 기능을 제공합니다.
 */
export interface VoiceChatProps {
  /** 참여자 목록 */
  participants: Participant[];

  /** 현재 로그인한 사용자 ID (내 행을 구분하기 위해) */
  myUserId: string;

  /** 마이크 토글 핸들러 */
  onToggleMic: () => void;

  /** 특정 피어 음소거 토글 핸들러 */
  onTogglePeerMute: (peerId: string) => void;

  /** 피어 음소거 상태 확인 함수 */
  isPeerMuted: (peerId: string) => boolean;

  /** WebSocket 연결 상태 */
  isWebSocketConnected: boolean;
}
