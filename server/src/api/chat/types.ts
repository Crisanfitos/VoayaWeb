/**
 * Types for Chat API
 */

export interface FlightOptions {
    luggageType: 'hand_only' | 'hand_and_hold' | null;
    directFlightsOnly: boolean;
    budgetClass: 'economy' | 'first_class' | null;
    departureDate: string | null;
    returnDate: string | null;
    oneWayOnly: boolean;
}

export interface StartChatRequest {
    userId: string;
    categories?: string[];
    flightOptions?: FlightOptions | null;
}

export interface MessageRequest {
    chatId?: string;
    text: string;
    userId: string;
    role?: 'user' | 'assistant' | 'system';
}

export interface CompleteChatRequest {
    chatId: string;
    forceRewrite?: boolean;
}
