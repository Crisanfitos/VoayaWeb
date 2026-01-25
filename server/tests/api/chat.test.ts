import request from 'supertest';
import app from '../../src/index';
import { supabaseAdmin } from '../../src/supabase/admin';
import { geminiService } from '../../src/services/ai/gemini-simple.service';

// Mock Supabase Admin (already partially mocked in setup but we refine here)
jest.mock('../../src/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            limit: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
        })),
    },
}));

// Mock Gemini Service
jest.mock('../../src/services/ai/gemini-simple.service', () => ({
    geminiService: {
        sendMessageStream: jest.fn(),
        sendMessage: jest.fn(),
    },
}));

describe('Chat Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/chat/start', () => {
        it('should create a new chat and return chatId', async () => {
            const mockChatId = 'chat-123';
            (supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: mockChatId }, error: null }),
            }));

            const res = await request(app)
                .post('/api/chat/start')
                .send({ userId: 'user-123', categories: ['flights'] });

            expect(res.status).toBe(200);
            expect(res.body.chatId).toBe(mockChatId);
        });
    });

    describe('POST /api/chat/message', () => {
        it('should stream AI response', async () => {
            const mockChatId = 'chat-123';
            const mockStreamResponse = ['Hello', ' ', 'World'];

            // Mock Gemini Stream
            async function* mockGenerator() {
                for (const chunk of mockStreamResponse) {
                    yield chunk;
                }
            }
            (geminiService.sendMessageStream as jest.Mock).mockResolvedValue(mockGenerator());

            // Mock Supabase calls (insert user msg, get chat, insert ai msg, update chat)
            (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
                if (table === 'chats') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { categorias: [] }, error: null }),
                        update: jest.fn().mockReturnThis(),
                    };
                }
                if (table === 'mensajes') {
                    return {
                        insert: jest.fn().mockResolvedValue({ error: null }),
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                    };
                }
                return {
                    insert: jest.fn().mockReturnThis(),
                    select: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
                };
            });

            // supertest buffers response by default, so res.text will contain full body
            const res = await request(app)
                .post('/api/chat/message')
                .send({ chatId: mockChatId, text: 'Hi', userId: 'user-123' })
                .expect('Transfer-Encoding', 'chunked')
                .expect('Content-Type', /text\/plain/);

            expect(res.status).toBe(200);
            expect(res.text).toBe('Hello World');

            // Verify Gemini was called
            expect(geminiService.sendMessageStream).toHaveBeenCalledWith(mockChatId, 'Hi');
        });
    });
});
