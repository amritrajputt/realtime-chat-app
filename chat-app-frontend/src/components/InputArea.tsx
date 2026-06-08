import { useState } from 'react';
import { socket } from "../App.jsx";

interface InputAreaProps {
  userId: string;
}

export default function InputArea({ userId }: InputAreaProps) {
  const [msg, setMsg] = useState("");

  const handleSend = () => {
    if (msg.trim() === "") return;
    socket.emit("chat message", { id: userId, text: msg.trim() });
    setMsg("");
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <input 
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
        placeholder="Type a message..." 
        className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 transition-all duration-200"
      />

      <button
        onClick={handleSend}
        className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/40 text-zinc-200 rounded-2xl text-sm font-medium tracking-wide shadow-sm active:scale-95 transition-all duration-150 shrink-0 cursor-pointer"
      >
        Send
      </button>
    </div>
  );
}
