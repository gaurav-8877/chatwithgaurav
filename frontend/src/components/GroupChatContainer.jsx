import { useEffect, useRef, useState } from "react";
import { Hash, Users, Send, Reply, X, Trash2, Edit2, Paperclip, Smile } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import TypingIndicator from "./TypingIndicator";
import EmojiPicker from "./EmojiPicker";

const QUICK_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtDate = (d) => {
  const date = new Date(d);
  const now   = new Date();
  const diff  = Math.floor((now - date) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};

/* ── inline reaction bar ──────────────────────────────────────────────────── */
function GroupReactions({ msg, groupId, authUserId, onAdd, onRemove }) {
  const [showPicker, setShowPicker] = useState(false);
  if (!msg.reactions?.length && !showPicker) return null;

  const grouped = {};
  msg.reactions?.forEach(r => {
    const id = r.userId?.toString?.() ?? r.userId;
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(id);
  });

  return (
    <div className="flex flex-wrap gap-1 mt-1 items-center">
      {Object.entries(grouped).map(([emoji, users]) => {
        const mine = users.some(id => id === authUserId || id === authUserId?.toString());
        return (
          <button key={emoji}
            onClick={() => mine ? onRemove(emoji) : onAdd(emoji)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
            style={{
              background: mine ? "rgba(109,93,252,0.20)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${mine ? "rgba(109,93,252,0.40)" : "rgba(255,255,255,0.08)"}`,
              color: mine ? "#8B5CF6" : "#A1A1AA",
            }}>
            {emoji}{users.length > 1 && <span>{users.length}</span>}
          </button>
        );
      })}
      <div className="relative">
        <button onClick={() => setShowPicker(!showPicker)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-7 left-0 z-50 flex gap-1 px-2 py-1.5 rounded-xl"
            style={{ background: "#27272A", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={() => { onAdd(e); setShowPicker(false); }}
                className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────────── */
// WhatsApp dark colours
const WA = {
  chatBg: "#0B141A",
  sent:   "#005C4B",
  recv:   "#1F2C33",
  time:   "rgba(233,237,239,0.60)",
  header: "#1F2C33",
  input:  "#1F2C33",
};

export default function GroupChatContainer({ onShowInfo }) {
  const {
    selectedGroup, groupMessages, isGroupMessagesLoading,
    sendGroupMessage, editGroupMessage, deleteGroupMessage,
    addGroupReaction, removeGroupReaction,
    replyingTo, setReplyingTo, editingMessage, setEditingMessage, groupTypingMap,
  } = useGroupStore();

  const { authUser } = useAuthStore();
  const socket       = useAuthStore.getState().socket;

  const [text,         setText]         = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64,  setImageBase64]  = useState(null);
  const [contextMenu,  setContextMenu]  = useState(null);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [typingTo,     setTypingTo]     = useState(null);

  const bottomRef = useRef();
  const fileRef   = useRef();
  const inputRef  = useRef();
  const groupId   = selectedGroup?._id;
  const typingInfo = groupTypingMap?.[groupId];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages, typingInfo]);
  useEffect(() => { if (editingMessage) { setText(editingMessage.text || ""); inputRef.current?.focus(); } }, [editingMessage]);
  useEffect(() => {
    const h = () => setContextMenu(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  const handleTyping = () => {
    socket?.emit("groupTyping", { groupId, senderId: authUser._id, senderName: authUser.fullName.split(" ")[0] });
    clearTimeout(typingTo);
    setTypingTo(setTimeout(() => { socket?.emit("groupStoppedTyping", { groupId, senderId: authUser._id }); }, 1500));
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageBase64) return;
    socket?.emit("groupStoppedTyping", { groupId, senderId: authUser._id });
    if (editingMessage) {
      await editGroupMessage(groupId, editingMessage._id, trimmed);
    } else {
      await sendGroupMessage(groupId, { text: trimmed || undefined, image: imageBase64 || undefined });
    }
    setText(""); setImagePreview(null); setImageBase64(null);
    setReplyingTo(null); setEditingMessage(null);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") { setReplyingTo(null); setEditingMessage(null); setText(""); }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result); setImageBase64(reader.result); };
    reader.readAsDataURL(file);
  };

  /* group by date */
  const grouped = [];
  let lastDate = null;
  groupMessages.forEach((msg, i) => {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) { grouped.push({ type: "date", date: msg.createdAt }); lastDate = d; }
    grouped.push({ type: "msg", msg });
  });

  return (
    <div className="flex flex-col h-full" style={{ background: WA.chatBg }}
      onClick={() => setContextMenu(null)}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-[66px] flex-shrink-0"
        style={{ background: WA.header, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ background: "#27272A", border: "1px solid rgba(255,255,255,0.06)" }}>
          {selectedGroup?.avatar
            ? <img src={selectedGroup.avatar} alt={selectedGroup.name} className="w-full h-full object-cover" />
            : <Hash className="w-5 h-5" style={{ color: "#71717A" }} strokeWidth={1.8} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{selectedGroup?.name}</p>
          <p className="text-xs" style={{ color: "#52525B" }}>{selectedGroup?.members?.length} members</p>
        </div>
        <button onClick={onShowInfo} className="icon-btn" title="Group info">
          <Users className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2" style={{ scrollbarWidth: "none" }}>
        {isGroupMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#6D5DFC transparent transparent transparent" }} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "#18181B" }}>
              <Hash className="w-8 h-8" style={{ color: "#3F3F46" }} />
            </div>
            <p className="text-sm" style={{ color: "#52525B" }}>No messages yet — say hello!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {grouped.map((item, i) => {
              if (item.type === "date") {
                return (
                  <div key={`d-${i}`} className="flex items-center gap-3 py-4">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <span className="px-3 py-1 rounded-full text-2xs font-semibold uppercase tracking-widest"
                      style={{ background: "#18181B", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {fmtDate(item.date)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                );
              }

              const { msg } = item;
              const senderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
              const isSent   = senderId === authUser._id || senderId?.toString() === authUser._id;
              const name     = typeof msg.senderId === "object" ? msg.senderId?.fullName : "Unknown";
              const pic      = typeof msg.senderId === "object" ? msg.senderId?.profilePic : null;

              if (msg.deletedForEveryone) {
                return (
                  <div key={msg._id} className={`flex ${isSent ? "justify-end" : "justify-start"} py-0.5`}>
                    <div className="px-3 py-2 rounded-xl text-sm italic"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#52525B" }}>
                      🚫 This message was deleted
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg._id}
                  className={`flex gap-2 py-0.5 message-animation ${isSent ? "flex-row-reverse" : "flex-row"}`}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ msg, x: e.clientX, y: e.clientY }); }}>

                  {!isSent && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 self-end"
                      style={{ background: "#27272A" }}>
                      {pic
                        ? <img src={pic} alt={name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ background: `hsl(${(name?.charCodeAt(0) || 65) * 7 % 360},60%,42%)` }}>
                            {name?.[0]?.toUpperCase()}
                          </div>}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-chat-bubble ${isSent ? "items-end" : "items-start"}`}>
                    {!isSent && (
                      <span className="text-2xs font-semibold mb-1 ml-1" style={{ color: `hsl(${(name?.charCodeAt(0) || 65) * 7 % 360},70%,65%)` }}>
                        {name}
                      </span>
                    )}

                    {msg.replyTo && (
                      <div className="px-3 py-1.5 mb-1 rounded-xl text-xs max-w-full"
                        style={{ background: "rgba(255,255,255,0.05)", borderLeft: "3px solid #6D5DFC", color: "#A1A1AA" }}>
                        <p className="font-semibold text-xs mb-0.5" style={{ color: "#6D5DFC" }}>Reply</p>
                        <p className="truncate">{msg.replyTo?.text || "📷 Photo"}</p>
                      </div>
                    )}

                    <div className="px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        borderRadius: isSent ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                        background: isSent ? WA.sent : WA.recv,
                        color: "#FAFAFA",
                        wordBreak: "break-word",
                        opacity: msg.isOptimistic ? 0.7 : 1,
                      }}>
                      {msg.image && (
                        <img src={msg.image} alt="" className="w-48 h-48 object-cover rounded-xl mb-2 cursor-pointer hover:opacity-80 transition-opacity" />
                      )}
                      {msg.text && <span>{msg.text}</span>}
                      <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${isSent ? "justify-end" : ""}`}
                        style={{ color: WA.time }}>
                        {msg.isEdited && <span>edited ·</span>}
                        <span>{fmtTime(msg.createdAt)}</span>
                      </div>
                    </div>

                    <GroupReactions msg={msg} groupId={groupId} authUserId={authUser._id}
                      onAdd={(e) => addGroupReaction(groupId, msg._id, e)}
                      onRemove={(e) => removeGroupReaction(groupId, msg._id, e)} />
                  </div>
                </div>
              );
            })}

            {typingInfo && (
              <div className="flex items-center gap-2 py-2 ml-9">
                <span className="text-xs italic" style={{ color: "#52525B" }}>{typingInfo.senderName} is typing</span>
                <TypingIndicator />
              </div>
            )}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="ctx-menu" style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}>
          <button className="ctx-item" onClick={() => { setReplyingTo(contextMenu.msg); setContextMenu(null); }}>
            <Reply className="w-4 h-4" /> Reply
          </button>
          {(() => {
            const sid = typeof contextMenu.msg.senderId === "object" ? contextMenu.msg.senderId?._id : contextMenu.msg.senderId;
            return (sid === authUser._id || sid?.toString() === authUser._id);
          })() && (
            <>
              <button className="ctx-item" onClick={() => { setEditingMessage(contextMenu.msg); setContextMenu(null); }}>
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 12px" }} />
              <button className="ctx-item-danger" onClick={() => { deleteGroupMessage(groupId, contextMenu.msg._id, "everyone"); setContextMenu(null); }}>
                <Trash2 className="w-4 h-4" /> Delete for everyone
              </button>
            </>
          )}
          <button className="ctx-item-danger" onClick={() => { deleteGroupMessage(groupId, contextMenu.msg._id, "me"); setContextMenu(null); }}>
            <Trash2 className="w-4 h-4" /> Delete for me
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-5 pt-2" style={{ background: WA.chatBg }}>
        {(replyingTo || editingMessage) && (
          <div className="flex items-center gap-3 px-4 py-2.5 mb-2 rounded-2xl"
            style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: "#6D5DFC" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "#6D5DFC" }}>
                {replyingTo ? "Replying" : "Editing"}
              </p>
              <p className="text-xs truncate" style={{ color: "#71717A" }}>
                {(replyingTo || editingMessage)?.text || "📷 Photo"}
              </p>
            </div>
            <button className="icon-btn-sm" onClick={() => { setReplyingTo(null); setEditingMessage(null); setText(""); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {imagePreview && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-2xl"
            style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="relative">
              <img src={imagePreview} alt="" className="w-14 h-14 object-cover rounded-xl" />
              <button onClick={() => { setImagePreview(null); setImageBase64(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full"
                style={{ background: "#EF4444" }}>
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            <p className="text-xs" style={{ color: "#71717A" }}>Image attached</p>
          </div>
        )}

        <div className="composer" style={{ background: WA.input, borderColor: "rgba(255,255,255,0.08)" }}>
          <button type="button" onClick={() => fileRef.current?.click()} className="icon-btn-sm flex-shrink-0">
            <Paperclip className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <div className="relative flex-shrink-0">
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="icon-btn-sm">
              <Smile className="w-4 h-4" strokeWidth={1.8} />
            </button>
            {showEmoji && (
              <EmojiPicker
                onEmojiSelect={(e) => { setText(t => t + e); setShowEmoji(false); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>

          <textarea ref={inputRef} value={text}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKey}
            placeholder={`Message #${selectedGroup?.name}`}
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              resize: "none", color: "#FAFAFA", fontSize: 14, lineHeight: "22px",
              maxHeight: 120, overflowY: "auto", padding: "1px 0",
            }}
            className="placeholder-zinc-600"
          />

          <button onClick={handleSend} disabled={!text.trim() && !imageBase64}
            className="send-btn flex-shrink-0">
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
