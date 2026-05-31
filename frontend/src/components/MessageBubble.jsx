import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({
  message,
  isSent,
  isDeleted,
  onContextMenu,
  onImageClick,
  className = "",
}) {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isDeleted) {
    return (
      <div
        className={`px-4 py-3 rounded-lg bg-slate-800/30 border border-divider/30 italic text-tertiary text-sm ${className}`}
        onContextMenu={onContextMenu}
      >
        <p>🚫 This message was deleted</p>
      </div>
    );
  }

  return (
    <div
      className={`group message-bubble-container ${isSent ? "justify-end" : "justify-start"}`}
      onContextMenu={onContextMenu}
    >
      <div
        className={`max-w-xs sm:max-w-sm px-4 py-3 rounded-xl ${
          isSent
            ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-br-sm shadow-lg shadow-brand-500/20"
            : "bg-surface-tertiary text-primary rounded-bl-sm border border-divider/50"
        }`}
      >
        {/* Image */}
        {message.image && (
          <img
            src={message.image}
            alt="Shared media"
            onClick={() => onImageClick(message.image)}
            className="w-48 h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity duration-200"
          />
        )}

        {/* Text */}
        {message.text && (
          <p className="text-base leading-relaxed break-words">{message.text}</p>
        )}

        {/* Footer: Time, Edited, Read Receipt */}
        <div className={`flex items-center gap-1.5 mt-2 text-xs ${
          isSent ? "text-white/70" : "text-tertiary"
        }`}>
          {/* Time */}
          <span className="whitespace-nowrap">{formatTime(message.createdAt)}</span>

          {/* Edited indicator */}
          {message.isEdited && (
            <span className="whitespace-nowrap">· edited</span>
          )}

          {/* Read receipts (sent messages only) */}
          {isSent && !isDeleted && (
            <div className="ml-auto">
              {message.isRead ? (
                <CheckCheck className={`w-4 h-4 ${isSent ? "text-white/80" : "text-brand-400"}`} />
              ) : message.delivered ? (
                <CheckCheck className={`w-4 h-4 ${isSent ? "text-white/60" : "text-slate-400"}`} />
              ) : (
                <Check className={`w-4 h-4 ${isSent ? "text-white/50" : "text-slate-500"}`} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className={`opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex items-center gap-1 ${
        isSent ? "order-first mr-2 ml-0" : ""
      }`}>
        {/* Action buttons appear on hover */}
      </div>
    </div>
  );
}
