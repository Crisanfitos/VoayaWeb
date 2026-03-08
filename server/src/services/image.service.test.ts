
import { ImageService } from './image.service';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as unknown as jest.Mock;

describe('ImageService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        // Reset env var
        process.env.UNSPLASH_ACCESS_KEY = 'test_key';
    });

    it('should return a placeholder if no API key is set', async () => {
        delete process.env.UNSPLASH_ACCESS_KEY;
        const url = await ImageService.resolveImage('Paris', 'ciudad');
        expect(url).toContain('unsplash.com'); // Placeholder url
        expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('should call Unsplash API if key is present', async () => {
        mockedFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                results: [{ urls: { regular: 'https://example.com/paris.jpg' } }]
            })
        });

        const url = await ImageService.resolveImage('Paris', 'ciudad');
        expect(mockedFetch).toHaveBeenCalled();
        expect(url).toBe('https://example.com/paris.jpg');
    });

    it('should fallback to placeholder if API request fails', async () => {
        mockedFetch.mockResolvedValue({
            ok: false,
            status: 403,
            statusText: 'Forbidden'
        });

        const url = await ImageService.resolveImage('Paris', 'ciudad');
        expect(url).toContain('unsplash.com'); // Placeholder
        // Should rely on category logic
        expect(ImageService.getPlaceholder('ciudad')).toBe(url);
    });

    it('should return correct placeholder for categories', () => {
        expect(ImageService.getPlaceholder('playa')).toContain('photo-15075'); // Beach photo ID fragment
        expect(ImageService.getPlaceholder('unknown_category')).toContain('photo-14886'); // Default
    });
});
