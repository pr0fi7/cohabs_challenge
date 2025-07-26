import React from 'react';
import { cn } from '../../../lib/utils';
import { User, Bot } from 'lucide-react';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  attachments?: { url: string; name: string; type: string }[];
  quickReplies?: { label: string; action: string }[];
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div 
      className={cn(
        "flex items-start gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {/* Avatar */}
      <div 
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div 
        className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-chat-user-bg text-chat-user-text rounded-br-md" 
            : "bg-chat-bot-bg text-chat-bot-text rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-xs",
                  isUser 
                    ? "bg-white/20" 
                    : "bg-black/5"
                )}
              >
                <span className="font-medium">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div 
          className={cn(
            "text-xs mt-2 opacity-70",
            isUser ? "text-right" : "text-left"
          )}
        >
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};