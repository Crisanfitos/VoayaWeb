"use client";

import React from 'react';

interface ChatCompletionControlsProps {
  onRestart: () => void;
  onConfirm: () => void;
}

export const ChatCompletionControls: React.FC<ChatCompletionControlsProps> = ({ onRestart, onConfirm }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onRestart}
        className="px-6 py-3 rounded-full bg-[#f5f0e8] border border-[#c89550] text-[#c89550] font-semibold hover:bg-[#c89550] hover:text-[#f5f0e8] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c89550]">
        Reiniciar Chat
      </button>
      <button
        onClick={onConfirm}
        className="px-8 py-3 rounded-full bg-[#c89550] text-[#f5f0e8] font-semibold hover:bg-[#d4a574] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c89550]">
        Confirmar y Buscar
      </button>
    </div>
  );
};
