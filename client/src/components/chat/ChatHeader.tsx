"use client";

import Link from 'next/link';

interface ChatHeaderProps {
    isLoading: boolean;
}

export function ChatHeader({ isLoading }: ChatHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-stroke dark:border-input-dark px-4 md:px-8 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/chats" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-input-dark transition-colors">
                        <span className="material-symbols-outlined text-text-secondary dark:text-text-muted">arrow_back</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-voaya-primary to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text-main dark:text-white">Voaya AI</h1>
                            <p className="text-xs text-text-secondary dark:text-text-muted flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                {isLoading ? 'Escribiendo...' : 'En línea'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-input-dark transition-colors text-text-secondary dark:text-text-muted">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
