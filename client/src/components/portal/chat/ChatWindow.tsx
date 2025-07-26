import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplyButtons } from './QuickReplyButtons';
import { useChatMessages } from '../../../hooks/useChatMessages';

interface Props {
  threadId: string | null
  /** Called when your hook does a `POST /create_chats` and returns a new id */
  onThreadCreated: (id: string) => void
  onQuickAction: (action: string) => void
} 

export const ChatWindow: React.FC<{
  threadId: string | null
  onThreadCreated: (id: string) => void
  onQuickAction: (action: string) => void
}> = ({ threadId, onThreadCreated, onQuickAction }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, isTyping } =
  useChatMessages(threadId, onThreadCreated)


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (content: string, attachments?: File[]) => {
    sendMessage(content, attachments);
  };

  return (
    <div className=" flex flex-col h-screen bg-background pb-16">
      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        role="log"
        aria-label="Chat messages"
      >
        {messages.map((message, index) => (
          <div key={message.id} className="animate-fade-in">
            <MessageBubble message={message} />
            {message.quickReplies && (
              <QuickReplyButtons 
                options={message.quickReplies}
                onSelect={onQuickAction}
              />
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="animate-slide-in-bottom">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Chat Input */}
    <div className="border-t border-border bg-card pb-16 px-4 flex items-center">
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder="Ask me anything..."
        />
      </div>
    </div>
  );
};