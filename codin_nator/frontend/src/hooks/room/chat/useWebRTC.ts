/**
 * useWebRTC.ts - WebRTC P2P 음성 통신 연결 관리 훅
 *
 * [WebRTC (Web Real-Time Communication) 란?]
 * - 브라우저 간 플러그인 없이 직접(P2P) 음성/영상/데이터를 주고받는 웹 표준 기술입니다.
 * - 서버를 거치지 않고 브라우저끼리 직접 연결되므로 지연(latency)이 매우 낮습니다.
 * - 단, 연결을 "협상"하는 과정(시그널링)에서는 서버(STOMP WebSocket)가 필요합니다.
 *
 * [WebRTC P2P 연결 흐름]
 * 1. 사용자 A가 방에 입장 → JOIN 시그널 전송
 * 2. 기존 참여자 B가 JOIN을 받음 → RTCPeerConnection 생성
 * 3. B가 Offer(제안) 생성 → SDP(Session Description Protocol) 포함
 *    - SDP: 미디어 코덱, 해상도, 네트워크 정보 등을 담은 텍스트 프로토콜
 * 4. A가 Offer를 받음 → Answer(응답) 생성
 * 5. 양쪽이 ICE Candidate(네트워크 경로) 교환
 *    - 각 브라우저가 사용 가능한 모든 네트워크 경로를 상대방에게 알려줌
 * 6. P2P 연결 수립 → 미디어 스트림(오디오) 직접 전송
 *
 * [ICE (Interactive Connectivity Establishment)]
 * - NAT/방화벽 뒤에 있는 기기 간 연결을 위한 프레임워크
 * - STUN 서버: 자신의 공개 IP 주소를 탐색 (집 주소를 알아내는 것과 비슷)
 * - TURN 서버: P2P 직접 연결이 불가능할 때 릴레이(중계) 서버로 우회
 * - ICE Candidate: 연결 가능한 네트워크 경로 후보 (IP + 포트 조합)
 *
 * [이 훅의 역할]
 * - RTCPeerConnection 생성/관리 (여러 피어와 1:N 연결)
 * - Offer/Answer/ICE Candidate 처리
 * - 로컬 마이크 스트림 획득 및 제어
 * - Web Audio API를 이용한 음성 감지 (말하는 중인지 판단)
 *
 * [흐름도]
 * getUserMedia(마이크) → RTCPeerConnection 생성 → Offer/Answer 교환
 * → ICE Candidate 교환 → P2P 연결 수립 → ontrack으로 원격 오디오 수신
 */

/**
 * [React 훅 import 설명]
 * - useCallback: 함수를 메모이제이션하여 불필요한 재생성 방지 (의존성이 바뀔 때만 새로 생성)
 * - useEffect: 컴포넌트 렌더링 후 부수 효과(side effect) 실행 (API 호출, 이벤트 리스너 등록 등)
 * - useMemo: 계산 결과를 메모이제이션하여 불필요한 재계산 방지
 * - useRef: 리렌더링 사이에도 값이 유지되는 변경 가능한 참조 객체 (.current로 접근)
 *           DOM 요소 참조 또는 렌더링에 영향을 주지 않는 값 저장에 사용
 * - useState: 컴포넌트의 상태 값과 그 값을 갱신하는 함수를 반환 (상태 변경 시 리렌더링 발생)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseWebRTCReturn } from "@/types/voice";

/**
 * [RTCConfiguration - WebRTC 연결 설정]
 *
 * STUN 서버 (Session Traversal Utilities for NAT):
 * - NAT(네트워크 주소 변환) 뒤에 있는 클라이언트의 공인 IP를 찾아줌
 * - 비유: "내 집 주소를 우체국에 물어보는 것" (내부 네트워크 IP가 아닌 외부 공인 IP를 알아냄)
 * - Google이 무료로 제공하는 STUN 서버 사용
 *
 * 왜 필요한가?
 * - 대부분의 사용자는 공유기(라우터) 뒤에 있어서 직접 연결이 안 됨
 * - STUN으로 공인 IP를 알아내야 상대방이 나를 찾을 수 있음
 * - STUN만으로 부족하면 TURN 서버(릴레이)를 추가로 설정할 수 있음
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
 * @param onIceCandidate - ICE candidate 발생 시 호출될 콜백
 * @returns WebRTC 관련 상태와 제어 함수들
 */
export function useWebRTC(
  onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void,
): UseWebRTCReturn {
  // ─── 상태(state) 및 ref 정의 ─────────────────────────────────────────────
  //
  // [useState vs useRef 사용 기준]
  // - useState: 값이 바뀌면 UI가 다시 그려져야 할 때 (예: 마이크 on/off 아이콘)
  // - useRef: 값이 바뀌어도 UI 리렌더링이 필요 없을 때 (예: PeerConnection 객체 저장)
  //   → ref는 .current 속성으로 값에 접근하며, 변경해도 리렌더링이 발생하지 않음

  /**
   * 로컬 미디어 스트림 (내 마이크 입력)
   * - MediaStream: 오디오/비디오 트랙의 모음 객체
   * - useState로 관리: UI에서 스트림 존재 여부에 따라 표시가 달라짐
   * - useRef로도 저장: useCallback 내부에서 최신 값 참조 (stale closure 방지)
   */
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 마이크 상태
  const [isMicOn, setIsMicOn] = useState(true);
  const isMicOnRef = useRef(isMicOn);

  // 로컬 사용자 음성 감지 상태
  const [isSpeaking, setIsSpeaking] = useState(false);

  /**
   * isMicOn 상태와 ref 동기화
   *
   * [useEffect란?]
   * - 컴포넌트가 렌더링된 "후"에 실행되는 부수 효과(side effect) 함수
   * - 두 번째 인자(의존성 배열)의 값이 바뀔 때마다 다시 실행됨
   * - [isMicOn] → isMicOn이 바뀔 때마다 ref.current를 최신 값으로 갱신
   *
   * [왜 ref와 동기화하는가?]
   * - useCallback으로 감싼 함수 내부에서는 생성 시점의 state 값만 볼 수 있음 (클로저)
   * - ref를 사용하면 항상 최신 값을 참조할 수 있어 "stale closure" 문제 해결
   */
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  /**
   * [피어별 연결 관리 - Map 자료구조 사용]
   *
   * WebRTC는 1:1 연결이므로, N명의 참여자와 통화하려면 N개의 RTCPeerConnection이 필요합니다.
   * Map<피어ID, 연결객체> 형태로 각 참여자별 연결을 관리합니다.
   *
   * - peerConnectionsRef: 각 피어와의 RTCPeerConnection (P2P 연결 핵심 객체)
   * - remoteStreamsRef: 각 피어로부터 수신한 오디오 MediaStream
   * - audioElementsRef: 수신한 오디오를 재생하기 위한 <audio> HTML 엘리먼트
   *   → 브라우저에서 오디오를 재생하려면 HTMLAudioElement가 필요함
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
   * [Web Audio API를 사용한 음성 감지(Voice Activity Detection)]
   *
   * Web Audio API 흐름:
   * MediaStream(마이크) → MediaStreamSource(입력 노드) → AnalyserNode(분석 노드) → 주파수 데이터 분석
   *
   * [useCallback이란?]
   * - 함수를 메모이제이션(캐싱)하는 React 훅
   * - 의존성 배열 []이 비어있으면 컴포넌트 생애 동안 동일한 함수 참조를 유지
   * - 이 함수를 다른 useCallback/useEffect의 의존성으로 사용할 때 불필요한 재실행을 방지
   */
  const setupSpeakingDetection = useCallback((stream: MediaStream) => {
    // 기존 컨텍스트가 있다면 정리
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    /**
     * AudioContext: Web Audio API의 중앙 제어 객체
     * - 모든 오디오 노드(소스, 필터, 분석기 등)의 생성과 연결을 관리
     * - webkitAudioContext는 구형 Safari를 위한 폴백
     */
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    /**
     * AnalyserNode: 오디오 신호를 주파수/시간 도메인으로 분석하는 노드
     * - fftSize: FFT(고속 푸리에 변환) 크기. 클수록 정밀하지만 느림
     * - frequencyBinCount = fftSize / 2 = 512개의 주파수 대역 데이터를 제공
     */
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;

    // 스트림을 분석기에 연결
    try {
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch {
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

  /**
   * 원격 피어(상대방)의 음성 감지 설정
   * - 로컬 음성 감지와 동일한 원리이지만, 상대방의 오디오 스트림을 분석
   * - 각 피어별로 별도의 AudioContext와 타이머를 관리
   */
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
    const newState = !isMicOnRef.current; // ref 사용으로 stale closure 문제 해결

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
      } catch {
        // 마이크 다시 켜기 실패 시 무시
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
  }, [setupSpeakingDetection]); // isMicOn 제거로 dependency 최적화

  /**
   * [RTCPeerConnection 생성 또는 재사용]
   *
   * RTCPeerConnection은 WebRTC의 핵심 객체로, 하나의 P2P 연결을 나타냅니다.
   * 이 함수는 "게으른 초기화(lazy initialization)" 패턴을 사용합니다:
   * - 이미 해당 피어와 연결이 있으면 기존 것을 재사용
   * - 없으면 새로 생성하고 이벤트 핸들러를 등록
   *
   * [RTCPeerConnection의 주요 이벤트]
   * - onicecandidate: 새로운 ICE 후보가 발견될 때 (상대에게 전달해야 함)
   * - ontrack: 상대방의 미디어 트랙(오디오)을 수신했을 때
   */
  const getOrCreatePeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      // 기존 연결이 있으면 반환 (중복 생성 방지)
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      // 새 RTCPeerConnection 생성 (STUN 서버 설정 포함)
      const pc = new RTCPeerConnection(RTC_CONFIG);

      /**
       * 로컬 스트림의 오디오 트랙을 연결에 추가
       * - addTrack(track, stream): 내 마이크 오디오를 상대방에게 전송하기 위해 등록
       * - 이 시점에서 상대방의 ontrack 이벤트가 발생하게 됨
       */
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      /**
       * ICE candidate 발생 시 처리
       * - 브라우저가 사용 가능한 네트워크 경로를 발견할 때마다 호출됨
       * - 발견된 candidate를 STOMP를 통해 상대방에게 전달해야 함
       */
      pc.onicecandidate = (event) => {
        if (event.candidate && onIceCandidate) {
          onIceCandidate(peerId, event.candidate);
        }
      };

      /**
       * 원격 트랙 수신 시 처리
       * - 상대방이 addTrack으로 보낸 오디오 트랙이 여기서 수신됨
       * - MediaStream에 트랙을 추가하고, <audio> 엘리먼트로 재생
       */
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
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
          audioElementsRef.current.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;

        // 원격 피어 음성 감지 설정
        setupRemoteSpeakingDetection(peerId, remoteStream);
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [setupRemoteSpeakingDetection, onIceCandidate],
  );

  /**
   * [Offer 생성 - WebRTC 시그널링 1단계]
   *
   * Offer는 "나와 P2P 연결하자"는 제안서입니다.
   * - createOffer(): SDP(Session Description Protocol) 형태의 제안 생성
   *   → SDP에는 지원하는 코덱, 네트워크 정보, 미디어 타입 등이 포함됨
   * - setLocalDescription(): 생성한 Offer를 자신의 연결에 설정
   *   → 이 시점부터 ICE candidate 수집이 시작됨
   *
   * [async/await란?]
   * - 비동기(asynchronous) 작업을 동기적으로 보이게 작성하는 문법
   * - await: Promise가 완료될 때까지 기다림 (코드 실행이 일시 중지되는 것처럼 보임)
   * - try/catch: await 중 에러 발생 시 catch 블록에서 처리
   *
   * [Promise란?]
   * - 비동기 작업의 완료/실패를 나타내는 객체
   * - 여기서 createOffer()는 SDP 생성이 완료될 때 resolve되는 Promise를 반환
   */
  const createOffer = useCallback(
    async (peerId: string): Promise<RTCSessionDescriptionInit | null> => {
      try {
        const pc = getOrCreatePeerConnection(peerId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,  // 오디오 수신 허용
          offerToReceiveVideo: false, // 비디오는 사용하지 않음
        });
        await pc.setLocalDescription(offer); // 로컬에 Offer 설정
        return offer;
      } catch {
        return null;
      }
    },
    [getOrCreatePeerConnection],
  );

  /**
   * [Offer 수신 및 Answer 생성 - WebRTC 시그널링 2단계]
   *
   * 상대방이 보낸 Offer를 받아서 Answer(응답)를 생성합니다.
   * 1. setRemoteDescription(): 상대방의 SDP를 원격 설명으로 설정
   * 2. createAnswer(): 상대방의 제안에 맞는 응답 SDP 생성
   * 3. setLocalDescription(): 생성한 Answer를 로컬에 설정
   *
   * 이 단계가 완료되면 양쪽 모두 상대방의 미디어 능력을 알게 됩니다.
   * 이후 ICE Candidate 교환이 진행되면 실제 P2P 연결이 수립됩니다.
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
      } catch {
        return null;
      }
    },
    [getOrCreatePeerConnection],
  );

  /**
   * [Answer 수신 - WebRTC 시그널링 3단계]
   *
   * 내가 보낸 Offer에 대한 상대방의 Answer를 수신합니다.
   * - setRemoteDescription(): 상대방의 Answer SDP를 원격 설명으로 설정
   * - 이 시점에서 양쪽의 SDP 교환이 완료됨 (미디어 협상 완료)
   * - ICE Candidate 교환과 병행하여 P2P 연결이 수립됨
   */
  const handleAnswer = useCallback(
    async (peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> => {
      try {
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch {
        // Answer 처리 실패 시 무시
      }
    },
    [],
  );

  /**
   * [ICE Candidate 수신 - WebRTC 시그널링 4단계]
   *
   * 상대방이 발견한 네트워크 경로 후보(ICE Candidate)를 수신하여 연결에 추가합니다.
   * - addIceCandidate(): 상대방의 네트워크 경로를 연결 후보에 추가
   * - 양쪽이 서로의 ICE Candidate를 모두 교환하면 최적의 경로로 P2P 연결 수립
   * - ICE Candidate는 SDP 교환과 병행하여 "점진적(trickle)"으로 교환됨
   */
  const handleIce = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit) => {
      try {
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ICE Candidate 처리 실패 시 무시
      }
    },
    [],
  );

  /**
   * 피어 연결 해제 및 리소스 정리
   * - 참여자가 퇴장하면 해당 피어의 모든 리소스를 해제해야 메모리 누수를 방지할 수 있음
   * - PeerConnection, 오디오 엘리먼트, 스트림, 음성 감지 모두 정리
   */
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
      if (document.body.contains(audioEl)) {
        document.body.removeChild(audioEl);
      }
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

  /**
   * [테스트/디버깅용] 가상 오디오 수신 시뮬레이션
   * - 실제 WebRTC 연결 없이 오디오 수신을 테스트할 때 사용
   * - Oscillator(파형 발생기)로 440Hz(A4 음) 사인파를 생성하여 재생
   */
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

  /**
   * 특정 피어의 오디오를 로컬에서 음소거/해제
   * - 서버나 상대방에게 알리지 않고, 내 쪽에서만 해당 피어의 소리를 끔/켬
   * - HTMLAudioElement.muted 속성을 토글
   */
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

  /**
   * [useMemo로 반환 객체 메모이제이션]
   * - 이 훅의 반환값을 useMemo로 감싸서, 의존성이 바뀌지 않으면 동일한 객체 참조를 유지
   * - 이 훅을 사용하는 부모 컴포넌트의 불필요한 리렌더링을 방지
   */
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
