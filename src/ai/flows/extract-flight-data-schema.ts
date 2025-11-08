import { z } from 'zod';

// Esquema Zod para la entrada del flujo (historial de chat)
const ChatHistorySchema = z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
});

export const ExtractFlightDataInputSchema = z.object({
    history: z.array(ChatHistorySchema).describe('El historial de la conversación para analizar.'),
});

// Esquema Zod para la salida del flujo (el JSON de vuelos)
export const FlightDataSchema = z.object({
    departure_id: z.string().describe("Código IATA del aeropuerto de salida (Ej: 'MAD')."),
    arrival_id: z.string().describe("Código IATA del aeropuerto de destino (Ej: 'BCN')."),
    outbound_date: z.string().describe("Fecha de salida en formato YYYY-MM-DD (Ej: '2025-12-15')."),
    return_date: z.string().optional().describe("Fecha de regreso en formato YYYY-MM-DD. Omitir si es solo ida."),
    adults: z.number().optional().default(1),
    children: z.number().optional().default(0),
    infant_in_seat: z.number().optional().default(0),
    infant_on_lap: z.number().optional().default(0),
    travel_class: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional().default("ECONOMY"),
    currency: z.string().optional().default("USD"),
    language_code: z.string().optional().default("en-US"),
    country_code: z.string().optional().default("US"),
    show_hidden: z.number().min(0).max(1).optional().default(0),
});

export type ExtractFlightDataInput = z.infer<typeof ExtractFlightDataInputSchema>;
export type FlightData = z.infer<typeof FlightDataSchema>;
