import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

/* ── ICE servers — STUN + Open Relay TURN (free, no signup needed) ───────── */
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:80?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

let peerRef = null;          // RTCPeerConnection
let localStreamRef = null;   // MediaStream
let ringtoneRef = null;      // Audio
let iceCandidateQueue = [];  // queue candidates before remoteDesc is set

function stopRingtone() {
  if (ringtoneRef) { ringtoneRef.pause(); ringtoneRef = null; }
}

function playRingtone() {
  stopRingtone();
  try {
    ringtoneRef = new Audio("/sounds/notification.mp3");
    ringtoneRef.loop = true;
    ringtoneRef.play().catch(() => {});
  } catch {}
}

export const useCallStore = create((set, get) => ({
  // State
  incomingCall:  null,   // { from, fromUser, callType, offer }
  activeCall:    null,   // { type, status, withUser, startTime }
  localStream:   null,
  remoteStream:  null,
  isMuted:       false,
  isCameraOff:   false,
  callDuration:  0,
  durationTimer: null,

  /* ── Initiate outgoing call ─────────────────────────────────────────── */
  initiateCall: async (user, callType) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    try {
      // Get media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef = stream;

      // Create peer connection
      peerRef = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(t => peerRef.addTrack(t, stream));

      // Remote stream handler
      const remoteStream = new MediaStream();
      peerRef.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach(t => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      // Connection state
      peerRef.onconnectionstatechange = () => {
        if (peerRef?.connectionState === "failed") {
          toast.error("Call connection failed — network issue");
          get().cleanupCall();
        }
      };

      // ICE candidates
      peerRef.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice", { to: user._id, candidate: e.candidate });
        }
      };

      // Create offer
      const offer = await peerRef.createOffer();
      await peerRef.setLocalDescription(offer);

      // Tell server
      socket.emit("call:initiate", { to: user._id, callType, offer });

      set({
        localStream: stream,
        activeCall: { type: callType, status: "calling", withUser: user, startTime: null },
        isMuted: false,
        isCameraOff: false,
      });
    } catch (err) {
      console.error("initiateCall:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Camera/microphone permission denied. Please allow access in browser settings.");
      } else if (err.name === "NotFoundError") {
        toast.error("Camera or microphone not found.");
      } else {
        toast.error("Could not start call. Check camera/mic permissions.");
      }
      get().cleanupCall();
    }
  },

  /* ── Accept incoming call ───────────────────────────────────────────── */
  acceptCall: async () => {
    const { incomingCall } = get();
    const socket = useAuthStore.getState().socket;
    if (!incomingCall || !socket) return;

    stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === "video",
      });
      localStreamRef = stream;

      peerRef = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(t => peerRef.addTrack(t, stream));

      const remoteStream = new MediaStream();
      peerRef.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach(t => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      peerRef.onconnectionstatechange = () => {
        if (peerRef?.connectionState === "failed") {
          toast.error("Call connection failed — network issue");
          get().cleanupCall();
        }
      };

      peerRef.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice", { to: incomingCall.from, candidate: e.candidate });
        }
      };

      await peerRef.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // Drain any ICE candidates that arrived before remote description
      for (const c of iceCandidateQueue) {
        try { await peerRef.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }
      iceCandidateQueue = [];

      const answer = await peerRef.createAnswer();
      await peerRef.setLocalDescription(answer);

      socket.emit("call:accept", { to: incomingCall.from, answer });

      const startTime = Date.now();
      const timer = setInterval(() => {
        set({ callDuration: Math.floor((Date.now() - startTime) / 1000) });
      }, 1000);

      set({
        localStream: stream,
        activeCall: { type: incomingCall.callType, status: "active", withUser: incomingCall.fromUser, startTime },
        incomingCall: null,
        isMuted: false,
        isCameraOff: false,
        durationTimer: timer,
      });
    } catch (err) {
      console.error("acceptCall:", err);
      get().rejectCall();
    }
  },

  /* ── Reject incoming call ───────────────────────────────────────────── */
  rejectCall: () => {
    const { incomingCall } = get();
    const socket = useAuthStore.getState().socket;
    stopRingtone();
    if (incomingCall && socket) {
      socket.emit("call:reject", { to: incomingCall.from });
    }
    set({ incomingCall: null });
  },

  /* ── End active call ────────────────────────────────────────────────── */
  endCall: async () => {
    const { activeCall, callDuration, durationTimer } = get();
    const socket = useAuthStore.getState().socket;
    clearInterval(durationTimer);

    if (activeCall?.withUser && socket) {
      socket.emit("call:end", { to: activeCall.withUser._id });

      // Record in DB
      if (activeCall.status === "active") {
        axiosInstance.post("/auth/calls", {
          withUserId: activeCall.withUser._id,
          type: activeCall.type,
          status: "answered",
          duration: callDuration,
        }).catch(() => {});
      }
    }
    get().cleanupCall();
  },

  /* ── Toggle mute ────────────────────────────────────────────────────── */
  toggleMute: () => {
    if (localStreamRef) {
      localStreamRef.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      set({ isMuted: !get().isMuted });
    }
  },

  /* ── Toggle camera ──────────────────────────────────────────────────── */
  toggleCamera: () => {
    if (localStreamRef) {
      localStreamRef.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      set({ isCameraOff: !get().isCameraOff });
    }
  },

  /* ── Cleanup ────────────────────────────────────────────────────────── */
  cleanupCall: () => {
    clearInterval(get().durationTimer);
    if (localStreamRef) { localStreamRef.getTracks().forEach(t => t.stop()); localStreamRef = null; }
    if (peerRef)        { peerRef.close(); peerRef = null; }
    iceCandidateQueue = [];
    stopRingtone();
    set({ activeCall: null, incomingCall: null, localStream: null, remoteStream: null, isMuted: false, isCameraOff: false, callDuration: 0, durationTimer: null });
  },

  /* ── Subscribe to socket call events ───────────────────────────────── */
  subscribeToCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const setup = () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:rejected");
      socket.off("call:ended");
      socket.off("call:busy");
      socket.off("call:unavailable");
      socket.off("call:ice");

      socket.on("call:incoming", (data) => {
        if (get().activeCall) {
          socket.emit("call:busy", { to: data.from });
          return;
        }
        playRingtone();
        set({ incomingCall: data });
      });

      socket.on("call:accepted", async ({ answer }) => {
        if (!peerRef) return;
        await peerRef.setRemoteDescription(new RTCSessionDescription(answer));
        // Drain queued ICE candidates
        for (const c of iceCandidateQueue) {
          try { await peerRef.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        iceCandidateQueue = [];
        const startTime = Date.now();
        const timer = setInterval(() => {
          set({ callDuration: Math.floor((Date.now() - startTime) / 1000) });
        }, 1000);
        set(s => ({ activeCall: { ...s.activeCall, status: "active", startTime }, durationTimer: timer }));
      });

      socket.on("call:rejected", () => {
        toast("Call rejected", { icon: "📵" });
        get().cleanupCall();
      });

      socket.on("call:ended", () => {
        get().cleanupCall();
      });

      socket.on("call:busy", () => {
        toast("User is busy on another call", { icon: "📵" });
        get().cleanupCall();
      });

      socket.on("call:unavailable", () => {
        toast.error("User is offline or unavailable");
        get().cleanupCall();
      });

      socket.on("call:ice", async ({ candidate }) => {
        if (!candidate) return;
        try {
          if (peerRef && peerRef.remoteDescription) {
            await peerRef.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            // Queue until remote description is set
            iceCandidateQueue.push(candidate);
          }
        } catch (e) { console.error("ICE add error:", e); }
      });
    };

    if (socket.connected) {
      setup();
    } else {
      socket.once("connect", setup);
    }
  },

  unsubscribeFromCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    ["call:incoming","call:accepted","call:rejected","call:ended","call:busy","call:unavailable","call:ice"]
      .forEach(e => socket.off(e));
  },
}));
