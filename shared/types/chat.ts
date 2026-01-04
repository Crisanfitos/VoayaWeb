export type ChatStatus = 'active' | 'completed' | 'archived';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ChatCategory = 'flights' | 'hotels' | 'experiences';

export interface ChatMetadata {
    destination?: string;
    dates?: {
        start?: string; // ISO date
        end?: string;   // ISO date
    };
    travelers?: number;
    preferences?: Record<string, any>;
    [key: string]: any;
}

export interface Chat {
    id: string;
    userId: string | null;
    createdAt: string; // ISO date string
    title: string;
    status: ChatStatus;
    categories: ChatCategory[];
    lastMessageAt: string; // ISO date string
    metadata: ChatMetadata;
}

export interface Message {
    id: string;
    chatId: string;
    role: MessageRole;
    text: string;
    createdAt: string; // ISO date string
    userId?: string | null;
}

export interface ChatInstance {
    id: string;
    geminiChat: any; // Tipo específico de Gemini
    metadata: ChatMetadata;
}