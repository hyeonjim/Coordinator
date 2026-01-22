import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type SignalMsg =
  | { type: "join"; roomId: string; userId: string }
  | { type: "joined"; roomId: string; userId: string; peers: string[] }
  | { type: "peer-joined"; roomId: string; userId: string }
  | {
      type: "offer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "answer";
      roomId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice";
      roomId: string;
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    }
  | { type: "leave"; roomId: string; userId: string }
  | { type: "peer-left"; roomId: string; userId: string };

type PeerState = {
  userId: string;

  // ✅ UI용
  displayName?: string; // 홍길동
  subtitle?: string; // Main.java
  micOn: boolean;

  // speaking detect
  isSpeaking: boolean;

  // (선택) 리모트 음소거(내 로컬에서만)
  mutedByMe: boolean;
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

function randomId(prefix = "u") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** ---------- UI pieces (tailwind) ---------- */

function MicIcon({ on }: { on: boolean }) {
  if (on) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 5a3 3 0 0 1 6 1v5a3 3 0 0 1-.17 1" />
      <path d="M19 11a7 7 0 0 1-9 6.71" />
      <path d="M5 11a7 7 0 0 0 11.5 5.5" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold">
      {initial}
    </div>
  );
}

type ParticipantRowProps = {
  name: string;
  subtitle?: string;
  micOn: boolean;
  isSpeaking: boolean;
  isMe?: boolean;
  isHost?: boolean;
};

function ParticipantRow({
  name,
  subtitle,
  micOn,
  isSpeaking,
  isMe,
  isHost,
}: ParticipantRowProps) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-xl px-3 py-3",
        "bg-white",
        isSpeaking
          ? "border-2 border-emerald-500"
          : "border border-transparent",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={name} />

        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="truncate text-[15px] font-semibold text-slate-900">
              {name}
              {isHost ? (
                <span className="font-semibold text-slate-900"> (host)</span>
              ) : null}
            </div>
            {isMe ? (
              <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[11px] font-semibold text-slate-600">
                나
              </span>
            ) : null}
          </div>

          {subtitle ? (
            <div className="truncate text-[13px] text-slate-500">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-3">
        <span className={micOn ? "text-emerald-500" : "text-slate-400"}>
          <MicIcon on={micOn} />
        </span>
        <span
          className={[
            "text-[13px] font-semibold",
            micOn ? "text-emerald-600" : "text-slate-400",
          ].join(" ")}
        >
          {micOn ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const userId = useMemo(() => randomId("user"), []);
  const wsUrl = useMemo(() => import.meta.env.VITE_SIGNALING_URL as string, []);
  const safeRoomId = roomId ?? "";

  const wsRef = useRef<WebSocket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const remoteStreamRef = useRef<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const speakingTimerRef = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const [localSpeaking, setLocalSpeaking] = useState(false);

  /** ---------- utils ---------- */
  const send = (msg: SignalMsg) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(msg));
  };

  const upsertPeer = (peerId: string, patch: Partial<PeerState>) => {
    setPeers((prev) => {
      const cur =
        prev[peerId] ??
        ({
          userId: peerId,
          isSpeaking: false,
          mutedByMe: false,
          micOn: true, // ✅ 기본값: 상대는 ON으로 표시 (나중에 서버 신호로 바꾸면 됨)
          displayName: "홍길동", // ✅ 임시
          subtitle: "Main.java", // ✅ 임시
        } satisfies PeerState);

      return { ...prev, [peerId]: { ...cur, ...patch } };
    });
  };

  const removePeer = (peerId: string) => {
    setPeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  };

  /** ---------- local media ---------- */
  const startLocalAudio = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    localStreamRef.current = stream;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    source.connect(analyser);

    startSpeakingLoop();
    return stream;
  };

  const stopLocalAudio = () => {
    if (speakingTimerRef.current) {
      window.clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    setLocalSpeaking(false);

    analyserRef.current?.disconnect();
    analyserRef.current = null;

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  };

  const setMicEnabled = (enabled: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMicMuted(!enabled);
  };

  const startSpeakingLoop = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const THRESHOLD = 18;
    const HOLD_MS = 350;
    let lastSpokeAt = 0;

    speakingTimerRef.current = window.setInterval(() => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;

      const now = Date.now();
      const speakingNow = avg > THRESHOLD && !micMuted;

      if (speakingNow) lastSpokeAt = now;
      const shouldShowSpeaking = speakingNow || now - lastSpokeAt < HOLD_MS;

      setLocalSpeaking(shouldShowSpeaking);
    }, 100);
  };

  /** ---------- rtc ---------- */
  const createPeerConnection = async (peerId: string) => {
    const existing = pcsRef.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(RTC_CONFIG);

    const localStream = await startLocalAudio();
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      send({
        type: "ice",
        roomId: safeRoomId,
        from: userId,
        to: peerId,
        candidate: ev.candidate.toJSON(),
      });
    };

    pc.ontrack = (ev) => {
      let stream = remoteStreamRef.current.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        remoteStreamRef.current.set(peerId, stream);
      }
      stream.addTrack(ev.track);

      let audioEl = remoteAudioRef.current.get(peerId);
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        audioEl.controls = false;
        remoteAudioRef.current.set(peerId, audioEl);
      }
      audioEl.srcObject = stream;

      attachRemoteSpeakingDetector(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "failed" || st === "disconnected" || st === "closed") {
        cleanupPeer(peerId);
      }
    };

    pcsRef.current.set(peerId, pc);
    upsertPeer(peerId, { userId: peerId });
    return pc;
  };

  const makeOfferTo = async (peerId: string) => {
    const pc = await createPeerConnection(peerId);
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });
    await pc.setLocalDescription(offer);
    send({
      type: "offer",
      roomId: safeRoomId,
      from: userId,
      to: peerId,
      sdp: offer,
    });
  };

  const handleOffer = async (from: string, sdp: RTCSessionDescriptionInit) => {
    const pc = await createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({
      type: "answer",
      roomId: safeRoomId,
      from: userId,
      to: from,
      sdp: answer,
    });
  };

  const handleAnswer = async (from: string, sdp: RTCSessionDescriptionInit) => {
    const pc = pcsRef.current.get(from);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  const handleIce = async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = pcsRef.current.get(from);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {}
  };

  const cleanupPeer = (peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
      } catch {}
    }
    pcsRef.current.delete(peerId);

    const audioEl = remoteAudioRef.current.get(peerId);
    if (audioEl) {
      try {
        audioEl.srcObject = null;
      } catch {}
    }
    remoteAudioRef.current.delete(peerId);
    remoteStreamRef.current.delete(peerId);

    removePeer(peerId);
  };

  /** ---------- remote speaking detector ---------- */
  const remoteAnalyserRef = useRef<
    Map<string, { ctx: AudioContext; analyser: AnalyserNode; timer: number }>
  >(new Map());

  const attachRemoteSpeakingDetector = (
    peerId: string,
    stream: MediaStream,
  ) => {
    if (remoteAnalyserRef.current.has(peerId)) return;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const THRESHOLD = 18;
    const HOLD_MS = 350;
    let lastSpokeAt = 0;

    const timer = window.setInterval(() => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;

      const now = Date.now();
      const speakingNow = avg > THRESHOLD;

      if (speakingNow) lastSpokeAt = now;
      const shouldShowSpeaking = speakingNow || now - lastSpokeAt < HOLD_MS;

      upsertPeer(peerId, { isSpeaking: shouldShowSpeaking });
    }, 100);

    remoteAnalyserRef.current.set(peerId, { ctx, analyser, timer });
  };

  const cleanupRemoteSpeakingDetector = (peerId: string) => {
    const item = remoteAnalyserRef.current.get(peerId);
    if (!item) return;
    window.clearInterval(item.timer);
    item.analyser.disconnect();
    item.ctx.close().catch(() => {});
    remoteAnalyserRef.current.delete(peerId);
  };

  const cleanupPeerWithDetector = (peerId: string) => {
    cleanupRemoteSpeakingDetector(peerId);
    cleanupPeer(peerId);
  };

  /** ---------- websocket ---------- */
  const connectWs = () => {
    if (!wsUrl) {
      alert("VITE_SIGNALING_URL 환경변수가 필요합니다.");
      return;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onclose = () => {
      setConnected(false);
      setJoined(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = async (ev) => {
      const msg = JSON.parse(ev.data) as SignalMsg;

      switch (msg.type) {
        case "joined": {
          setJoined(true);
          const others = msg.peers.filter((p) => p !== userId);

          // ✅ UI용 기본값도 같이 채워서 보이게
          others.forEach((p) =>
            upsertPeer(p, {
              userId: p,
              micOn: true,
              displayName: "홍길동",
              subtitle: "Main.java",
            }),
          );

          for (const peerId of others) {
            await makeOfferTo(peerId);
          }
          break;
        }

        case "peer-joined": {
          if (msg.userId !== userId) {
            upsertPeer(msg.userId, {
              userId: msg.userId,
              micOn: true,
              displayName: "홍길동",
              subtitle: "Main.java",
            });
          }
          break;
        }

        case "offer":
          if (msg.to === userId) await handleOffer(msg.from, msg.sdp);
          break;

        case "answer":
          if (msg.to === userId) await handleAnswer(msg.from, msg.sdp);
          break;

        case "ice":
          if (msg.to === userId) await handleIce(msg.from, msg.candidate);
          break;

        case "peer-left":
          cleanupPeerWithDetector(msg.userId);
          break;

        default:
          break;
      }
    };
  };

  const joinRoom = async () => {
    if (!safeRoomId) {
      alert("roomId가 없습니다.");
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWs();
      setTimeout(() => {
        startLocalAudio()
          .then(() => send({ type: "join", roomId: safeRoomId, userId }))
          .catch(() => alert("마이크 권한을 허용해주세요."));
      }, 150);
      return;
    }

    try {
      await startLocalAudio();
      send({ type: "join", roomId: safeRoomId, userId });
    } catch {
      alert("마이크 권한을 허용해주세요.");
    }
  };

  const leaveRoom = () => {
    if (joined) send({ type: "leave", roomId: safeRoomId, userId });

    Array.from(pcsRef.current.keys()).forEach((pid) =>
      cleanupPeerWithDetector(pid),
    );
    pcsRef.current.clear();
    remoteAudioRef.current.clear();
    remoteStreamRef.current.clear();

    stopLocalAudio();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setPeers({});
    setJoined(false);
    setConnected(false);

    navigate("/home", { replace: true });
  };

  useEffect(() => {
    return () => {
      try {
        Array.from(pcsRef.current.keys()).forEach((pid) =>
          cleanupPeerWithDetector(pid),
        );
      } catch {}
      stopLocalAudio();
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const peerList = useMemo(() => Object.values(peers), [peers]);

  /** ---------- ✅ 여기부터 UI (사진처럼) ---------- */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* 상단 버튼(테스트용) */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Room</div>
            <div className="text-xs text-slate-500 font-mono">{safeRoomId}</div>
          </div>

          {!joined ? (
            <button
              onClick={joinRoom}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Join
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setMicEnabled(micMuted)}
                className={[
                  "rounded-xl px-3 py-2 text-sm font-semibold text-white",
                  micMuted
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500",
                ].join(" ")}
              >
                {micMuted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={leaveRoom}
                className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
              >
                Leave
              </button>
            </div>
          )}
        </div>

        {/* ✅ 참여자 패널 */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-slate-800 mb-3">참여자</h2>

          <div className="space-y-2">
            {/* 나 */}
            <ParticipantRow
              name="나"
              subtitle="나(host)"
              isHost
              isMe
              micOn={!micMuted}
              isSpeaking={localSpeaking}
            />

            {/* 상대들 */}
            {peerList.map((p) => (
              <ParticipantRow
                key={p.userId}
                name={p.displayName ?? p.userId}
                subtitle={p.subtitle}
                micOn={p.micOn}
                isSpeaking={p.isSpeaking}
              />
            ))}
          </div>
        </div>

        {/* 상태 뱃지(디버그) */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span
            className={[
              "rounded-full px-2 py-1",
              connected
                ? "bg-emerald-600/15 text-emerald-700"
                : "bg-slate-200 text-slate-600",
            ].join(" ")}
          >
            WS: {connected ? "connected" : "disconnected"}
          </span>
          <span
            className={[
              "rounded-full px-2 py-1",
              joined
                ? "bg-indigo-600/15 text-indigo-700"
                : "bg-slate-200 text-slate-600",
            ].join(" ")}
          >
            Room: {joined ? "joined" : "not joined"}
          </span>
        </div>
      </div>
    </div>
  );
}
