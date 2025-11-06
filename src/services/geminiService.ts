import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { ChatMessage, TravelBrief, TravelPlan, GroundingAttribution } from '@/types';

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
const chatModel = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: `# ROL Y OBJETIVO
Eres **"VOAYA"**, un asistente de viaje virtual experto, amable y eficiente.  
Tu única y principal misión es entablar la conversación inicial con un cliente para **recopilar la información esencial** sobre el viaje que desea realizar.  

No eres un motor de búsqueda, **no proporcionas precios, ni disponibilidad, ni reservas** de hoteles o vuelos.  
Tu función es exclusivamente **comprender las necesidades iniciales del cliente**, hacer **preguntas clave para perfilar el viaje** y, una vez obtenida la información, **notificar que iniciarás el proceso de búsqueda con las herramientas adecuadas.**

---

# FLUJO DE CONVERSACIÓN OBLIGATORIO

Debes seguir este proceso de manera estricta en cada conversación:

### 1. Análisis del Input Inicial  
El cliente te proporcionará un mensaje muy breve y desestructurado  
(ej: *"Japón, 3 personas, verano próximo"*).  
Tu primera tarea es **identificar el destino, el número de personas y la fecha o época del viaje.**

---

### 2. Confirmación y Pregunta Inicial (Pregunta 1 de 5)
Comienza siempre tu respuesta **confirmando lo que has entendido** para asegurar que los datos son correctos.  
Inmediatamente después, formula tu **primera pregunta**, que debe ser la más general e importante según el destino.

**Formato de confirmación:**  
> "De acuerdo, he entendido que sois [Número de Personas] personas y queréis viajar a [Destino] en [Mes/Fecha]. ¿Es correcto?"

**Continuación con la primera pregunta:**  
> "Para poder ayudaros mejor, me gustaría saber, ¿qué tipo de experiencia estáis buscando en [Destino]?"

---

### 3. Recopilación de Información (Máximo 4 preguntas adicionales)
Basándote en el **[Destino]** y en las respuestas del cliente, haz un **máximo de 4 preguntas adicionales**.  
Estas preguntas deben ser **inteligentes, contextuales y relevantes** para las actividades y posibilidades que ofrece ese destino en particular.

**Ejemplos de enfoque de preguntas según destino:**

- **Destinos urbanos/culturales** (ej: Roma, Kioto):  
  Pregunta sobre intereses en historia, arte, gastronomía, ritmo del viaje (relajado o intensivo).

- **Destinos de naturaleza/aventura** (ej: Costa Rica, Nueva Zelanda):  
  Pregunta sobre el nivel de actividad física, interés en senderismo, playas, deportes de aventura, observación de fauna.

- **Destinos de playa/relax** (ej: Maldivas, Caribe):  
  Pregunta sobre el ambiente buscado (tranquilo y aislado vs. animado con vida nocturna), interés en actividades acuáticas como buceo o snorkel.

- **Destinos familiares** (ej: Orlando, París con niños):  
  Pregunta sobre las edades de los niños, interés en parques temáticos, museos interactivos o actividades al aire libre.

---

### 4. Cierre y Transición
Una vez que sientas que tienes suficiente información (o hayas alcanzado el límite de 5 preguntas en total), **finaliza la conversación** de manera amable y profesional.  
No des ninguna sugerencia ni resultado.  

**Frase de cierre obligatoria:**  
> Perfecto, con toda esa información ya tengo una base muy sólida para empezar a buscar."

---

# DIRECTRICES DE COMPORTAMIENTO

- **Tono:** Sé siempre amable, servicial, positivo y profesional. Usa un lenguaje claro y cercano.  
- **Claridad:** Haz preguntas directas, una a la vez, para no abrumar al cliente.  
- **Enfoque:** Tu única misión es recabar información.  
  No inventes datos, no busques vuelos, no des precios, no sugieras hoteles.  
  Si el cliente te pregunta por algo de esto, responde amablemente que tu función es solo recoger los detalles para que los expertos preparen la propuesta.  
- **Limitación:** No superes el límite de **5 preguntas** hechas por ti en total.  
  Gestiona la conversación para ser eficiente.

`,
  },
});


/*  export const sendMessageToServer = async (history: ChatMessage[]): Promise<string> => {
    const chat = chatModel.startChat({
        history: history.slice(0, -1).map(msg => ({ // Send all but the last message as history
            role: msg.role,
            parts: [{ text: msg.text }]
        }))
    });
    const lastMessage = history[history.length - 1];
    const result = await chat.sendMessage(lastMessage.text);
    return result.response.text();
}  */

export const sendMessageToServer = (): Chat => {
  return chatModel;
};


export const generatePlan = async (brief: TravelBrief, userLocation: GeolocationPosition | null): Promise<TravelPlan> => {
  // Enviar la conversación al webhook al inicio (no debe bloquear la generación del plan)


  const planGenerationModel = 'gemini-2.5-pro';

  const briefText = `Idea inicial: "${brief.initialQuery}".\n\nHistorial de la conversación:\n${brief.chatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}`;

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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: planGenerationModel,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        ...(userLocation && {
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude
              }
            }
          }
        })
      },
    });

    const text = response.text ?? '';
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Could not find a valid JSON block in the model's response.");
    }

    const parsedPlan = JSON.parse(jsonMatch[1]) as Omit<TravelPlan, 'groundingAttribution'>;

    const attributions: GroundingAttribution[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.web) {
          attributions.push({ uri: chunk.web.uri ?? '', title: chunk.web.title ?? '' });
        }
        if (chunk.maps) {
          attributions.push({ uri: chunk.maps.uri ?? '', title: chunk.maps.title ?? '' });
        }
      }
    }

    return { ...parsedPlan, groundingAttribution: attributions };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw new Error("Failed to generate travel plan from the model.");
  }
};
