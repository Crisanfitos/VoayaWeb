"use server";

import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";
import { TravelBrief, TravelPlan, ChatMessage, GroundingAttribution } from '@/types';

export async function sendConversationToWebhook(brief: TravelBrief, webhookUrl = 'https://n8n.voaya.es/webhook-test/40e869f7-f18a-42e5-b16c-1b2e134660b8') {
    try {
        const params = new URLSearchParams();
        params.append('initialQuery', brief.initialQuery ?? '');
        params.append('chatHistory', JSON.stringify(brief.chatHistory.map((m: ChatMessage) => ({ role: m.role, text: m.text }))));
        params.append('createdAt', new Date().toISOString());

        const url = `${webhookUrl}?${params.toString()}`;
        const res = await fetch(url, { method: 'GET' });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('Webhook error', res.status, text);
            throw new Error(`Webhook responded with status ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await res.json();
        }
        return null;
    } catch (err) {
        console.error('Error sending conversation to webhook:', err);
        throw err;
    }
}

export const generatePlan = async (brief: TravelBrief, userLocation: GeolocationPosition | null): Promise<TravelPlan> => {
    try {
        await sendConversationToWebhook(brief);
    } catch (err) {
        console.warn('sendConversationToWebhook failed:', err);
    }

    const planGenerationModelName = 'gemini-1.5-pro';
    const serverGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const planGenerationModel = serverGenAI.getGenerativeModel({ model: planGenerationModelName, tools: [{ googleSearch: {} } as any] });


    const briefText = `Idea inicial: "${brief.initialQuery}".\n\nHistorial de la conversación:\n${brief.chatHistory.map((m: ChatMessage) => `${m.role}: ${m.text}`).join('\n')}`;

    const prompt = `
Eres "Cerebro IA", un planificador de viajes experto. Tu tarea es crear un itinerario de viaje completo basado en el siguiente resumen del usuario:\n${briefText}\n
DEBES usar tus herramientas googleSearch y googleMaps para recopilar información actualizada y del mundo real sobre vuelos, puntos de interés y logística.

Sigue estos pasos:
1.  **Vuelos:** Encuentra las 2-3 mejores opciones de vuelo. Incluye un precio aproximado, aerolínea/escalas y un enlace directo a una búsqueda de Google Flights pre-rellenada para que el usuario reserve.
2.  **Puntos de Interés (POIs):** Basado en los intereses del usuario, encuentra atracciones, actividades y lugares "imperdibles" relevantes.
3.  **Itinerario:** Crea un itinerario lógico, día por día. Para cada día, describe las actividades y calcula tiempos de viaje realistas entre ubicaciones. Sugiere tipos de alojamiento.
4.  **Enlace del Mapa:** Genera una URL de Google Maps que muestre la ruta con todos los POIs clave como puntos de referencia.

Tu resultado final DEBE ser un único objeto JSON encerrado en un bloque de código markdown (ej. 
\`\`\`json ... \`\`\`). No agregues ningún otro texto antes o después del bloque JSON. El objeto JSON debe seguir estrictamente este esquema:
{
  "summary": {
    "destination": "string",
    "dates": "string",
    "travelers": "string",
    "style": "string"
  },
  "flights": [
    {
      "type": "string (e.g., 'Best Value', 'Fastest')",
      "price": "string (e.g., '~€450')",
      "details": "string (e.g., 'KLM, 1 stop in Amsterdam')",
      "link": "string (URL)"
    }
  ],
  "mapUrl": "string (Google Maps URL with waypoints)",
  "itinerary": [
    {
      "day": "number",
      "title": "string",
      "morning": "string",
      "afternoon": "string",
      "evening": "string",
      "accommodation": "string (e.g., 'Suggested Hotel in Flåm')"
    }
  ]
}
`;

    try {
        const result: GenerateContentResult = await planGenerationModel.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch || !jsonMatch[1]) {
            throw new Error("Could not find a valid JSON block in the model's response.");
        }

        const parsedPlan = JSON.parse(jsonMatch[1]) as Omit<TravelPlan, 'groundingAttribution'>;

        const attributions: GroundingAttribution[] = response.candidates?.[0]?.citationMetadata?.citationSources.map((source: { uri?: string | null }) => ({
            uri: source.uri ?? '',
            title: '' // Title is not directly available in this structure
        })) || [];


        return { ...parsedPlan, groundingAttribution: attributions };

    } catch (error) {
        console.error("Error generating plan:", error);
        throw new Error("Failed to generate travel plan from the model.");
    }
};
