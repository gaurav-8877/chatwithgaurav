function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">typing</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
