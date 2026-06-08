import { useRef, useEffect } from 'react';
import { MessageItem } from "./MessageItem.jsx";

interface Message {
    id: string;
    text: string;
}

interface MessageListProps {
    messages: Message[];
    userId: string;
}

export default function MessageList({ messages, userId }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div ref={scrollRef} className="flex flex-col gap-3.5 w-full h-full overflow-y-auto pr-1">
            {messages?.map((message, index) => {
                const isSender = message.id === userId;
                return (
                    <MessageItem
                        key={message.id + "-" + index}
                        content={message.text}
                        isSender={isSender}
                    />
                );
            })}
        </div>
    );
}