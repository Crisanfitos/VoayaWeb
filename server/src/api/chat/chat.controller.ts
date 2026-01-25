import { Router } from 'express';
import { supabaseAdmin } from '../../supabase/admin';
import { aiRouter } from '../../services/ai/ai-router.service';
import { buildSystemPrompt } from '../../services/ai/system-prompts';
import type { ChatMessage } from '../../services/ai/types';
import { generateProvisionalTitle, generateFinalTitle } from '../../services/title-generator.service';
import type { FlightOptions } from './types';

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
        const { userId, categories = [], flightOptions = null } = req.body;

        // Generate a provisional title based on available data (flightOptions)
        const provisionalTitle = generateProvisionalTitle({
            categories,
            flightOptions: flightOptions as FlightOptions | null,
        });

        const { data, error } = await supabaseAdmin
            .from('chats')
            .insert({
                usuario_id: userId || null,
                titulo: provisionalTitle,
                estado: 'active',
                categorias: categories,
                metadatos: flightOptions ? { flightOptions } : {},
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

        // If no chatId provided, create a new chat with provisional title
        if (!chatId) {
            const provisionalTitle = generateProvisionalTitle({
                firstMessage: text,
                categories: [],
            });

            const { data: newChat, error: createError } = await supabaseAdmin
                .from('chats')
                .insert({
                    usuario_id: userId || null,
                    titulo: provisionalTitle,
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
        console.log('[Chat API] Sending message with AI Router, categories:', categories);

        // Get user preferences for personalized system prompt
        let userPreferences = null;
        if (userId) {
            const { data: userData } = await supabaseAdmin
                .from('usuarios')
                .select('preferencias_ia')
                .eq('id', userId)
                .single();
            userPreferences = userData?.preferencias_ia;
        }

        // Extract flight options from chat metadata
        const flightOptions = chatData?.metadatos?.flightOptions || null;

        // Build personalized system prompt based on chat categories and flight options
        const systemPrompt = buildSystemPrompt(categories, userPreferences, flightOptions);

        // Get previous messages for context
        const { data: previousMessages } = await supabaseAdmin
            .from('mensajes')
            .select('rol, contenido')
            .eq('chat_id', chatId)
            .order('fecha_creacion', { ascending: true })
            .limit(20);

        // Build messages array for AI (excluding current as it's not saved yet)
        const contextMessages: ChatMessage[] = (previousMessages || []).map(m => ({
            role: m.rol as 'user' | 'assistant' | 'system',
            content: m.contenido
        }));

        // Add current message to form complete message list
        const messages: ChatMessage[] = [...contextMessages, { role: 'user', content: text }];

        // Log context for debugging
        console.log(`[Chat API] Context: ${contextMessages.length} previous messages + 1 new = ${messages.length} total`);

        // Get AI response with automatic model selection (STREAMING)
        let aiResponseFull = '';

        try {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');

            const stream = aiRouter.sendMessageStream(messages, systemPrompt);

            for await (const chunk of stream) {
                res.write(chunk);
                aiResponseFull += chunk;
            }
            res.end();
        } catch (error) {
            console.error('[Chat API] Error calling AI:', error);
            if (!res.headersSent) {
                res.status(503).json({ error: 'AI service unavailable. Please try again later.' });
            } else {
                res.end();
            }
            return;
        }

        // Save AI response (AFTER streaming is complete)
        if (aiResponseFull) {
            await supabaseAdmin.from('mensajes').insert({
                chat_id: chatId,
                usuario_id: userId || null,  // Same user as the chat owner
                rol: 'assistant',
                contenido: aiResponseFull,
            });

            // Update chat's lastMessageAt
            await supabaseAdmin
                .from('chats')
                .update({ ultimo_mensaje_en: new Date().toISOString() })
                .eq('id', chatId);
        }
    } catch (error) {
        console.error('Error in message endpoint:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Mark chat as completed and trigger the Python agents microservice for analysis
router.post('/complete', async (req, res) => {
    try {
        const { chatId, forceRewrite } = req.body;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });

        const userId = (req as any).user?.id; // Assuming auth middleware attached user, otherwise check body or session
        // If req.user is not available, we need to get user from chat or body
        // For now let's get chat data first

        const { data: chatData, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (chatError || !chatData) return res.status(404).json({ error: 'Chat not found' });

        const effectiveUserId = userId || chatData.usuario_id;

        // CHECK EXISTING TRIP
        const { data: existingTrip } = await supabaseAdmin
            .from('viajes')
            .select('id')
            .eq('chat_id', chatId)
            .single();

        if (existingTrip) {
            if (!forceRewrite) {
                // Return existing trip so frontend can prompt user
                return res.json({
                    ok: true,
                    existingTrip: { id: existingTrip.id },
                    message: 'Trip already exists for this chat'
                });
            } else {
                // Force Rewrite: Delete existing trip (careful with cascading?) or Update?
                // User asked "borrar todos los datos significa simplemente reescribir"
                // Let's delete the old one to ensure clean slate or update it.
                // Creating a NEW implementation would be cleaner if we just delete the old one.
                await supabaseAdmin.from('viajes').delete().eq('id', existingTrip.id);
            }
        }

        // Mark as completed and set processing status
        await supabaseAdmin
            .from('chats')
            .update({
                estado: 'completed',
                ultimo_mensaje_en: new Date().toISOString(),
                metadatos: { ...chatData.metadatos, processing_status: 'extracting' }
            })
            .eq('id', chatId);

        // Gather chat data
        const { data: messages } = await supabaseAdmin
            .from('mensajes')
            .select('*')
            .eq('chat_id', chatId)
            .order('fecha_creacion', { ascending: true });

        const formattedMessages = messages?.map(mapMessageToApi) || [];
        const formattedChat = mapChatToApi(chatData);

        const agentsUrl = process.env.AGENTS_URL || 'http://localhost:3003';
        const webhookSecret = process.env.WEBHOOK_SECRET;

        // 1. SYNC EXTRACTION
        console.log(`[Chat Complete] Requesting extraction for chat ${chatId}`);
        let extractedData = null;
        try {
            const extractRes = await fetch(`${agentsUrl}/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat: formattedChat,
                    messages: formattedMessages,
                    secret: webhookSecret
                })
            });

            if (extractRes.ok) {
                extractedData = await extractRes.json();

                // Generate and update final title based on extracted data
                const finalTitle = generateFinalTitle({
                    destinationName: extractedData?.destination_name,
                    departureDate: extractedData?.departure_date,
                    returnDate: extractedData?.return_date,
                    currentTitle: chatData.titulo,
                });

                // Update chat title with the final title
                await supabaseAdmin
                    .from('chats')
                    .update({ titulo: finalTitle })
                    .eq('id', chatId);

                console.log(`[Chat Complete] Updated chat title to: ${finalTitle}`);
            } else {
                console.error('[Chat Complete] Extraction failed', await extractRes.text());
            }
        } catch (e) {
            console.error('[Chat Complete] Extraction error', e);
        }

        // 2. CREATE TRIP (VIAJE)
        const viajeData = {
            usuario_id: effectiveUserId,
            chat_id: chatId,
            destino: extractedData?.destination_name || extractedData?.destination || chatData.titulo || 'Destino por definir',
            fecha_inicio: extractedData?.departure_date || null,
            fecha_fin: extractedData?.return_date || null,
            estado: 'planificando',
            metadatos: {
                extracted_data: extractedData,
                flight_status: 'searching', // Initial status
                created_from_chat: true
            }
        };

        const { data: viaje, error: viajeError } = await supabaseAdmin
            .from('viajes')
            .insert(viajeData)
            .select('id')
            .single();

        if (viajeError) {
            console.error('[Chat Complete] Failed to create voyage', viajeError);
            throw viajeError;
        }

        const tripId = viaje.id;
        console.log(`[Chat Complete] Trip created: ${tripId}`);

        // 3. ASYNC SEARCH (Fire and Forget)
        if (extractedData && extractedData.extraction_confidence > 0.4) {
            // Only search if we have decent data
            fetch(`${agentsUrl}/search-flights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: tripId,
                    extracted_data: extractedData,
                    secret: webhookSecret
                })
            }).catch(err => {
                console.error('[Chat Complete] Failed to trigger flight search:', err);
            });
        }

        // 4. RETURN RESPONSE WITH TRIP ID
        res.json({
            ok: true,
            message: 'Trip created and search started',
            tripId: tripId,
            extractedData
        });

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
