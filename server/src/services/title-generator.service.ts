/**
 * Service for generating chat titles
 * Provides provisional and final title generation for travel chats
 */

import type { FlightOptions } from '../api/chat/types';

/**
 * Common destination patterns to extract from text
 */
const DESTINATION_PATTERNS = [
    // "a [city]", "hacia [city]", "ir a [city]"
    /(?:a|hacia|ir a|viajar a|viaje a|escapada a)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/gi,
    // "to [city]", "visit [city]"
    /(?:to|visit|visiting|trip to|travel to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    // Cities in caps or proper case at end of common patterns
    /(?:en|in)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s*(?:[,.]|$)/gi,
];

/**
 * Extract a likely destination from user message
 */
function extractDestinationFromText(text: string): string | null {
    for (const pattern of DESTINATION_PATTERNS) {
        // Reset regex state
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match && match[1]) {
            const destination = match[1].trim();
            // Filter out common words that aren't destinations
            const skipWords = ['la', 'el', 'los', 'las', 'un', 'una', 'mi', 'tu', 'su', 'este', 'ese', 'aquí'];
            if (!skipWords.includes(destination.toLowerCase()) && destination.length > 2) {
                return destination;
            }
        }
    }
    return null;
}

/**
 * Format a date in a readable Spanish format
 */
function formatDateSpanish(dateStr: string | null): string | null {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    } catch {
        return null;
    }
}

export interface ProvisionalTitleInput {
    firstMessage?: string;
    categories?: string[];
    flightOptions?: FlightOptions | null;
}

/**
 * Generate a provisional title based on available data
 * Used when creating a chat or receiving the first message
 */
export function generateProvisionalTitle(input: ProvisionalTitleInput): string {
    const { firstMessage, categories = [], flightOptions } = input;

    let destination: string | null = null;
    let dateInfo: string | null = null;

    // Try to extract destination from message
    if (firstMessage) {
        destination = extractDestinationFromText(firstMessage);
    }

    // Get date info from flight options
    if (flightOptions?.departureDate) {
        const depDate = formatDateSpanish(flightOptions.departureDate);
        if (flightOptions.returnDate && !flightOptions.oneWayOnly) {
            const retDate = formatDateSpanish(flightOptions.returnDate);
            dateInfo = `${depDate} - ${retDate}`;
        } else {
            dateInfo = depDate;
        }
    }

    // Build title based on what we have
    if (destination && dateInfo) {
        return `Viaje a ${destination} (${dateInfo})`;
    } else if (destination) {
        return `Viaje a ${destination}`;
    } else if (dateInfo) {
        // We have dates but no destination yet
        const categoryLabel = categories.includes('flights')
            ? 'Vuelo'
            : categories.includes('hotels')
                ? 'Hotel'
                : 'Viaje';
        return `${categoryLabel} para ${dateInfo}`;
    } else if (firstMessage && firstMessage.length > 10) {
        // Use truncated first message as fallback
        const truncated = firstMessage.slice(0, 50).trim();
        return truncated.length < firstMessage.length ? `${truncated}...` : truncated;
    }

    // Default fallback
    return 'Nuevo viaje';
}

export interface FinalTitleInput {
    destinationName?: string | null;
    departureDate?: string | null;
    returnDate?: string | null;
    currentTitle?: string;
}

/**
 * Generate a final title based on extracted travel data
 * Used when completing a chat after extraction
 */
export function generateFinalTitle(input: FinalTitleInput): string {
    const { destinationName, departureDate, returnDate, currentTitle } = input;

    if (!destinationName) {
        // If we couldn't extract a destination, keep current title
        return currentTitle || 'Viaje planificado';
    }

    // Format dates if available
    let dateInfo: string | null = null;
    if (departureDate) {
        const depDate = formatDateSpanish(departureDate);
        if (returnDate) {
            const retDate = formatDateSpanish(returnDate);
            dateInfo = `${depDate} - ${retDate}`;
        } else {
            dateInfo = depDate;
        }
    }

    if (dateInfo) {
        return `Viaje a ${destinationName} (${dateInfo})`;
    }

    return `Viaje a ${destinationName}`;
}

export const titleGeneratorService = {
    generateProvisionalTitle,
    generateFinalTitle,
    extractDestinationFromText,
};

export default titleGeneratorService;
