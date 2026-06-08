import './App.css'
import { useState, useEffect } from 'react'
import { io } from 'socket.io-client';
import MessageList from './components/MessageList.jsx';
import InputArea from './components/InputArea.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const socket = io(BACKEND_URL);

function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Generate/Retrieve persistent userId
    let id = localStorage.getItem('chat_userId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('chat_userId', id);
    }
    setUserId(id);

    // Fetching the previous messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/load-messages`);
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };
    fetchMessages();

    // Listening for connection confirmation
    socket.on("connect", () => {
      console.log("Connected to server. Socket ID:", socket.id);
    });

    // Listening for new messages from the server
    socket.on("chat message", (msg: { id: string, text: string }) => {
      setMessages((prevMessages) => [...prevMessages, { id: msg.id, text: msg.text }]);
    });

    // Cleanup function
    return () => {
      socket.off("chat message");
      socket.off("connect");
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white selection:text-black">
      <div className="flex flex-col w-full max-w-3xl mx-auto h-full bg-zinc-950 md:border-x md:border-zinc-900/80 shadow-2xl overflow-hidden">
        <header className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950 shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">chat_space</h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">status: active</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800/60">
              {userId || 'connecting...'}
            </span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-zinc-950">
          <MessageList messages={messages} userId={userId} />
        </div>
        
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0">
          <InputArea userId={userId} />
        </div>
      </div>
    </div>
  )
}

export default App;
