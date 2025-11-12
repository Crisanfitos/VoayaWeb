'use server';

import { ChatMessage } from '@/types';

interface ProcessResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function processAndSendData(
  history: ChatMessage[],
  category: 'flights' | 'hotels' | 'experiences'
): Promise<ProcessResult> {

  switch (category) {
    case 'flights':
      try {
        // Enviar el historial del chat al webhook de n8n para extracción de datos
        console.log("Enviando historial del chat a n8n para extracción...");

        const webhookUrl = 'https://n8n.voaya.es/webhook/flight-search';
        console.log(`Enviando datos a ${webhookUrl}...`);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatHistory: history,
            category: 'flights',
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error del webhook: ${response.status} ${response.statusText}`, errorBody);
          return { success: false, message: `El servidor de Voaya respondió con un error: ${response.statusText}` };
        }

        const responseData = await response.json();
        console.log("Respuesta del webhook:", responseData);

        return { success: true, message: "¡Búsqueda de vuelos iniciada con éxito!", data: responseData };

      } catch (error) {
        console.error("Error procesando la solicitud de vuelos:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        return { success: false, message: `Error interno: ${errorMessage}` };
      }

    case 'hotels':
      // TODO: Implementar lógica para hoteles
      console.log("Procesamiento para 'hoteles' aún no implementado.");
      return { success: false, message: "La categoría 'hoteles' aún no está implementada." };

    case 'experiences':
      // TODO: Implementar lógica para experiencias
      console.log("Procesamiento para 'experiencias' aún no implementado.");
      return { success: false, message: "La categoría 'experiencias' aún no está implementada." };

    default:
      console.warn(`Categoría desconocida: ${category}`);
      return { success: false, message: `La categoría '${category}' no es válida.` };
  }
}
