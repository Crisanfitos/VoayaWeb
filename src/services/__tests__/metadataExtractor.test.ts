import { expect, describe, it } from 'vitest';
import { MetadataExtractor } from '../metadataExtractor';

describe('MetadataExtractor', () => {
    describe('extractDates', () => {
        it('should extract numeric dates', () => {
            const text = 'Quiero viajar del 15/06/2024 al 20/06/2024';
            const { chatMetadata } = MetadataExtractor.extract(text);

            expect(chatMetadata.dates?.start).toBeDefined();
            expect(chatMetadata.dates?.end).toBeDefined();
            expect(chatMetadata.dates?.start?.toDate().getMonth()).toBe(5); // Junio es 5 (0-based)
            expect(chatMetadata.dates?.end?.toDate().getMonth()).toBe(5);
        });

        it('should extract text-based dates', () => {
            const text = 'Planeo ir en julio 2024';
            const { chatMetadata } = MetadataExtractor.extract(text);

            expect(chatMetadata.dates?.start).toBeDefined();
            expect(chatMetadata.dates?.start?.toDate().getMonth()).toBe(6); // Julio es 6 (0-based)
            expect(chatMetadata.dates?.start?.toDate().getFullYear()).toBe(2024);
        });
    });

    describe('extractDestinations', () => {
        it('should extract destinations after prepositions', () => {
            const text = 'Quiero viajar a Barcelona';
            const { chatMetadata } = MetadataExtractor.extract(text);

            expect(chatMetadata.destination).toBe('Barcelona');
        });

        it('should extract from-to destinations', () => {
            const text = 'Vuelo de Madrid a París';
            const { chatMetadata, messageMetadata } = MetadataExtractor.extract(text);

            expect(messageMetadata.entities?.locations).toContain('Madrid');
            expect(messageMetadata.entities?.locations).toContain('París');
        });
    });

    describe('extractTravelers', () => {
        it('should extract number of travelers', () => {
            const text = 'Viaje para 3 personas';
            const { chatMetadata } = MetadataExtractor.extract(text);

            expect(chatMetadata.travelers).toBe(3);
        });
    });

    describe('extractIntent', () => {
        it('should identify flight search intent', () => {
            const text = 'Busco vuelos a Roma';
            const { messageMetadata } = MetadataExtractor.extract(text);

            expect(messageMetadata.intent).toBe('search_flight');
        });

        it('should identify hotel search intent', () => {
            const text = 'Necesito un hotel en Barcelona';
            const { messageMetadata } = MetadataExtractor.extract(text);

            expect(messageMetadata.intent).toBe('search_hotel');
        });
    });

    describe('complex scenarios', () => {
        it('should handle complex travel queries', () => {
            const text = 'Busco un vuelo de Madrid a París para 2 personas del 15 de julio al 20 de julio de 2024';
            const { chatMetadata, messageMetadata } = MetadataExtractor.extract(text);

            expect(messageMetadata.intent).toBe('search_flight');
            expect(chatMetadata.travelers).toBe(2);
            expect(chatMetadata.dates?.start).toBeDefined();
            expect(chatMetadata.dates?.end).toBeDefined();
            expect(messageMetadata.entities?.locations).toContain('Madrid');
            expect(messageMetadata.entities?.locations).toContain('París');
        });
    });
});