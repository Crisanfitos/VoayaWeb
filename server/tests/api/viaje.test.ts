import request from 'supertest';
import app from '../../src/index';
import { supabaseAdmin } from '../../src/supabase/admin';

jest.mock('../../src/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            single: jest.fn(),
        })),
    },
}));

describe('Viaje Controller', () => {
    describe('GET /api/viajes', () => {
        it('should list trips for a user', async () => {
            const mockTrips = [
                { id: 'trip-1', destino: 'Paris', fecha_inicio: '2026-06-01', estado: 'planificando' }
            ];

            (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
                if (table === 'vuelos' || table === 'reservas_hoteles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockResolvedValue({ data: [], error: null }),
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    gte: jest.fn().mockResolvedValue({ data: mockTrips, error: null }),
                };
            });

            const res = await request(app)
                .get('/api/viajes')
                .query({ usuarioId: 'user-123' });

            expect(res.status).toBe(200);
            expect(res.body.viajes).toHaveLength(1);
            expect(res.body.viajes[0].destino).toBe('Paris');
        });
    });

    describe('POST /api/viajes', () => {
        it('should create a new trip', async () => {
            const newTrip = { usuarioId: 'user-123', destino: 'Tokyo', estado: 'borrador' };
            (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 'new-trip-id' }, error: null }),
            }));

            const res = await request(app)
                .post('/api/viajes')
                .send(newTrip);

            expect(res.status).toBe(201);
            expect(res.body.id).toBe('new-trip-id');
        });
    });
});
