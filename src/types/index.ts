export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface TravelBrief {
  initialQuery: string;
  chatHistory: ChatMessage[];
}

export interface GroundingAttribution {
  uri: string;
  title: string;
}

export interface TravelPlan {
  summary: {
    destination: string;
    dates: string;
    travelers: string;

    style: string;
  };
  flights: {
    type: string;
    price: string;
    details: string;
    link: string;
  }[];
  mapUrl: string;
  itinerary: {
    day: number;
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    accommodation: string;
  }[];
  groundingAttribution: GroundingAttribution[];
}
