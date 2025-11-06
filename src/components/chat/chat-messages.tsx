"use client";

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types';
import { ChatMessage } from './chat-message';
import { ChatLoader } from './chat-loader';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export const ChatMessages = React.forwardRef<HTMLDivElement, ChatMessagesProps>(({ messages, isLoading }, ref) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={msg} />
      ))}
      {isLoading && <ChatLoader />}
      <div ref={ref} />
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';
