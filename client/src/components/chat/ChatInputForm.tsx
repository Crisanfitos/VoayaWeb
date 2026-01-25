"use client";

import React, { useRef, useEffect } from 'react';

interface ChatInputFormProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isChatComplete: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onRestart: () => void;
    onConfirm: () => void;
}

export function ChatInputForm({
    input,
    setInput,
    isLoading,
    isChatComplete,
    onSubmit,
    onRestart,
    onConfirm
}: ChatInputFormProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isChatComplete && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isChatComplete]);

    if (isChatComplete) {
        return (
            <div className="sticky bottom-0 bg-white dark:bg-surface-dark border-t border-stroke dark:border-input-dark px-4 md:px-8 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={onRestart}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-input-dark text-text-main dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Reiniciar Chat
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-voaya-primary text-white font-semibold hover:bg-voaya-primary-dark transition-colors shadow-lg shadow-voaya-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                            )}
                            {isLoading ? 'Procesando...' : 'Confirmar y Buscar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky bottom-0 bg-white dark:bg-surface-dark border-t border-stroke dark:border-input-dark px-4 md:px-8 py-4">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={onSubmit} className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            className="w-full px-5 py-3.5 pr-12 bg-gray-100 dark:bg-input-dark text-text-main dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-voaya-primary focus:bg-white dark:focus:bg-surface-dark transition-all placeholder:text-text-muted"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-voaya-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">mood</span>
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="flex-shrink-0 p-3.5 rounded-xl bg-voaya-primary text-white hover:bg-voaya-primary-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
