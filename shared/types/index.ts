// Tipos compartidos entre cliente y servidor
export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export interface TravelBrief {
    initialQuery?: string;
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