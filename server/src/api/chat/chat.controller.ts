import { Router } from 'express';
import { supabaseAdmin } from '../../supabase/admin';
import { geminiService } from '../../services/ai/gemini-simple.service';

const router = Router();

// Helper to map DB snake_case to API camelCase for Chat
const mapChatToApi = (chat: any) => ({
    id: chat.id,
    userId: chat.usuario_id,
    createdAt: chat.fecha_creacion,
    title: chat.titulo,
    status: chat.estado,
    categories: chat.categorias || [],
    lastMessageAt: chat.ultimo_mensaje_en,
    metadata: chat.metadatos || {}
});

// Helper to map DB to API for Message
const mapMessageToApi = (msg: any) => ({
    id: msg.id,
    chatId: msg.chat_id,
    userId: msg.usuario_id,
    role: msg.rol,
    text: msg.contenido,
    createdAt: msg.fecha_creacion,
    metadata: msg.metadatos || {}
});

// List chats (optionally filtered by userId)
router.get('/', async (req, res) => {
    try {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;

        let query = supabaseAdmin
            .from('chats')
            .select('*')
            .order('ultimo_mensaje_en', { ascending: false })
            .limit(50);

        if (userId) {
            query = query.eq('usuario_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const chats = data.map(mapChatToApi);
        res.json({ chats });
    } catch (error) {
        console.error('Error listing chats:', error);
        res.status(500).json({ error: 'Failed to list chats' });
    }
});

// Create a new chat document (called when a user starts a planner chat)
router.post('/start', async (req, res) => {
    try {
        const { userId, categories = [] } = req.body;

        const { data, error } = await supabaseAdmin
            .from('chats')
            .insert({
                usuario_id: userId || null, // Allow null for anonymous/unauth logic if supported, but typically foreign key constraints might fail if user doesn't exist in 'usuarios' table? Schema has REFERENCES. If anonymous users aren't in 'usuarios', this breaks. Assuming userId is valid.
                titulo: 'Nuevo Chat',
                estado: 'active',
                categorias: categories,
                // fecha_creacion & ultimo_mensaje_en default to NOW()
            })
            .select('id')
            .single();

        if (error) throw error;

        res.json({ chatId: data.id });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// Save a message to a chat and get AI response
router.post('/message', async (req, res) => {
    try {
        let { chatId, text, userId, role = 'user' } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Invalid text' });
        }

        // If no chatId provided, create a new chat
        if (!chatId) {
            const { data: newChat, error: createError } = await supabaseAdmin
                .from('chats')
                .insert({
                    usuario_id: userId || null,
                    titulo: text.slice(0, 100),
                    estado: 'active',
                    categorias: [],
                })
                .select('id')
                .single();

            if (createError) throw createError;
            chatId = newChat.id;
        }

        // Save user message
        const { error: msgError } = await supabaseAdmin.from('mensajes').insert({
            chat_id: chatId,
            usuario_id: userId || null,
            rol: 'user',
            contenido: text,
        });

        if (msgError) throw msgError;

        // Get chat data (for categories) to determine which model/prompt to use
        // In original code: categories were passed to Gemini? No, logged.
        const { data: chatData, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        const categories = chatData?.categorias || [];
        console.log('[Chat API] Sending message to Gemini for categories:', categories);

        // Get AI response from Gemini
        let aiResponse = '';
        try {
            aiResponse = await geminiService.sendMessage(chatId, text);
            console.log('[Chat API] Gemini response:', aiResponse);
        } catch (error) {
            console.error('[Chat API] Error calling Gemini:', error);
            aiResponse = 'Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo.';
        }

        // Save AI response
        await supabaseAdmin.from('mensajes').insert({
            chat_id: chatId,
            usuario_id: null,
            rol: 'assistant',
            contenido: aiResponse,
        });

        // Update chat's lastMessageAt
        await supabaseAdmin
            .from('chats')
            .update({ ultimo_mensaje_en: new Date().toISOString() })
            .eq('id', chatId);

        res.json({
            chatId,
            message: {
                role: 'assistant',
                text: aiResponse
            }
        });
    } catch (error) {
        console.error('Error in message endpoint:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Mark chat as completed and optionally trigger an outbound webhook to process the chat
router.post('/complete', async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });

        const { data: chatData, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (chatError || !chatData) return res.status(404).json({ error: 'Chat not found' });

        await supabaseAdmin
            .from('chats')
            .update({
                estado: 'completed',
                ultimo_mensaje_en: new Date().toISOString()
            })
            .eq('id', chatId);

        // Gather chat data to send to external agent
        const { data: messages } = await supabaseAdmin
            .from('mensajes')
            .select('*')
            .eq('chat_id', chatId)
            .order('fecha_creacion', { ascending: true });

        const formattedMessages = messages?.map(mapMessageToApi) || [];
        const formattedChat = mapChatToApi(chatData);

        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const systemPrompt = process.env.N8N_SYSTEM_PROMPT || `Eres un agente que extrae metadatos de una conversación de planificación de viajes.
Recibe un objeto 'chat' y un array 'messages' con el historial. Devuelve un objeto JSON con los campos relevantes para planificar: destination, dates.start, dates.end, travelers, categories, and any preferences or notes. Usa ISO-8601 para fechas. Asegúrate de incluir chatId en la respuesta.`;

        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: formattedChat, messages: formattedMessages, secret: webhookSecret, systemPrompt })
                });
            } catch (err) {
                console.error('Failed to call webhook:', err);
            }
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Error completing chat:', error);
        res.status(500).json({ error: 'Failed to complete chat' });
    }
});

// Webhook callback endpoint that receives processed metadata and updates the chat
router.post('/webhook-callback', async (req, res) => {
    try {
        const { chatId, metadata, secret } = req.body;
        const expected = process.env.WEBHOOK_SECRET;
        if (expected && secret !== expected) {
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }

        if (!chatId) return res.status(400).json({ error: 'chatId required' });

        await supabaseAdmin
            .from('chats')
            .update({
                metadatos: metadata || {},
                ultimo_mensaje_en: new Date().toISOString()
            })
            .eq('id', chatId);

        res.json({ ok: true });
    } catch (error) {
        console.error('Error in webhook callback:', error);
        res.status(500).json({ error: 'Failed to process webhook callback' });
    }
});

// Send chat + metadata to an external webhook (for search execution: flights/hotels/experiences)
router.post('/send-external', async (req, res) => {
    try {
        const { chatId, webhookUrl, secret } = req.body;
        const target = webhookUrl || process.env.EXTERNAL_WEBHOOK_URL;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });
        if (!target) return res.status(400).json({ error: 'No external webhook configured' });

        const { data: chatData, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (chatError || !chatData) return res.status(404).json({ error: 'Chat not found' });

        const formattedChat = mapChatToApi(chatData);

        const { data: messages } = await supabaseAdmin
            .from('mensajes')
            .select('*')
            .eq('chat_id', chatId)
            .order('fecha_creacion', { ascending: true });

        const formattedMessages = messages?.map(mapMessageToApi) || [];

        try {
            await fetch(target, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: formattedChat, messages: formattedMessages, secret })
            });
        } catch (err) {
            console.error('Failed to call external webhook:', err);
            return res.status(502).json({ error: 'Failed to call external webhook' });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Error sending to external webhook:', error);
        res.status(500).json({ error: 'Failed to send to external webhook' });
    }
});

// Get chat and its messages
router.get('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });

        const { data: chatData, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (chatError || !chatData) return res.status(404).json({ error: 'Chat not found' });

        const { data: messages, error: messagesError } = await supabaseAdmin
            .from('mensajes')
            .select('*')
            .eq('chat_id', chatId)
            .order('fecha_creacion', { ascending: true });

        const formattedChat = mapChatToApi(chatData);
        const formattedMessages = messages?.map(mapMessageToApi) || [];

        res.json({ chat: formattedChat, messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// Delete a chat and its messages
router.delete('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });

        // Los mensajes se eliminan automáticamente por ON DELETE CASCADE
        const { error } = await supabaseAdmin
            .from('chats')
            .delete()
            .eq('id', chatId);

        if (error) throw error;

        res.json({ ok: true, mensaje: 'Chat eliminado' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Toggle favorite status of a chat
router.patch('/:chatId/favorito', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { esFavorito } = req.body;

        if (!chatId) return res.status(400).json({ error: 'chatId required' });
        if (typeof esFavorito !== 'boolean') {
            return res.status(400).json({ error: 'esFavorito debe ser boolean' });
        }

        const { error } = await supabaseAdmin
            .from('chats')
            .update({
                es_favorito: esFavorito,
                ultimo_mensaje_en: new Date().toISOString()
            })
            .eq('id', chatId);

        if (error) throw error;

        res.json({ ok: true, esFavorito });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

export default router;
