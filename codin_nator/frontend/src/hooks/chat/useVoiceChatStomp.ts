import { useEffect, useCallback, useRef } from "react";
import { useStompClient } from "./useStompClient";
import { useParticipantStore } from "@/stores/participantStore";
import {
  createJoinMessage,
  createOfferMessage,
  createAnswerMessage,
  createIceMessage,
  createLeaveMessage,
  extractUserInfoFromJoin,
  isOfferMessage,
  isAnswerMessage,
  isIceMessage,
  isJoinMessage,
  isLeaveMessage,
  isPeerListMessage,
} from "@/utils/chat/signalingAdapter";
import type {
  BackendSignalingMessage,
  UserInfo,
  PeerListData,
} from "@/types/chat/backendDto";
import type { UseVoiceChatStompReturn } from "@/types/chat/voicetypes";

/**
 * 음성 채팅 STOMP 훅
 *
 * 역할:
 * - WebRTC 시그널링 메시지를 STOMP를 통해 송수신
 * - JOIN, OFFER, ANSWER, ICE, LEAVE 메시지 처리
 * - 참여자 정보 관리 (participantStore와 연동)
 *
 * WebRTC 연결 흐름:
 * 1. JOIN 메시지 전송 (사용자 정보 포함)
 * 2. PEER_LIST 수신 (기존 참여자 목록)
 * 3. 각 참여자와 Offer/Answer 교환
 * 4. ICE Candidate 교환
 * 5. P2P 연결 완료
 *
 * @param roomId - 채팅방 ID
 * @param userId - 현재 사용자 ID
 * @param userName - 현재 사용자 이름
 * @param imageUrl - 현재 사용자 이미지 URL
 */
export function useVoiceChatStomp(
  roomId: string,
  userId: string,
  userName: string,
  imageUrl?: string,
): UseVoiceChatStompReturn {
  // 콜백 저장 (외부에서 등록)
  const onJoinCallbackRef = useRef<
    ((userId: string, userInfo: UserInfo) => void) | null
  >(null);
  const onOfferCallbackRef = useRef<
    ((peerId: string, sdp: RTCSessionDescriptionInit) => void) | null
  >(null);
  const onAnswerCallbackRef = useRef<
    ((peerId: string, sdp: RTCSessionDescriptionInit) => void) | null
  >(null);
  const onIceCallbackRef = useRef<
    ((peerId: string, candidate: RTCIceCandidateInit) => void) | null
  >(null);
  const onPeerListCallbackRef = useRef<((userIds: string[]) => void) | null>(
    null,
  );
  const onLeaveCallbackRef = useRef<((userId: string) => void) | null>(null);

  const hasJoinedRef = useRef(false);

  // 참여자 스토어
  const { addParticipant, removeParticipant } = useParticipantStore();

  // WebSocket URL 설정 (개발/프로덕션 자동 감지)
  // SockJS는 HTTP/HTTPS URL을 사용 (자동으로 WebSocket으로 업그레이드)
  const voiceWsUrl = import.meta.env.DEV
    ? "/ws-voice" // 개발: Vite 프록시 사용
    : "https://i14e205.p.ssafy.io/ws-voice"; // 프로덕션: 백엔드 직접 연결

  // STOMP 클라이언트
  const stomp = useStompClient({
    brokerURL: voiceWsUrl,
    debug: import.meta.env.DEV,
    reconnectDelay: 0, // 재연결 비활성화 (디버깅용)
  });

  /**
   * JOIN 메시지 전송 (방 입장)
   */
  const sendJoin = useCallback(() => {
    if (!stomp.isConnected) {
      console.warn("[VoiceChatStomp] ⚠️ 연결되지 않음 - JOIN 불가");
      return;
    }

    const joinMessage = createJoinMessage(userId, userName, imageUrl, roomId);
    stomp.publish("/pub/voice/message", joinMessage);

    // 내 정보도 스토어에 추가
    addParticipant({ userId, userName, imageUrl });
  }, [stomp, userId, userName, imageUrl, roomId, addParticipant]);

  /**
   * OFFER 메시지 전송
   */
  const sendOffer = useCallback(
    (peerId: string, sdp: RTCSessionDescriptionInit) => {
      if (!stomp.isConnected) {
        console.warn("[VoiceChatStomp] ⚠️ 연결되지 않음 - OFFER 전송 불가");
        return;
      }

      const offerMessage = createOfferMessage(userId, peerId, roomId, sdp);
      stomp.publish("/pub/voice/message", offerMessage);
    },
    [stomp, userId, roomId],
  );

  /**
   * ANSWER 메시지 전송
   */
  const sendAnswer = useCallback(
    (peerId: string, sdp: RTCSessionDescriptionInit) => {
      if (!stomp.isConnected) {
        console.warn("[VoiceChatStomp] ⚠️ 연결되지 않음 - ANSWER 전송 불가");
        return;
      }

      const answerMessage = createAnswerMessage(userId, peerId, roomId, sdp);
      stomp.publish("/pub/voice/message", answerMessage);
    },
    [stomp, userId, roomId],
  );

  /**
   * ICE Candidate 메시지 전송
   */
  const sendIce = useCallback(
    (peerId: string, candidate: RTCIceCandidateInit) => {
      if (!stomp.isConnected) {
        console.warn("[VoiceChatStomp] ⚠️ 연결되지 않음 - ICE 전송 불가");
        return;
      }

      const iceMessage = createIceMessage(userId, peerId, roomId, candidate);
      stomp.publish("/pub/voice/message", iceMessage);
    },
    [stomp, userId, roomId],
  );

  /**
   * LEAVE 메시지 전송 (방 퇴장)
   */
  const sendLeave = useCallback(() => {
    if (!stomp.isConnected) {
      console.warn("[VoiceChatStomp] ⚠️ 연결되지 않음 - LEAVE 불가");
      return;
    }

    const leaveMessage = createLeaveMessage(userId, roomId);
    stomp.publish("/pub/voice/message", leaveMessage);
  }, [stomp, userId, roomId]);

  /**
   * 콜백 등록 함수들
   */
  const onJoin = useCallback(
    (callback: (userId: string, userInfo: UserInfo) => void) => {
      onJoinCallbackRef.current = callback;
    },
    [],
  );

  const onOffer = useCallback(
    (callback: (peerId: string, sdp: RTCSessionDescriptionInit) => void) => {
      onOfferCallbackRef.current = callback;
    },
    [],
  );

  const onAnswer = useCallback(
    (callback: (peerId: string, sdp: RTCSessionDescriptionInit) => void) => {
      onAnswerCallbackRef.current = callback;
    },
    [],
  );

  const onIce = useCallback(
    (callback: (peerId: string, candidate: RTCIceCandidateInit) => void) => {
      onIceCallbackRef.current = callback;
    },
    [],
  );

  const onPeerList = useCallback((callback: (userIds: string[]) => void) => {
    onPeerListCallbackRef.current = callback;
  }, []);

  const onLeave = useCallback((callback: (userId: string) => void) => {
    onLeaveCallbackRef.current = callback;
  }, []);

  // STOMP 연결
  useEffect(() => {
    console.log("[VoiceChatStomp] 🔌 연결 시작:", voiceWsUrl);
    stomp.connect();

    return () => {
      console.log("[VoiceChatStomp] 🔌 연결 해제");
      stomp.disconnect();
      hasJoinedRef.current = false;
    };
  }, [voiceWsUrl, stomp]);

  // 시그널링 메시지 구독
  useEffect(() => {
    if (!stomp.isConnected || !roomId) {
      return;
    }

    const destination = `/sub/voice/room/${roomId}`;
    console.log("[VoiceChatStomp] 📬 구독 시작:", destination);

    const subscription = stomp.subscribe<BackendSignalingMessage>(
      destination,
      (message) => {
        // 메시지 타입별 처리
        if (isJoinMessage(message)) {
          const userInfo = extractUserInfoFromJoin(message);
          if (userInfo && message.senderId !== userId) {
            // 다른 사용자의 JOIN (내 것은 무시)
            addParticipant(userInfo);
            onJoinCallbackRef.current?.(message.senderId, userInfo);
          }
        } else if (isPeerListMessage(message)) {
          const peerIds = message.data as PeerListData;
          console.log("[VoiceChatStomp] 📋 PEER_LIST 수신:", peerIds);
          onPeerListCallbackRef.current?.(peerIds);
        } else if (isOfferMessage(message)) {
          if (message.receiverId === userId) {
            // 나에게 온 OFFER
            const sdp = message.data as RTCSessionDescriptionInit;
            onOfferCallbackRef.current?.(message.senderId, sdp);
          }
        } else if (isAnswerMessage(message)) {
          if (message.receiverId === userId) {
            // 나에게 온 ANSWER
            const sdp = message.data as RTCSessionDescriptionInit;
            onAnswerCallbackRef.current?.(message.senderId, sdp);
          }
        } else if (isIceMessage(message)) {
          if (message.receiverId === userId) {
            // 나에게 온 ICE
            const candidate = message.data as RTCIceCandidateInit;
            onIceCallbackRef.current?.(message.senderId, candidate);
          }
        } else if (isLeaveMessage(message)) {
          removeParticipant(message.senderId);
          onLeaveCallbackRef.current?.(message.senderId);
        }
      },
    );

    // 구독 성공 후 JOIN 메시지 전송 (한 번만)
    if (!hasJoinedRef.current) {
      setTimeout(() => {
        sendJoin();
        hasJoinedRef.current = true;
      }, 300);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [stomp, roomId, userId, addParticipant, removeParticipant, sendJoin]);

  return {
    isConnected: stomp.isConnected,
    sendJoin,
    sendOffer,
    sendAnswer,
    sendIce,
    sendLeave,
    onJoin,
    onOffer,
    onAnswer,
    onIce,
    onPeerList,
    onLeave,
  };
}
