import { useEffect, useRef } from "react";
import {
  Phone, PhoneOff, Video, VideoOff,
  Mic, MicOff, Monitor, PhoneMissed,
} from "lucide-react";
import { useCallStore } from "../store/useCallStore";

const fmtDuration = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/* ── Incoming call ──────────────────────────────────────────────────────── */
export function IncomingCallBanner() {
  const { incomingCall, acceptCall, rejectCall } = useCallStore();
  if (!incomingCall) return null;

  const { fromUser, callType } = incomingCall;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[340px] rounded-3xl px-5 py-4 animate-slide-up flex items-center gap-4"
      style={{ background: "var(--s3)", border: "1px solid var(--border-2)", boxShadow: "0 16px 64px rgba(0,0,0,0.6)" }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden animate-pulse-call"
          style={{ border: "3px solid var(--accent)" }}>
          {fromUser?.profilePic
            ? <img src={fromUser.profilePic} alt={fromUser.fullName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: "var(--accent)" }}>
                {fromUser?.fullName?.[0]}
              </div>}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent)" }}>
          {callType === "video" ? <Video className="w-3 h-3 text-white" /> : <Phone className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--t1)" }}>{fromUser?.fullName}</p>
        <p className="text-xs animate-pulse" style={{ color: "var(--accent)" }}>
          Incoming {callType === "video" ? "video" : "voice"} call…
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={rejectCall} className="call-reject-btn w-11 h-11" title="Reject">
          <PhoneOff className="w-5 h-5" />
        </button>
        <button onClick={acceptCall} className="call-accept-btn w-11 h-11 animate-ring" title="Accept">
          <Phone className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Active call overlay ────────────────────────────────────────────────── */
export function CallOverlay() {
  const {
    activeCall, localStream, remoteStream,
    isMuted, isCameraOff, callDuration,
    toggleMute, toggleCamera, endCall,
  } = useCallStore();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current  && localStream)  localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  if (!activeCall) return null;

  const isVideo  = activeCall.type === "video";
  const isCalling = activeCall.status === "calling";
  const user      = activeCall.withUser;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-between"
      style={{ background: isVideo ? "#000" : "var(--bg)" }}>

      {/* ── Video call: remote full-screen ─────────────────────────── */}
      {isVideo && remoteStream && (
        <video ref={remoteVideoRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* ── Audio / waiting state ─────────────────────────────────── */}
      {(!isVideo || !remoteStream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          <div className="w-24 h-24 rounded-full overflow-hidden"
            style={{ border: "4px solid var(--accent)", boxShadow: "0 0 48px var(--accent-m)" }}>
            {user?.profilePic
              ? <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                  style={{ background: "var(--accent)" }}>
                  {user?.fullName?.[0]}
                </div>}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>{user?.fullName}</p>
            <p className="text-sm mt-1" style={{ color: "var(--t2)" }}>
              {isCalling
                ? "Calling…"
                : isVideo ? `${fmtDuration(callDuration)}` : `${fmtDuration(callDuration)}`}
            </p>
          </div>
        </div>
      )}

      {/* ── Duration (video active) ───────────────────────────────── */}
      {isVideo && !isCalling && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: "rgba(0,0,0,0.45)" }}>
          {fmtDuration(callDuration)}
        </div>
      )}

      {/* ── Local video PiP ──────────────────────────────────────── */}
      {isVideo && localStream && !isCameraOff && (
        <div className="absolute top-6 right-4 w-28 h-40 rounded-2xl overflow-hidden"
          style={{ border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          <video ref={localVideoRef} autoPlay muted playsInline
            className="w-full h-full object-cover" />
        </div>
      )}

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
          style={{ background: isMuted ? "var(--danger)" : "rgba(255,255,255,0.15)", color: "#fff" }}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End call */}
        <button onClick={endCall} className="call-reject-btn w-16 h-16" title="End call">
          <PhoneOff className="w-7 h-7" />
        </button>

        {/* Camera toggle (video calls only) */}
        {isVideo && (
          <button
            onClick={toggleCamera}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
            style={{ background: isCameraOff ? "var(--danger)" : "rgba(255,255,255,0.15)", color: "#fff" }}
            title={isCameraOff ? "Turn on camera" : "Turn off camera"}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}
      </div>
    </div>
  );
}
