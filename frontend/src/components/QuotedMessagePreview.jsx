function QuotedMessagePreview({ message, authUser }) {
  if (!message) return null;

  const isSenderMe = message.senderId === authUser._id;

  return (
    <div className={`px-3 py-2 rounded-lg mb-1 text-xs border-l-4 ${
      isSenderMe
        ? "bg-cyan-700/20 border-cyan-500 text-cyan-200"
        : "bg-slate-600/20 border-slate-400 text-slate-300"
    }`}>
      <p className="font-semibold opacity-75">{isSenderMe ? "You" : "..."}</p>
      <p className="truncate opacity-80">{message.text || "📷 Image"}</p>
    </div>
  );
}

export default QuotedMessagePreview;
