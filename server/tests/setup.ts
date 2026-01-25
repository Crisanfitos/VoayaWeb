// server/tests/setup.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test or .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock global variables or services if needed
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            maybeSingle: jest.fn(),
        })),
        auth: {
            getUser: jest.fn(),
            admin: {
                deleteUser: jest.fn(),
            }
        }
    })),
}));
