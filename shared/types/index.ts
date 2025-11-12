import { Timestamp } from 'firebase/firestore';

// Tipos de chat
export type ChatStatus = 'active' | 'completed' | 'archived';
export type MessageRole = 'user' | 'assistant';
export type ChatCategory = 'flights' | 'hotels' | 'experiences';

// ChatMetadata será un map flexible: los metadatos serán proporcionados por un agente
// externo (webhook) y pueden contener formatos diversos. Dejamos campos convenientes
// pero el tipo principal es un Record<string, any> para no limitar el agente.
export interface ChatMetadata {
    // Campos opcionales de conveniencia (pueden estar ausentes)
    destination?: string;
    dates?: {
        start?: string; // ISO date string
        end?: string;   // ISO date string
    };
    travelers?: number;
    preferences?: Record<string, any>;
    // Datos arbitrarios devueltos por el agente
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

// Eliminamos MessageMetadata: no lo usaremos en el cliente/servidor.
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

// Tipos de viaje
export interface ChatMessage {
    role: MessageRole;
    text: string;
}

export interface TravelBrief {
    initialQuery: string;
    chatHistory: ChatMessage[];
}

export interface TravelPlan {
    summary: {
        destination: string;
        dates: string;
        travelers: string;
        style: string;
    };
    flights: Array<{
        type: string;
        price: string;
        details: string;
        link: string;
    }>;
    mapUrl: string;
    itinerary: Array<{
        day: number;
        title: string;
        morning: string;
        afternoon: string;
        evening: string;
        accommodation: string;
    }>;
    groundingAttribution: GroundingAttribution[];
}

export interface GroundingAttribution {
    uri: string;
    title: string;
}