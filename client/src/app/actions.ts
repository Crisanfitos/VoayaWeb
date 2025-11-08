'use server';

import { firebaseConfig } from '@/firebase/config';
import { genkit, } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { extractFlightDataFlow } from '../../../src/ai/flows/extract-flight-data-flow';
import { ChatMessage } from '@/types';

interface ProcessResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function getModelInfo() {
  const result = await new Promise((resolve) => {
    genkit({
      plugins: [
        googleAI({ "apiKey": firebaseConfig.apiKey }),
      ],
      logLevel: 'debug',
      enableTracing: true,
    });
    resolve("Doesn't work");
  });
  return result;
}

export async function processAndSendData(
  history: ChatMessage[],
  category: 'flights' | 'hotels' | 'experiences'
): Promise<ProcessResult> {

  switch (category) {
    case 'flights':
      try {
        // 1. Llamar al flujo de IA para extraer los datos
        console.log("Iniciando extracción de datos de vuelos...");
        const flightData = await extractFlightDataFlow({ history });
        console.log("Datos extraídos:", flightData);

        // Validar que los datos obligatorios se han extraído
        if (
          !flightData.departure_id || flightData.departure_id === 'NOT_FOUND' ||
          !flightData.arrival_id || flightData.arrival_id === 'NOT_FOUND' ||
          !flightData.outbound_date || flightData.outbound_date === 'NOT_FOUND'
        ) {
          return { success: false, message: "No se pudo extraer la información obligatoria (origen, destino o fecha) de la conversación." };
        }

        // 2. Enviar los datos al webhook
        const webhookUrl = 'https://n8n.voaya.es/webhook/flight-search';
        console.log(`Enviando datos a ${webhookUrl}...`);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(flightData),
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
