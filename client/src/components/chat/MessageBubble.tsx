"use client";

import { ChatMessage } from '@/types';

interface MessageBubbleProps {
    message: ChatMessage & { id: string };
    formatTime: (date?: Date) => string;
}

export function MessageBubble({ message, formatTime }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Assistant Avatar */}
            {!isUser && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voaya-primary to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
            )}

            {/* Message Bubble */}
            <div
                className={`
          max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl
          ${isUser
                        ? 'bg-voaya-primary text-white rounded-br-md shadow-lg shadow-voaya-primary/20'
                        : 'bg-white dark:bg-surface-dark text-text-main dark:text-white rounded-bl-md shadow-md border border-stroke/50 dark:border-input-dark'
                    }
        `}
            >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className={`text-[10px] mt-1.5 ${isUser ? 'text-white/60' : 'text-text-muted'}`}>
                    {formatTime()}
                </p>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-input-dark flex items-center justify-center text-text-secondary dark:text-text-muted flex-shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-lg">person</span>
                </div>
            )}
        </div>
    );
}
