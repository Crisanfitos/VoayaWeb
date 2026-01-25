import request from 'supertest';
import app from '../../src/index';
import { supabaseAdmin } from '../../src/supabase/admin';

// Mock Supabase Admin
jest.mock('../../src/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            update: jest.fn().mockReturnThis(),
        })),
    },
}));

describe('Usuario Controller', () => {
    describe('GET /api/usuarios/:userId', () => {
        it('should return user data if found', async () => {
            const mockUser = { id: '123', nombre: 'Test User' };
            (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
            }));

            const res = await request(app).get('/api/usuarios/123');

            expect(res.status).toBe(200);
            expect(res.body.usuario).toEqual(mockUser);
        });

        it('should return 404 if user not found', async () => {
            (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }));

            const res = await request(app).get('/api/usuarios/999');

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/usuarios/:userId/preferencias', () => {
        it('should update preferences successfully', async () => {
            const prefs = { aventura: 80, lujo: 20, naturaleza: 50, espontaneo: 50 };
            (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            }));

            const res = await request(app)
                .patch('/api/usuarios/123/preferencias')
                .send({ preferenciasIa: prefs });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });

        it('should validate preference range (0-100)', async () => {
            const invalidPrefs = { aventura: 150 }; // Invalid
            const res = await request(app)
                .patch('/api/usuarios/123/preferencias')
                .send({ preferenciasIa: invalidPrefs });

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/usuarios/:userId', () => {
        it('should update profile fields', async () => {
            (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            }));

            const res = await request(app)
                .patch('/api/usuarios/123')
                .send({ nombre: 'Nuevo Nombre', bio: 'Nueva Bio' });

            expect(res.status).toBe(200);
            expect(res.body.mensaje).toBe('Perfil actualizado');
        });
    });
});
