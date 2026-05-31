import { SmileIcon, XIcon } from "lucide-react";
import { useState } from "react";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "🤪", "😝", "😑", "😐", "😶", "😏", "😒", "🙄",
  "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷",
  "🤒", "🤕", "🤢", "🤮", "🤮", "🤐", "😯", "😦",
  "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖",
  "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡",
  "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡",
  "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸",
  "😹", "😻", "😼", "😽", "😾", "😿", "🙀", "👋",
  "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️",
  "🤞", "🫰", "🤟", "🤘", "🤙", "👍", "👎", "👊",
  "👊", "✊", "👏", "🙌", "👐", "🤲", "🤝", "🤜",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💘",
];

function EmojiPicker({ onEmojiSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filteredEmojis = EMOJIS.filter((emoji) => {
    // Basic search by index for demo
    return true;
  });

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-2xl p-4 z-50 w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Emojis</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="text-2xl hover:bg-slate-700 rounded p-1 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
