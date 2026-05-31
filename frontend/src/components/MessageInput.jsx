import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { 
  Image, 
  Send, 
  X, 
  Smile, 
  Edit2,
  Loader,
  Zap 
} from "lucide-react";
import EmojiPicker from "./EmojiPicker";

const MessageInput = forwardRef(function MessageInput(props, ref) {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { 
    sendMessage, 
    isSoundEnabled, 
    selectedUser,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const socket = useAuthStore((state) => state.socket);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setInputText: (text) => setText(text),
  }));

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (isSoundEnabled) playRandomKeyStrokeSound();

    if (socket && selectedUser) {
      socket.emit("userTyping", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedUser) {
        socket.emit("userStoppedTyping", {
          senderId: authUser._id,
          receiverId: selectedUser._id,
        });
      }
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    setIsSending(true);

    // Stop typing indicator
    if (socket && selectedUser) {
      socket.emit("userStoppedTyping", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });
    }

    try {
      if (editingMessage) {
        await editMessage(editingMessage._id, text.trim());
      } else {
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
        });
      }
      
      setText("");
      setImagePreview("");
      setReplyingTo(null);
      setEditingMessage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
  };

  const isDisabled = isSending || (!text.trim() && !imagePreview);

  return (
    <div className="flex-shrink-0 bg-surface-secondary border-t border-divider w-full">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-3 border-b border-divider bg-surface-tertiary/50 flex items-center justify-between group">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-secondary mb-1">
              ↳ Replying to {replyingTo.senderId === authUser._id ? "yourself" : "message"}
            </div>
            <p className="text-sm text-primary truncate">
              {replyingTo.text || (replyingTo.image ? "📷 Image" : "Audio")}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="btn-icon-sm text-tertiary hover:text-primary ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Indicator */}
      {editingMessage && (
        <div className="px-4 py-3 border-b border-brand-500/30 bg-brand-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-brand-400" />
            <div className="text-sm text-brand-300 font-medium">Editing message...</div>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText("");
            }}
            className="btn-icon-sm text-tertiary hover:text-brand-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-3 border-b border-divider flex items-center gap-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg border border-divider"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-sm text-tertiary">Image attached</div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4">
        <div className="flex items-end gap-3">
          {/* Input field */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-tertiary border border-divider rounded-lg hover:border-divider/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all duration-200">
              {/* Emoji picker */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="btn-icon-sm text-tertiary hover:text-primary"
                  title="Emoji picker"
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>

              {/* Text input */}
              <textarea
                value={text}
                onChange={handleTyping}
                ref={textareaRef}
                className="flex-1 bg-transparent text-primary placeholder-tertiary focus:outline-none resize-none max-h-24 text-base"
                placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                rows="1"
                style={{
                  height: Math.min(Math.max(textareaRef.current?.scrollHeight || 24, 24), 96) + "px",
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Attach image */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`btn-icon text-tertiary hover:text-primary hover:bg-surface-tertiary/50 transition-all ${
                imagePreview ? "text-brand-400 bg-brand-500/10" : ""
              }`}
              title="Attach image"
            >
              <Image className="w-5 h-5" />
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={isDisabled}
              className={`btn-icon flex-shrink-0 ${
                isDisabled
                  ? "text-tertiary cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-lg hover:shadow-brand-500/30 hover:scale-105 active:scale-95"
              } transition-all duration-200`}
              title={editingMessage ? "Update message" : "Send message"}
            >
              {isSending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* AI Assist hint */}
        <div className="mt-2 flex items-center gap-2 text-xs text-tertiary px-2">
          <Zap className="w-3 h-3 text-brand-400" />
          <span>Press Cmd+K for AI assist</span>
        </div>
      </form>
    </div>
  );
});

MessageInput.displayName = "MessageInput";
export default MessageInput;
