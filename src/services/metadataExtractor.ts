import { ChatMetadata, MessageMetadata } from '@/shared/types';
import { Timestamp } from 'firebase/firestore';

interface ExtractedData {
    chatMetadata: Partial<ChatMetadata>;
    messageMetadata: MessageMetadata;
}

export class MetadataExtractor {
    private static datePatterns = {
        simple: /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
        monthYear: /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})\b/gi,
        relativeDate: /\b(próximo|siguiente|este)\s+(mes|año|semana)\b/gi
    };

    private static locationPatterns = {
        cities: /\b(?:en|a|desde|para|hacia)\s+([A-ZÁ-Úa-zá-ú\s]+?)(?=\s+(?:el|la|los|las|para|en|por|y|,|\.|$)|$)/g,
        fromTo: /\bde\s+([A-ZÁ-Úa-zá-ú\s]+?)\s+a\s+([A-ZÁ-Úa-zá-ú\s]+?)(?=\s+|$)/g
    };

    private static travelersPattern = /\b(\d+)\s+(?:persona|personas|viajero|viajeros|adulto|adultos|pasajero|pasajeros)\b/gi;

    public static extract(text: string): ExtractedData {
        const chatMetadata: Partial<ChatMetadata> = {};
        const messageMetadata: MessageMetadata = {
            intent: this.extractIntent(text),
            entities: this.extractEntities(text),
            context: {}
        };

        // Extraer fechas
        const dates = this.extractDates(text);
        if (dates.length > 0) {
            chatMetadata.dates = {
                start: Timestamp.fromDate(dates[0]),
                ...(dates[1] && { end: Timestamp.fromDate(dates[1]) })
            };
        }

        // Extraer destino
        const destinations = this.extractDestinations(text);
        if (destinations.length > 0) {
            chatMetadata.destination = destinations[0];
        }

        // Extraer número de viajeros
        const travelers = this.extractTravelers(text);
        if (travelers !== null) {
            chatMetadata.travelers = travelers;
        }

        return {
            chatMetadata,
            messageMetadata
        };
    }

    private static extractIntent(text: string): string {
        // Patrones básicos de intención
        const patterns = [
            { pattern: /(?:busco|buscar?|encontrar?|quiero?|necesito?)\s+(?:un\s+)?(?:vuelos?|billete|pasaje|viajar)/i, intent: 'search_flight' },
            { pattern: /\b(?:vuelo)\b/i, intent: 'search_flight' },
            { pattern: /(?:busco|buscar?|encontrar?|quiero?|necesito?)\s+(?:un\s+)?(?:hoteles?|alojamiento|habitación)/i, intent: 'search_hotel' },
            { pattern: /(?:qué|que|cuál|cual)\s+(?:hacer|visitar|ver)/i, intent: 'search_activities' },
            { pattern: /(?:reservar?|comprar?|contratar?)/i, intent: 'booking' }
        ];

        for (const { pattern, intent } of patterns) {
            if (pattern.test(text)) {
                return intent;
            }
        }

        return 'general_query';
    }

    private static extractDates(text: string): Date[] {
        const dates: Date[] = [];

        // Buscar fechas en formato numérico (DD/MM/YYYY)
        const numericMatches = text.match(this.datePatterns.simple) || [];
        for (const match of numericMatches) {
            const [day, month, year] = match.split(/[-\/]/).map(num => parseInt(num));
            if (day && month && year) {
                dates.push(new Date(year, month - 1, day));
            }
        }

        // Buscar fechas en formato texto
        const monthYearMatches = Array.from(text.matchAll(this.datePatterns.monthYear));
        for (const match of monthYearMatches) {
            const month = this.getMonthNumber(match[1]);
            const year = parseInt(match[2]);
            if (month && year) {
                dates.push(new Date(year, month - 1));
            }
        }

        return dates;
    }

    private static extractDestinations(text: string): string[] {
        const destinations: Set<string> = new Set();

        // Buscar ciudades mencionadas después de preposiciones
        const cityMatches = Array.from(text.matchAll(this.locationPatterns.cities));
        for (const match of cityMatches) {
            if (match[1]) {
                destinations.add(match[1].trim());
            }
        }

        // Buscar patrones "de X a Y"
        const fromToMatches = Array.from(text.matchAll(this.locationPatterns.fromTo));
        for (const match of fromToMatches) {
            if (match[1]) destinations.add(match[1].trim());
            if (match[2]) destinations.add(match[2].trim());
        }

        return Array.from(destinations);
    }

    private static extractTravelers(text: string): number | null {
        const matches = Array.from(text.matchAll(this.travelersPattern));
        if (matches.length > 0) {
            return parseInt(matches[0][1]);
        }
        return null;
    }

    private static extractEntities(text: string): Record<string, any> {
        const entities: Record<string, any> = {};

        // Extraer localizaciones
        const locations = this.extractDestinations(text);
        if (locations.length > 0) {
            entities.locations = locations;
        }

        // Extraer fechas
        const dates = this.extractDates(text);
        if (dates.length > 0) {
            entities.dates = dates;
        }

        // Extraer número de viajeros
        const travelers = this.extractTravelers(text);
        if (travelers !== null) {
            entities.travelers = travelers;
        }

        return entities;
    }

    private static getMonthNumber(monthName: string): number | null {
        const months: Record<string, number> = {
            'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
            'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
            'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
        };
        return months[monthName.toLowerCase()] || null;
    }
}