import { MessageSquare } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-5" style={{ background: "#09090B" }}>
      <div className="relative">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)", boxShadow: "0 0 32px rgba(109,93,252,0.4)" }}
        >
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
        {/* Spinner ring */}
        <div
          className="absolute -inset-1.5 rounded-[22px] border-2 border-transparent"
          style={{
            borderTopColor: "#6D5DFC",
            borderRightColor: "rgba(109,93,252,0.3)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-white">Chatify</p>
        <p className="text-xs" style={{ color: "#52525B" }}>Loading…</p>
      </div>
    </div>
  );
}
