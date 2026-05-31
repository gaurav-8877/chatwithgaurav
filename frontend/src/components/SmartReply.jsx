import { generateSmartReplies } from "../lib/smartReply";

function SmartReply({ message, onSelectReply }) {
  if (!message || !message.text || message.deletedForEveryone) {
    return null;
  }

  const suggestions = generateSmartReplies(message.text);

  return (
    <div className="flex flex-wrap gap-2 mt-2 ml-2 animate-fade-in">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelectReply(suggestion)}
          className="px-3 py-1.5 text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full transition-all duration-150 hover:shadow-md active:scale-95"
          title={suggestion}
        >
          {suggestion.length > 20 ? suggestion.substring(0, 20) + '...' : suggestion}
        </button>
      ))}
    </div>
  );
}

export default SmartReply;
