
import fetch from 'node-fetch';

/**
 * Service to handle dynamic image resolution.
 * Attempts to fetch from Unsplash API, falls back to category placeholders.
 */

// Category Placeholders (Fallback)
const PLACEHOLDERS: Record<string, string> = {
    playa: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    montana: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    ciudad: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80',
    naturaleza: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    cultura: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
};

export class ImageService {
    /**
     * Resolve an image URL for a given query (e.g., "Paris", "Beach vacation").
     * @param query The search term.
     * @param category Optional category suggestion (playa, montana, ciudad, etc.).
     * @returns A Promise resolving to an image URL.
     */
    static async resolveImage(query: string, category: string = 'default'): Promise<string> {
        const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
        // 1. Try Unsplash API if Key is available
        if (UNSPLASH_ACCESS_KEY) {
            try {
                console.log(`[ImageService] Searching Unsplash for: "${query}"`);
                const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` },
                    timeout: 5000 // 5s timeout
                } as any);

                if (response.ok) {
                    const data: any = await response.json();
                    const imageUrl = data.results?.[0]?.urls?.regular;
                    if (imageUrl) {
                        return imageUrl;
                    }
                } else {
                    console.warn(`[ImageService] Unsplash API error: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('[ImageService] Error fetching from Unsplash:', error);
            }
        } else {
            console.log('[ImageService] No UNSPLASH_ACCESS_KEY configured, skipping API search.');
        }

        // 2. Fallback to Placeholder
        return this.getPlaceholder(category);
    }

    /**
     * Get a placeholder image based on category.
     */
    static getPlaceholder(category: string): string {
        const key = category.toLowerCase();
        // Simple mapping logic
        if (key.includes('playa') || key.includes('beach')) return PLACEHOLDERS.playa;
        if (key.includes('montaña') || key.includes('mountain')) return PLACEHOLDERS.montana;
        if (key.includes('ciudad') || key.includes('city') || key.includes('urban')) return PLACEHOLDERS.ciudad;
        if (key.includes('naturaleza') || key.includes('nature')) return PLACEHOLDERS.naturaleza;
        if (key.includes('cultura') || key.includes('culture') || key.includes('history')) return PLACEHOLDERS.cultura;

        return PLACEHOLDERS[key] || PLACEHOLDERS.default;
    }
}
