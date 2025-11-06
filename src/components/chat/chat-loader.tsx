"use client";

import React from 'react';

export const ChatLoader: React.FC = () => {
  return (
    <div className="flex items-end gap-3 justify-start">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a574] to-[#c89550] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">V</div>
      <div className="max-w-md lg:max-w-lg p-4 rounded-2xl bg-white border border-[#c4b5a0] rounded-bl-none">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  );
};
