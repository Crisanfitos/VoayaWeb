"use client";

interface ChatWelcomeProps {
    onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = ['París en mayo', 'Playa con familia', 'Escapada romántica', 'Aventura en Asia'];

export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-voaya-primary/20 to-indigo-500/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-voaya-primary text-4xl">flight_takeoff</span>
            </div>
            <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">
                ¡Hola! Soy tu asistente de viajes
            </h2>
            <p className="text-text-secondary dark:text-text-muted max-w-md">
                Cuéntame sobre tu próximo viaje. ¿A dónde te gustaría ir? ¿Cuándo? ¿Con quién?
            </p>

            <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {SUGGESTIONS.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-stroke dark:border-input-dark text-sm font-medium text-text-secondary dark:text-text-muted hover:border-voaya-primary hover:text-voaya-primary transition-colors shadow-sm"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}
