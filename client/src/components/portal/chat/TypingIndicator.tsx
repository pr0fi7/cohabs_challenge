import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div 
      className="flex items-start gap-3 max-w-[85%] mr-auto"
      role="status"
      aria-label="Assistant is typing"
    >
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>

      {/* Typing Animation */}
      <div className="bg-chat-bot-bg text-chat-bot-text rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 bg-current rounded-full opacity-60 animate-typing"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-2 h-2 bg-current rounded-full opacity-60 animate-typing"
              style={{ animationDelay: '200ms' }}
            />
            <div 
              className="w-2 h-2 bg-current rounded-full opacity-60 animate-typing"
              style={{ animationDelay: '400ms' }}
            />
          </div>
          <span className="text-xs ml-2 opacity-70">typing...</span>
        </div>
      </div>
    </div>
  );
};