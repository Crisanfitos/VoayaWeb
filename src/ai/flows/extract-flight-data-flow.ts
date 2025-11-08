'use server';
import { ai } from '../genkit';
import { z } from 'zod';
import {
    ExtractFlightDataInputSchema,
    FlightDataSchema,
    ExtractFlightDataInput,
    FlightData,
} from './extract-flight-data-schema';

// Definición del prompt de extracción
const extractionPrompt = ai.definePrompt({
    name: 'flightDataExtractorPrompt',
    input: { schema: ExtractFlightDataInputSchema },
    output: { schema: FlightDataSchema },
    prompt: `Eres un agente de extracción de datos altamente preciso. Tu única tarea es analizar el siguiente historial de conversación y extraer la información para una búsqueda de vuelos en un objeto JSON.

Sigue estas reglas estrictamente:
1.  Extrae los valores para los campos definidos en el esquema de salida.
2.  Para 'departure_id' y 'arrival_id', DEBES proporcionar el código IATA de 3 letras. Si el usuario menciona una ciudad, infiere el aeropuerto principal (ej: "París" -> "CDG").
3.  Para 'outbound_date' y 'return_date', formatea siempre como YYYY-MM-DD.
4.  Si un dato opcional no se menciona en la conversación, no lo incluyas en el JSON final.
5.  No inventes información. Si un dato obligatorio no está presente, indícalo como "NOT_FOUND".

Historial de la conversación:
{{#each history}}
- {{role}}: {{text}}
{{/each}}
`,
});

// Definición del flujo de Genkit
export const extractFlightDataFlow = ai.defineFlow(
    {
        name: 'extractFlightDataFlow',
        inputSchema: ExtractFlightDataInputSchema,
        outputSchema: FlightDataSchema,
    },
    async (input: ExtractFlightDataInput): Promise<FlightData> => {
        const { output } = await extractionPrompt(input);
        if (!output) {
            throw new Error("No se pudo extraer la información de vuelos de la conversación.");
        }
        return output;
    }
);
