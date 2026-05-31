import { useEffect, useRef, useState, useCallback } from "react";
import { Check, CheckCheck, Reply, Edit2, Trash2, SmilePlus, Pin, Forward, Share2 } from "lucide-react";
import { useChatStore }  from "../store/useChatStore";
import { useAuthStore }  from "../store/useAuthStore";
import ChatHeader        from "./ChatHeader";
import MessageComposer   from "./MessageComposer";
import ImageLightbox     from "./ImageLightbox";
import SmartReply        from "./SmartReply";
import { axiosInstance } from "../lib/axios";
import toast             from "react-hot-toast";

/* ── helpers ──────────────────────────────────────────────────────────────── */
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtDate = (d) => {
  const date = new Date(d);
  const diff  = Math.floor((new Date() - date) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};

const GROUP_GAP_MS = 5 * 60 * 1000;

/* ── Date separator ──────────────────────────────────────────────────────── */
function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1" style={{ height: 1, background: "var(--border)" }} />
      <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest"
        style={{ background: "var(--s2)", color: "var(--t3)" }}>
        {fmtDate(date)}
      </span>
      <div className="flex-1" style={{ height: 1, background: "var(--border)" }} />
    </div>
  );
}

/* ── Quick reaction bar ──────────────────────────────────────────────────── */
const QUICK = ["👍","❤️","😂","😮","😢","🔥","🙏"];
function ReactionBar({ onPick, side }) {
  return (
    <div className={`absolute ${side === "sent" ? "right-0 -top-11" : "left-0 -top-11"} z-20 animate-scale-in flex gap-0.5 px-2 py-1.5 rounded-2xl`}
      style={{ background: "var(--s3)", border: "1px solid var(--border-2)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
      {QUICK.map(e => (
        <button key={e} onClick={() => onPick(e)}
          className="text-lg w-8 h-8 flex items-center justify-center rounded-xl hover:scale-125 transition-transform">
          {e}
        </button>
      ))}
    </div>
  );
}

/* ── Reactions display ───────────────────────────────────────────────────── */
function Reactions({ reactions, myId, onAdd, onRemove }) {
  if (!reactions?.length) return null;
  const grouped = {};
  reactions.forEach(r => {
    const uid = r.userId?.toString?.() ?? r.userId;
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(uid);
  });
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, users]) => {
        const mine = users.includes(myId);
        return (
          <button key={emoji} onClick={() => mine ? onRemove(emoji) : onAdd(emoji)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
            style={{
              background: mine ? "var(--accent-m)" : "var(--border)",
              border: `1px solid ${mine ? "var(--accent)" : "var(--border-2)"}`,
              color: mine ? "var(--accent)" : "var(--t2)",
            }}>
            {emoji}{users.length > 1 && <span>{users.length}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Message skeleton ────────────────────────────────────────────────────── */
function MsgSkel({ sent }) {
  return (
    <div className={`flex ${sent ? "justify-end" : "justify-start"} px-4 py-1`}>
      <div className="skeleton" style={{ width: `${120 + Math.random() * 140}px`, height: 36, borderRadius: 16 }} />
    </div>
  );
}

/* ── Forward modal ───────────────────────────────────────────────────────── */
function ForwardModal({ messageId, onClose }) {
  const { chats } = useChatStore();
  const [selected, setSelected] = useState([]);
  const [sending,  setSending]  = useState(false);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleForward = async () => {
    if (!selected.length) return;
    setSending(true);
    try {
      await axiosInstance.post(`/messages/${messageId}/forward`, { toUserIds: selected });
      toast.success("Message forwarded!");
      onClose();
    } catch { toast.error("Failed to forward"); }
    finally   { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-scale-in"
        style={{ background: "var(--s2)", border: "1px solid var(--border-2)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Forward to…</h3>
        </div>
        <div className="max-h-64 overflow-y-auto px-3 py-2 space-y-0.5">
          {chats.map(c => (
            <button key={c._id} onClick={() => toggle(c._id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{ background: selected.includes(c._id) ? "var(--accent-m)" : "transparent" }}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--s3)" }}>
                {c.profilePic ? <img src={c.profilePic} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--t1)" }}>{c.fullName}</span>
              {selected.includes(c._id) && <span className="ml-auto text-xs font-bold" style={{ color: "var(--accent)" }}>✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors"
            style={{ background: "var(--s3)", color: "var(--t2)" }}>Cancel</button>
          <button onClick={handleForward} disabled={!selected.length || sending}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "var(--accent)" }}>
            {sending ? "Sending…" : `Forward (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Search panel ─────────────────────────────────────────────────────────── */
function SearchPanel({ userId, onClose }) {
  const [q,       setQ]       = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/messages/search?q=${encodeURIComponent(q)}&withUserId=${userId}`);
      setResults(res.data);
    } catch { toast.error("Search failed"); }
    finally   { setLoading(false); }
  };

  return (
    <div className="flex-shrink-0 px-4 py-3" style={{ background: "var(--s2)", borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Search messages…"
          className="flex-1 text-sm px-3 py-2 rounded-xl focus:outline-none"
          style={{ background: "var(--s3)", color: "var(--t1)", border: "1px solid var(--border)" }}
          autoFocus
        />
        <button onClick={search} className="send-btn px-4 text-sm font-semibold" style={{ width: "auto", borderRadius: 12, padding: "8px 14px" }}>
          {loading ? "…" : "Find"}
        </button>
        <button onClick={onClose} className="icon-btn-sm">✕</button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
          {results.map(m => (
            <div key={m._id} className="px-3 py-2 rounded-xl text-sm" style={{ background: "var(--s3)", color: "var(--t1)" }}>
              <span style={{ color: "var(--t3)", fontSize: 11 }}>{fmtTime(m.createdAt)}</span>
              <p className="truncate mt-0.5">{m.text}</p>
            </div>
          ))}
        </div>
      )}
      {results.length === 0 && q && !loading && (
        <p className="text-xs mt-2 text-center" style={{ color: "var(--t3)" }}>No results found</p>
      )}
    </div>
  );
}

/* ── Single Message ──────────────────────────────────────────────────────── */
function Message({ msg, isSent, isFirst, isLast, authUser, onImageClick, onReply, onEdit, onDelete, onReact, onRemoveReact, onForward, onPin }) {
  const [showReact,   setShowReact]   = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isDeleted = msg.deletedForEveryone;

  const borderRadius = () => {
    if (isSent) return isFirst ? "20px 20px 5px 20px" : "20px 20px 5px 20px";
    return isFirst ? "20px 20px 20px 5px" : "20px 20px 20px 5px";
  };

  if (isDeleted && isSent) return null;

  return (
    <div
      className={`flex ${isSent ? "flex-row-reverse" : "flex-row"} items-end gap-2 ${isFirst ? "mt-3" : "mt-0.5"} group/msg relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReact(false); }}
    >
      {/* Recv avatar */}
      {!isSent && (
        <div className="w-7 flex-shrink-0">
          {isLast && (
            <img src={msg.senderPic || "/avatar.png"} alt="" className="w-7 h-7 rounded-full object-cover" />
          )}
        </div>
      )}

      <div className={`flex flex-col max-w-[72%] ${isSent ? "items-end" : "items-start"}`}>
        {/* Reply context */}
        {msg.replyTo && (
          <div className="px-3 py-1.5 mb-1 rounded-xl text-xs max-w-full"
            style={{ background: "var(--border)", borderLeft: "3px solid var(--accent)", color: "var(--t2)" }}>
            <p className="font-semibold mb-0.5" style={{ color: "var(--accent)" }}>Reply</p>
            <p className="truncate">{msg.replyTo?.text || "📷 Photo"}</p>
          </div>
        )}

        {/* Forwarded badge */}
        {msg.isForwarded && (
          <div className="flex items-center gap-1 mb-1 px-2" style={{ color: "var(--t3)" }}>
            <Forward className="w-3 h-3" />
            <span className="text-[10px]">Forwarded</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className="relative px-4 py-2.5 text-sm leading-relaxed"
          style={{
            borderRadius: borderRadius(),
            background: isDeleted
              ? "var(--bubble-del)"
              : isSent ? "var(--bubble-sent)" : "var(--bubble-recv)",
            color: isDeleted ? "var(--t3)" : "var(--t1)",
            fontStyle: isDeleted ? "italic" : "normal",
            wordBreak: "break-word",
            ...(isSent
              ? {}
              : { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }),
          }}
        >
          {showReact && !isDeleted && (
            <ReactionBar side={isSent ? "sent" : "recv"} onPick={e => { onReact(msg._id, e); setShowReact(false); }} />
          )}

          {isDeleted ? (
            <span>🚫 This message was deleted</span>
          ) : (
            <>
              {msg.image && (
                <img src={msg.image} alt="" onClick={() => onImageClick(msg.image)}
                  className="w-48 h-48 object-cover rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-opacity" />
              )}
              {msg.text && <span>{msg.text}</span>}
              {msg.isPinned && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-semibold" style={{ color: "var(--accent)" }}>
                  <Pin className="w-2.5 h-2.5" /> pinned
                </span>
              )}
            </>
          )}

          {/* Footer */}
          {!isDeleted && (
            <div className={`flex items-center gap-1.5 mt-1 text-[10px] select-none ${isSent ? "justify-end" : ""}`}
              style={{ color: isSent ? "rgba(233,237,239,0.6)" : "var(--t3)" }}>
              {msg.isEdited && <span>edited ·</span>}
              <span>{fmtTime(msg.createdAt)}</span>
              {isSent && (
                msg.isRead    ? <CheckCheck className="w-3.5 h-3.5" style={{ color: "var(--tick-read)" }} /> :
                msg.delivered ? <CheckCheck className="w-3.5 h-3.5" style={{ color: "rgba(233,237,239,0.5)" }} /> :
                                <Check      className="w-3.5 h-3.5" style={{ color: "rgba(233,237,239,0.4)" }} />
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        <Reactions reactions={msg.reactions} myId={authUser._id}
          onAdd={e => onReact(msg._id, e)} onRemove={e => onRemoveReact(msg._id, e)} />
      </div>

      {/* Hover toolbar */}
      {showActions && !isDeleted && (
        <div className={`flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isSent ? "flex-row-reverse mr-1" : "ml-1"} flex-shrink-0`}>
          <button onClick={() => setShowReact(!showReact)} className="icon-btn-sm"><SmilePlus className="w-3.5 h-3.5" /></button>
          <button onClick={() => onReply(msg)}              className="icon-btn-sm"><Reply     className="w-3.5 h-3.5" /></button>
          <button onClick={() => onForward(msg._id)}        className="icon-btn-sm"><Share2    className="w-3.5 h-3.5" /></button>
          {isSent && (
            <>
              <button onClick={() => onEdit(msg)}       className="icon-btn-sm"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onPin(msg._id)}    className="icon-btn-sm"><Pin   className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(msg._id, "everyone")} className="icon-btn-sm hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
          {!isSent && (
            <button onClick={() => onDelete(msg._id, "me")} className="icon-btn-sm hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ChatContainer ────────────────────────────────────────────────────────── */
export default function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, messages, isMessagesLoading,
    subscribeToMessages, unsubscribeFromMessages,
    deleteMessage, setReplyingTo, setEditingMessage,
    addReaction, removeReaction, isTyping,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const bottomRef   = useRef(null);
  const composerRef = useRef(null);

  const [lightbox,     setLightbox]     = useState(null);
  const [forwardId,    setForwardId]    = useState(null);
  const [showSearch,   setShowSearch]   = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  const handleReply  = useCallback((msg) => { setReplyingTo(msg); composerRef.current?.focus(); }, [setReplyingTo]);
  const handleEdit   = useCallback((msg) => { setEditingMessage(msg); composerRef.current?.focus(); }, [setEditingMessage]);
  const handleDelete = useCallback((id, t) => deleteMessage(id, t), [deleteMessage]);

  const handlePin = useCallback(async (messageId) => {
    try {
      await axiosInstance.patch(`/messages/${messageId}/pin`);
      toast.success("Message pinned!");
    } catch { toast.error("Failed to pin"); }
  }, []);

  // Build grouped list
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const items  = [];
  let lastDate = null;
  sorted.forEach((msg, i) => {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) { items.push({ type: "date", date: msg.createdAt, key: `d-${i}` }); lastDate = d; }

    const prev = sorted[i - 1];
    const next = sorted[i + 1];
    const sameAsPrev = prev && prev.senderId?.toString() === msg.senderId?.toString() &&
      new Date(msg.createdAt) - new Date(prev.createdAt) < GROUP_GAP_MS &&
      new Date(msg.createdAt).toDateString() === new Date(prev.createdAt).toDateString();
    const sameAsNext = next && next.senderId?.toString() === msg.senderId?.toString() &&
      new Date(next.createdAt) - new Date(msg.createdAt) < GROUP_GAP_MS &&
      new Date(next.createdAt).toDateString() === new Date(msg.createdAt).toDateString();

    items.push({ type: "msg", msg, isFirst: !sameAsPrev, isLast: !sameAsNext, key: msg._id });
  });

  const lastRecv = [...sorted].reverse().find(m => m.senderId?.toString() !== authUser._id && !m.deletedForEveryone);
  const hasSentAfter = lastRecv && sorted.some(m => new Date(m.createdAt) > new Date(lastRecv.createdAt) && m.senderId?.toString() === authUser._id);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <ChatHeader
        onShowProfile={() => setShowProfile(!showProfile)}
        onShowSearch={()  => setShowSearch(!showSearch)}
        onShowPinned={()  => {}}
      />

      {showSearch && <SearchPanel userId={selectedUser?._id} onClose={() => setShowSearch(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2" style={{ scrollbarWidth: "none" }}>
        {isMessagesLoading ? (
          <div className="pt-8 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <MsgSkel key={i} sent={i % 3 === 0} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "var(--s2)" }}>💬</div>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{ color: "var(--t1)" }}>
                Start a conversation with {selectedUser?.fullName?.split(" ")[0]}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>Say hello!</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {items.map(item =>
              item.type === "date"
                ? <DateSeparator key={item.key} date={item.date} />
                : (
                  <Message
                    key={item.key}
                    msg={item.msg}
                    isSent={item.msg.senderId?.toString() === authUser._id}
                    isFirst={item.isFirst}
                    isLast={item.isLast}
                    authUser={authUser}
                    onImageClick={setLightbox}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReact={addReaction}
                    onRemoveReact={removeReaction}
                    onForward={(id) => setForwardId(id)}
                    onPin={handlePin}
                  />
                )
            )}

            {/* Typing */}
            {isTyping && (
              <div className="flex items-end gap-2 mt-3 ml-9">
                <div className="flex items-center gap-1 px-4 py-3 rounded-[20px_20px_20px_5px]"
                  style={{ background: "var(--bubble-recv)" }}>
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--t3)", animation: `typingBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {lastRecv && !hasSentAfter && (
              <div className="ml-9 mt-2">
                <SmartReply message={lastRecv} onSelectReply={t => composerRef.current?.setInputText(t)} />
              </div>
            )}

            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      <MessageComposer ref={composerRef} />

      {lightbox  && <ImageLightbox imageUrl={lightbox} onClose={() => setLightbox(null)} />}
      {forwardId && <ForwardModal messageId={forwardId} onClose={() => setForwardId(null)} />}
    </div>
  );
}
