"use client";

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a574] to-[#c89550] flex items-center justify-center text-[#f5f0e8] font-bold text-lg flex-shrink-0">V</div>
      )}
      <div className={`max-w-md lg:max-w-lg p-4 rounded-2xl ${isUser ? 'bg-[#c89550] text-[#f5f0e8] rounded-br-none' : 'bg-white text-[#3d3d3d] border border-[#c4b5a0] rounded-bl-none'}`}>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};
