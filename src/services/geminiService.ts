'use server';

import { GoogleGenAI, ChatSession, GenerateContentResponse, Content } from "@google/genai";
import { TravelBrief, TravelPlan, ChatMessage, GroundingAttribution } from '../types';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const genAI = new GoogleGenAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: {
    role: "system",
    parts: [{text: `# ROL Y OBJETIVO
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
> "Perfecto, con toda esa información ya tengo una base muy sólida para empezar a buscar."

---

# DIRECTRICES DE COMPORTAMIENTO

- **Tono:** Sé siempre amable, servicial, positivo y profesional. Usa un lenguaje claro y cercano.  
- **Claridad:** Haz preguntas directas, una a la vez, para no abrumar al cliente.  
- **Enfoque:** Tu única misión es recabar información.  
  No inventes datos, no busques vuelos, no des precios, no sugieras hoteles.  
  Si el cliente te pregunta por algo de esto, responde amablemente que tu función es solo recoger los detalles para que los expertos preparen la propuesta.  
- **Limitación:** No superes el límite de **5 preguntas** hechas por ti en total.  
  Gestiona la conversación para ser eficiente.
`}]
  },
});

export const startChatSession = (history: Content[]): ChatSession => {
  return model.startChat({ history });
};

/**
 * Envía los datos de la conversación al webhook de n8n
 * Payload estructurado: { initialQuery, chatHistory: [{role,text}], createdAt }
 * Devuelve la respuesta JSON del webhook si la hay, o null.
 */
export async function sendConversationToWebhook(brief: TravelBrief, webhookUrl = 'https://n8n.voaya.es/webhook-test/40e869f7-f18a-42e5-b16c-1b2e134660b8') {
  try {
    // Construir parámetros de consulta con el payload serializado
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
  // Enviar la conversación al webhook al inicio (no debe bloquear la generación del plan)
  try {
    await sendConversationToWebhook(brief);
  } catch (err) {
    console.warn('sendConversationToWebhook failed:', err);
  }

  const planGenerationModelName = 'gemini-1.5-pro';
  const planGenerationModel = genAI.getGenerativeModel({model: planGenerationModelName, tools: [{googleSearch: {}}]});

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
    const result: GenerateContentResponse = await planGenerationModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Could not find a valid JSON block in the model's response.");
    }

    const parsedPlan = JSON.parse(jsonMatch[1]) as Omit<TravelPlan, 'groundingAttribution'>;
    
    const attributions: GroundingAttribution[] = response.candidates?.[0]?.citationMetadata?.citationSources.map(source => ({
        uri: source.uri ?? '',
        title: '' // Title is not directly available in this structure
    })) || [];


    return { ...parsedPlan, groundingAttribution: attributions };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw new Error("Failed to generate travel plan from the model.");
  }
};
