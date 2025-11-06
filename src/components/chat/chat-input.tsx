"use client";

import React from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., París, 2 personas, Mayo..."
        className="flex-1 w-full px-4 py-3 bg-white border border-[#c4b5a0] text-[#3d3d3d] rounded-full focus:outline-none focus:ring-2 focus:ring-[#c89550] transition placeholder-[#6b5d4f]"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-[#c89550] text-[#f5f0e8] hover:bg-[#d4a574] disabled:bg-[#c4b5a0] disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c89550]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </form>
  );
};
