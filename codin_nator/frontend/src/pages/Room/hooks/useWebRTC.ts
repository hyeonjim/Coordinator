/**
 * useWebRTC Hook
 * WebRTC P2P 연결을 관리하는 커스텀 훅
 * WebRTC 연결 과정:
 * 1. 로컬 미디어 스트림 획득 (getUserMedia)
 * 2. RTCPeerConnection 생성
 * 3. Offer/Answer 교환 (SDP - Session Description Protocol)
 * 4. ICE Candidate 교환 (네트워크 경로 탐색)
 * 5. 연결 완료 후 실시간 음성 통신
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseWebRTCReturn } from "@/types/chat/webrtc";

/**
 *   STUN 서버:
 * - NAT(네트워크 주소 변환) 뒤에 있는 클라이언트의 공인 IP를 찾아줌
 * - Google이 무료로 제공하는 STUN 서버 사용
 */
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// 음성 감지 설정
const SPEAKING_THRESHOLD = 25; // 이 값 이상이면 말하는 중으로 판단
const SPEAKING_HOLD_MS = 300; // 말이 끝나도 이 시간 동안 유지

/**
 * WebRTC P2P 연결 관리 훅
 *
 * @returns WebRTC 관련 상태와 제어 함수들
 */
export function useWebRTC(): UseWebRTCReturn {
  // 상태 및 ref 정의

  // 로컬 미디어 스트림 (내 마이크 입력)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 마이크 상태
  const [isMicOn, setIsMicOn] = useState(true);
  const isMicOnRef = useRef(isMicOn);

  // 로컬 사용자 음성 감지 상태
  const [isSpeaking, setIsSpeaking] = useState(false);

  // isMicOn 상태와 ref 동기화
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  /**
   *   Map을 사용하는 이유:
   * - 여러 피어(참여자)와 동시에 연결을 유지해야 함
   * - 각 피어마다 별도의 RTCPeerConnection 필요
   */
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 음소거 유저 실시간 연동을 위한 상태 (Set 사용)
  const [mutedPeers, setMutedPeers] = useState<Set<string>>(new Set());

  // 음성 감지용 ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingTimerRef = useRef<number | null>(null);

  // 원격 피어 음성 감지 상태
  const peerSpeakingRef = useRef<Map<string, boolean>>(new Map());
  const peerAnalysersRef = useRef<
    Map<string, { ctx: AudioContext; timer: number }>
  >(new Map());

  // --- 내부 헬퍼 함수 정의 (사용 전에 선언되어야 함) ---

  /**
   * Web Audio API를 사용하여 음성 감지를 설정합니다.
   * Web Audio API 흐름:
   * MediaStream → MediaStreamSource → Analyser → 주파수 데이터 분석
   */
  const setupSpeakingDetection = useCallback((stream: MediaStream) => {
    // 기존 컨텍스트가 있다면 정리
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // AudioContext 생성 (Web Audio API의 핵심)
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    // 분석기 생성
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024; // FFT(고속 푸리에 변환) 크기
    analyserRef.current = analyser;

    // 스트림을 분석기에 연결
    try {
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (err) {
      console.error("MediaStreamSource 생성 실패:", err);
      return;
    }

    // 주기적으로 음량 체크
    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastSpokeAt = 0;

    // 기존 타이머 제거
    if (speakingTimerRef.current) {
      window.clearInterval(speakingTimerRef.current);
    }

    speakingTimerRef.current = window.setInterval(() => {
      // 분석기가 유효한지 확인
      if (!analyserRef.current) return;

      analyser.getByteFrequencyData(data);

      // 평균 음량 계산
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;

      const now = Date.now();
      const speakingNow = avg > SPEAKING_THRESHOLD;

      if (speakingNow) lastSpokeAt = now;

      // 말이 끝나도 잠시 유지 (깜빡임 방지)
      setIsSpeaking(speakingNow || now - lastSpokeAt < SPEAKING_HOLD_MS);
    }, 100);
  }, []);

  const setupRemoteSpeakingDetection = useCallback(
    (peerId: string, stream: MediaStream) => {
      if (peerAnalysersRef.current.has(peerId)) return;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastSpokeAt = 0;

      const timer = window.setInterval(() => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;

        const now = Date.now();
        const speakingNow = avg > SPEAKING_THRESHOLD;
        if (speakingNow) lastSpokeAt = now;

        peerSpeakingRef.current.set(
          peerId,
          speakingNow || now - lastSpokeAt < SPEAKING_HOLD_MS,
        );
      }, 100);

      peerAnalysersRef.current.set(peerId, { ctx, timer });
    },
    [],
  );

  // --- 외부 노출 함수 정의 ---

  /**
   *   마이크 권한을 요청하고 로컬 오디오 스트림을 시작합니다.
   *   getUserMedia API:
   * - 사용자의 카메라/마이크에 접근하는 API
   * - 사용자 동의가 필요 (브라우저가 권한 요청 팝업 표시)
   */
  const startAudio = useCallback(async () => {
    // 이미 스트림이 있으면 재사용
    if (localStreamRef.current) return;

    try {
      // 마이크 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true, // 에코 제거
          noiseSuppression: true, // 노이즈 제거
          autoGainControl: true, // 자동 볼륨 조절
        },
        video: false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // 음성 감지 시작
      setupSpeakingDetection(stream);
    } catch (error) {
      console.error("마이크 권한 요청 실패:", error);
      throw error;
    }
  }, [setupSpeakingDetection]);

  const stopAudio = useCallback(() => {
    // 타이머 정리
    if (speakingTimerRef.current) {
      window.clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }

    // AudioContext 정리
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;

    // 스트림 정리
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsSpeaking(false);
  }, []);

  const toggleMic = useCallback(async () => {
    const newState = !isMicOnRef.current;  // ref 사용으로 stale closure 문제 해결

    if (newState) {
      // 마이크 켜기: 새로운 스트림 획득
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicOn(true);

        // 음성 감지 다시 시작 (중요: 새 스트림으로 재설정)
        setupSpeakingDetection(stream);

        // 기존 연결된 모든 피어에게 새 트랙 전달
        const newTrack = stream.getAudioTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
          if (sender) {
            sender.replaceTrack(newTrack);
          } else {
            // 보낸 트랙이 없으면 추가
            pc.addTrack(newTrack, stream);
          }
        });
      } catch (error) {
        console.error("마이크 다시 켜기 실패:", error);
      }
    } else {
      //  마이크 끄기: 트랙 중지
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = null;
      setLocalStream(null);
      setIsMicOn(false);
      setIsSpeaking(false);

      // 타이머 및 AudioContext 정리
      if (speakingTimerRef.current) {
        window.clearInterval(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    }
  }, [setupSpeakingDetection]);  // isMicOn 제거로 dependency 최적화

  /**
   * 특정 피어와의 RTCPeerConnection을 생성하거나 기존 것을 반환합니다.
   */
  const getOrCreatePeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      // 기존 연결이 있으면 반환
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      // 새 RTCPeerConnection 생성
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // 로컬 스트림의 트랙들을 연결에 추가
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // 원격 트랙 수신 시 처리
      pc.ontrack = (event) => {
        let remoteStream = remoteStreamsRef.current.get(peerId);
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamsRef.current.set(peerId, remoteStream);
        }
        remoteStream.addTrack(event.track);

        // 오디오 재생을 위한 엘리먼트 생성
        let audioEl = audioElementsRef.current.get(peerId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioElementsRef.current.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;

        // 원격 피어 음성 감지 설정
        setupRemoteSpeakingDetection(peerId, remoteStream);
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [setupRemoteSpeakingDetection],
  );

  /**
   * Offer 생성 (연결 제안)
   */
  const createOffer = useCallback(
    async (peerId: string): Promise<RTCSessionDescriptionInit | null> => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        return offer;
      } catch (error) {
        console.error("Offer 생성 실패:", error);
        return null;
      }
    },
    [getOrCreatePeerConnection],
  );

  /**
   * Offer 수신 및 Answer 생성
   */
  const handleOffer = useCallback(
    async (
      peerId: string,
      sdp: RTCSessionDescriptionInit,
    ): Promise<RTCSessionDescriptionInit | null> => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        return answer;
      } catch (error) {
        console.error("Offer 처리 실패:", error);
        return null;
      }
    },
    [getOrCreatePeerConnection],
  );

  /**
   * Answer 수신
   */
  const handleAnswer = useCallback(
    async (peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> => {
      try {
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (error) {
        console.error("Answer 처리 실패:", error);
      }
    },
    [],
  );

  /**
   * ICE Candidate 수신
   */
  const handleIce = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit) => {
      try {
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("ICE Candidate 처리 실패:", error);
      }
    },
    [],
  );

  const removePeer = useCallback((peerId: string) => {
    // PeerConnection 정리
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }

    // 오디오 엘리먼트 정리
    const audioEl = audioElementsRef.current.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioElementsRef.current.delete(peerId);
    }

    // 스트림 정리
    remoteStreamsRef.current.delete(peerId);

    // 음성 감지 정리
    const analyserData = peerAnalysersRef.current.get(peerId);
    if (analyserData) {
      window.clearInterval(analyserData.timer);
      analyserData.ctx.close();
      peerAnalysersRef.current.delete(peerId);
    }
    peerSpeakingRef.current.delete(peerId);
  }, []);

  const getPeerSpeaking = useCallback((peerId: string): boolean => {
    return peerSpeakingRef.current.get(peerId) ?? false;
  }, []);

  const simulateIncomingAudio = useCallback((peerId: string) => {
    // 1. AudioContext 생성
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();

    // 2. 소리 생성 (Oscillator)
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);

    // 3. 볼륨 조절 (Gain)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

    // 4. MediaStreamDestination 생성
    const destination = ctx.createMediaStreamDestination();

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 2);

    const stream = destination.stream;

    let audioEl = audioElementsRef.current.get(peerId);
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElementsRef.current.set(peerId, audioEl);
      document.body.appendChild(audioEl);
    }
    audioEl.srcObject = stream;

    peerSpeakingRef.current.set(peerId, true);
    setTimeout(() => {
      peerSpeakingRef.current.set(peerId, false);
      oscillator.disconnect();
      gainNode.disconnect();
      ctx.close();
      if (document.body.contains(audioEl!)) {
        document.body.removeChild(audioEl!);
      }
    }, 2000);
  }, []);

  const togglePeerMute = useCallback((peerId: string) => {
    setMutedPeers((prev) => {
      const next = new Set(prev);
      const isMuted = next.has(peerId);

      if (isMuted) {
        next.delete(peerId);
      } else {
        next.add(peerId);
      }

      const audioEl = audioElementsRef.current.get(peerId);
      if (audioEl) {
        audioEl.muted = !isMuted;
      }

      return next;
    });
  }, []);

  const isPeerMuted = useCallback(
    (peerId: string) => {
      return mutedPeers.has(peerId);
    },
    [mutedPeers],
  );

  return useMemo(
    () => ({
      localStream,
      isMicOn,
      isSpeaking,
      toggleMic,
      startAudio,
      stopAudio,
      createOffer,
      handleOffer,
      handleAnswer,
      handleIce,
      removePeer,
      getPeerSpeaking,
      simulateIncomingAudio,
      togglePeerMute,
      isPeerMuted,
    }),
    [
      localStream,
      isMicOn,
      isSpeaking,
      toggleMic,
      startAudio,
      stopAudio,
      createOffer,
      handleOffer,
      handleAnswer,
      handleIce,
      removePeer,
      getPeerSpeaking,
      simulateIncomingAudio,
      togglePeerMute,
      isPeerMuted,
    ],
  );
}
