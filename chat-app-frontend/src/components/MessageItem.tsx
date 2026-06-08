export const MessageItem = ({ content, isSender }: { content: string, isSender: boolean }) => {
  return (
    <div className={`flex w-full ${isSender ? "justify-end" : "justify-start"}`}>
      <div 
        className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed break-words shadow-sm ${
          isSender 
            ? "bg-zinc-800 border border-zinc-700/40 text-zinc-100 rounded-tr-sm" 
            : "bg-zinc-900 border border-zinc-900 text-zinc-300 rounded-tl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
};
