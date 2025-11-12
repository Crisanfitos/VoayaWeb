import { Timestamp } from 'firebase/firestore';

export type ChatStatus = 'active' | 'completed' | 'archived';
export type MessageRole = 'user' | 'assistant';
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
    createdAt: Timestamp;
    title: string;
    status: ChatStatus;
    categories: ChatCategory[];
    lastMessageAt: Timestamp;
    metadata: ChatMetadata;
}

export interface Message {
    id: string;
    chatId: string;
    role: MessageRole;
    text: string;
    createdAt: Timestamp;
    userId?: string | null;
}

export interface ChatInstance {
    id: string;
    geminiChat: any; // Tipo específico de Gemini
    metadata: ChatMetadata;
}