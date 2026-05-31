import {
  forwardRef, useImperativeHandle,
  useRef, useState, useEffect,
} from "react";
import {
  Paperclip, Smile, Mic, Send, X, Edit2, Reply, Zap, Loader2,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import EmojiPicker from "./EmojiPicker";

const COMMANDS = [
  { cmd: "/poll",     desc: "Create a poll"            },
  { cmd: "/remind",   desc: "Set a reminder"           },
  { cmd: "/meeting",  desc: "Schedule a meeting"       },
  { cmd: "/translate",desc: "Translate message"        },
];

const MessageComposer = forwardRef(function MessageComposer(_, ref) {
  const [text,          setText]          = useState("");
  const [imagePreview,  setImagePreview]  = useState(null);
  const [imageB64,      setImageB64]      = useState(null);
  const [showEmoji,     setShowEmoji]     = useState(false);
  const [showCommands,  setShowCommands]  = useState(false);
  const [isSending,     setIsSending]     = useState(false);

  const textareaRef = useRef(null);
  const fileRef     = useRef(null);
  const typingRef   = useRef(null);

  const {
    sendMessage, editMessage,
    selectedUser, replyingTo, setReplyingTo,
    editingMessage, setEditingMessage,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();

  useImperativeHandle(ref, () => ({
    focus: ()           => textareaRef.current?.focus(),
    setInputText: (t)   => setText(t),
  }));

  /* auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px";
  }, [text]);

  /* pre-fill text when editing */
  useEffect(() => {
    if (editingMessage) { setText(editingMessage.text || ""); textareaRef.current?.focus(); }
  }, [editingMessage]);

  /* typing indicator */
  const emitTyping = () => {
    if (!socket || !selectedUser) return;
    socket.emit("userTyping", { senderId: authUser._id, receiverId: selectedUser._id });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit("userStoppedTyping", { senderId: authUser._id, receiverId: selectedUser._id });
    }, 1200);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    emitTyping();
    setShowCommands(val === "/" || val.startsWith("/") && !val.includes(" ") && val.length < 20);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageB64) return;

    socket?.emit("userStoppedTyping", { senderId: authUser._id, receiverId: selectedUser._id });
    setIsSending(true);

    try {
      if (editingMessage) {
        await editMessage(editingMessage._id, trimmed);
      } else {
        await sendMessage({ text: trimmed || undefined, image: imageB64 || undefined });
      }
      setText("");
      setImagePreview(null);
      setImageB64(null);
      setReplyingTo(null);
      setEditingMessage(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setIsSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") { setReplyingTo(null); setEditingMessage(null); setText(""); }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result); setImageB64(reader.result); };
    reader.readAsDataURL(file);
  };

  const applyCommand = (cmd) => { setText(cmd + " "); setShowCommands(false); textareaRef.current?.focus(); };

  const filteredCommands = text.startsWith("/")
    ? COMMANDS.filter(c => c.cmd.startsWith(text.split(" ")[0]))
    : COMMANDS;

  const canSend = (text.trim() || imageB64) && !isSending;

  return (
    <div className="flex-shrink-0 px-4 pb-5 pt-2" style={{ background: "var(--bg)" }}>

      {/* Reply / Edit bar */}
      {(replyingTo || editingMessage) && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 mb-2 rounded-2xl"
          style={{ background: "var(--s2)", border: "1px solid var(--border)" }}
        >
          <div className="flex-shrink-0 w-0.5 h-8 rounded-full" style={{ background: "#6D5DFC" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#6D5DFC" }}>
              {replyingTo
                ? `Reply to ${replyingTo.senderId === authUser._id ? "yourself" : "message"}`
                : "Editing message"}
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

      {/* Image preview */}
      {imagePreview && (
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-2xl"
          style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="relative">
            <img src={imagePreview} alt="preview" className="w-14 h-14 object-cover rounded-xl" />
            <button
              onClick={() => { setImagePreview(null); setImageB64(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full"
              style={{ background: "#EF4444" }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
          <p className="text-xs" style={{ color: "#71717A" }}>Image attached</p>
        </div>
      )}

      {/* Slash command picker */}
      {showCommands && (
        <div
          className="mb-2 rounded-2xl py-1.5 overflow-hidden animate-fade-up"
          style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        >
          {filteredCommands.map(({ cmd, desc }) => (
            <button key={cmd}
              onClick={() => applyCommand(cmd)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors group"
            >
              <code className="text-xs font-mono px-1.5 py-0.5 rounded-md" style={{ background: "#27272A", color: "#6D5DFC" }}>{cmd}</code>
              <span className="text-sm" style={{ color: "#A1A1AA" }}>{desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main composer */}
      <div className="composer">
        {/* Left actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 mb-0.5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()} className="icon-btn-sm" title="Attach">
            <Paperclip className="w-4 h-4" strokeWidth={1.8} />
          </button>

          {/* Emoji */}
          <div className="relative">
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="icon-btn-sm" title="Emoji">
              <Smile className="w-4 h-4" strokeWidth={1.8} />
            </button>
            {showEmoji && (
              <EmojiPicker
                onEmojiSelect={(emoji) => { setText(t => t + emoji); setShowEmoji(false); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder={editingMessage ? "Edit message…" : `Message ${selectedUser?.fullName?.split(" ")[0] || "…"}`}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: "var(--t1)",
            fontSize: 14,
            lineHeight: "22px",
            maxHeight: 144,
            overflowY: "auto",
            padding: "1px 0",
          }}
          className="placeholder-zinc-600"
        />

        {/* Right actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 mb-0.5">
          {!text && !imageB64 && (
            <button type="button" className="icon-btn-sm" title="Voice note">
              <Mic className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="send-btn"
            title={editingMessage ? "Save edit" : "Send"}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-2xs mt-2" style={{ color: "#3F3F46" }}>
        Press <kbd className="px-1 py-0.5 rounded text-2xs" style={{ background: "#27272A", color: "#71717A" }}>/</kbd> for commands · <kbd className="px-1 py-0.5 rounded text-2xs" style={{ background: "#27272A", color: "#71717A" }}>Shift+Enter</kbd> for newline
      </p>
    </div>
  );
});

export default MessageComposer;
