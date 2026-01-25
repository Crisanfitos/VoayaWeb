"use client";

export function TypingIndicator() {
    return (
        <div className="flex items-end gap-3 justify-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voaya-primary to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
            </div>
            <div className="px-5 py-4 rounded-2xl bg-white dark:bg-surface-dark shadow-md border border-stroke/50 dark:border-input-dark rounded-bl-md">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-voaya-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-voaya-primary animate-bounce [animation-delay:0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-voaya-primary animate-bounce [animation-delay:0.3s]"></div>
                </div>
            </div>
        </div>
    );
}
