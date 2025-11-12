"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = __importStar(require("../../firebase/admin"));
const gemini_simple_service_1 = require("../../services/ai/gemini-simple.service");
const router = (0, express_1.Router)();
const CHAT_COLLECTION = 'chats';
// List chats (optionally filtered by userId)
router.get('/', async (req, res) => {
    try {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
        // If a userId filter is provided, query by userId only (no orderBy) to avoid requiring a composite index.
        // We'll limit the result set on the server and then sort in-memory by lastMessageAt.
        if (userId) {
            const snap = await admin_1.firestore.collection(CHAT_COLLECTION)
                .where('userId', '==', userId)
                .limit(50)
                .get();
            const chats = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
            // Sort in-memory by lastMessageAt (most recent first). Handle missing timestamps.
            chats.sort((a, b) => {
                const aTs = a.lastMessageAt && typeof a.lastMessageAt.toMillis === 'function'
                    ? a.lastMessageAt.toMillis()
                    : a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const bTs = b.lastMessageAt && typeof b.lastMessageAt.toMillis === 'function'
                    ? b.lastMessageAt.toMillis()
                    : b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return bTs - aTs;
            });
            return res.json({ chats });
        }
        // No userId: order by lastMessageAt desc (no composite index required)
        const snap = await admin_1.firestore.collection(CHAT_COLLECTION)
            .orderBy('lastMessageAt', 'desc')
            .limit(50)
            .get();
        const chats = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        res.json({ chats });
    }
    catch (error) {
        console.error('Error listing chats:', error);
        res.status(500).json({ error: 'Failed to list chats' });
    }
});
// Create a new chat document (called when a user starts a planner chat)
router.post('/start', async (req, res) => {
    try {
        const { userId, categories = [] } = req.body;
        const chatRef = await admin_1.firestore.collection(CHAT_COLLECTION).add({
            userId: userId || null,
            createdAt: admin_1.default.firestore.FieldValue.serverTimestamp(),
            title: 'Nuevo Chat',
            status: 'active',
            categories,
            lastMessageAt: admin_1.default.firestore.FieldValue.serverTimestamp(),
            metadata: {}
        });
        res.json({ chatId: chatRef.id });
    }
    catch (error) {
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
            const chatRef = await admin_1.firestore.collection(CHAT_COLLECTION).add({
                userId: userId || null,
                createdAt: admin_1.default.firestore.FieldValue.serverTimestamp(),
                title: text.slice(0, 100),
                status: 'active',
                categories: [],
                lastMessageAt: admin_1.default.firestore.FieldValue.serverTimestamp(),
                metadata: {}
            });
            chatId = chatRef.id;
        }
        // Save user message
        const messagesRef = admin_1.firestore.collection(CHAT_COLLECTION).doc(chatId).collection('messages');
        await messagesRef.add({
            role: 'user',
            text,
            createdAt: admin_1.default.firestore.FieldValue.serverTimestamp(),
            userId: userId || null
        });
        // Get chat data to determine which model to use
        const chatRef = admin_1.firestore.collection(CHAT_COLLECTION).doc(chatId);
        const chatSnap = await chatRef.get();
        const chatData = chatSnap.data() || {};
        const categories = chatData.categories || [];
        console.log('[Chat API] Sending message to Gemini for categories:', categories);
        // Get AI response from Gemini
        let aiResponse = '';
        try {
            aiResponse = await gemini_simple_service_1.geminiService.sendMessage(chatId, text);
            console.log('[Chat API] Gemini response:', aiResponse);
        }
        catch (error) {
            console.error('[Chat API] Error calling Gemini:', error);
            aiResponse = 'Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo.';
        }
        // Save AI response
        await messagesRef.add({
            role: 'assistant',
            text: aiResponse,
            createdAt: admin_1.default.firestore.FieldValue.serverTimestamp(),
            userId: null
        });
        // Update chat's lastMessageAt
        await chatRef.update({
            lastMessageAt: admin_1.default.firestore.FieldValue.serverTimestamp()
        }).catch(() => {
            // If update fails (e.g., doc just created), ignore
        });
        res.json({
            chatId,
            message: {
                role: 'assistant',
                text: aiResponse
            }
        });
    }
    catch (error) {
        console.error('Error in message endpoint:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});
// Mark chat as completed and optionally trigger an outbound webhook to process the chat
router.post('/complete', async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId)
            return res.status(400).json({ error: 'chatId required' });
        const chatRef = admin_1.firestore.collection(CHAT_COLLECTION).doc(chatId);
        const chatSnap = await chatRef.get();
        if (!chatSnap.exists)
            return res.status(404).json({ error: 'Chat not found' });
        await chatRef.update({
            status: 'completed',
            lastMessageAt: admin_1.default.firestore.FieldValue.serverTimestamp()
        });
        // Gather chat data to send to external agent
        const chatData = { id: chatId, ...(chatSnap.data() || {}) };
        const messagesSnap = await chatRef.collection('messages').orderBy('createdAt', 'asc').get();
        const messages = messagesSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const systemPrompt = process.env.N8N_SYSTEM_PROMPT || `Eres un agente que extrae metadatos de una conversación de planificación de viajes.
Recibe un objeto 'chat' y un array 'messages' con el historial. Devuelve un objeto JSON con los campos relevantes para planificar: destination, dates.start, dates.end, travelers, categories, and any preferences or notes. Usa ISO-8601 para fechas. Asegúrate de incluir chatId en la respuesta.`;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: chatData, messages, secret: webhookSecret, systemPrompt })
                });
            }
            catch (err) {
                console.error('Failed to call webhook:', err);
            }
        }
        res.json({ ok: true });
    }
    catch (error) {
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
        if (!chatId)
            return res.status(400).json({ error: 'chatId required' });
        const chatRef = admin_1.firestore.collection(CHAT_COLLECTION).doc(chatId);
        await chatRef.update({
            metadata: metadata || {},
            lastMessageAt: admin_1.default.firestore.FieldValue.serverTimestamp()
        });
        res.json({ ok: true });
    }
    catch (error) {
        console.error('Error in webhook callback:', error);
        res.status(500).json({ error: 'Failed to process webhook callback' });
    }
});
// Send chat + metadata to an external webhook (for search execution: flights/hotels/experiences)
router.post('/send-external', async (req, res) => {
    try {
        const { chatId, webhookUrl, secret } = req.body;
        const target = webhookUrl || process.env.EXTERNAL_WEBHOOK_URL;
        if (!chatId)
            return res.status(400).json({ error: 'chatId required' });
        if (!target)
            return res.status(400).json({ error: 'No external webhook configured' });
        const chatRef = admin_1.firestore.collection(CHAT_COLLECTION).doc(chatId);
        const chatSnap = await chatRef.get();
        if (!chatSnap.exists)
            return res.status(404).json({ error: 'Chat not found' });
        const chatData = { id: chatId, ...(chatSnap.data() || {}) };
        // Get latest messages (could be large; consider limits in production)
        const messagesSnap = await chatRef.collection('messages').orderBy('createdAt', 'asc').get();
        const messages = messagesSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        try {
            await fetch(target, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: chatData, messages, secret })
            });
        }
        catch (err) {
            console.error('Failed to call external webhook:', err);
            return res.status(502).json({ error: 'Failed to call external webhook' });
        }
        res.json({ ok: true });
    }
    catch (error) {
        console.error('Error sending to external webhook:', error);
        res.status(500).json({ error: 'Failed to send to external webhook' });
    }
});
// Get chat and its messages
router.get('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!chatId)
            return res.status(400).json({ error: 'chatId required' });
        const chatRef = admin_1.firestore.collection(CHAT_COLLECTION).doc(chatId);
        const chatSnap = await chatRef.get();
        if (!chatSnap.exists)
            return res.status(404).json({ error: 'Chat not found' });
        const chatData = { id: chatId, ...(chatSnap.data() || {}) };
        const messagesSnap = await chatRef.collection('messages').orderBy('createdAt', 'asc').get();
        const messages = messagesSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        res.json({ chat: chatData, messages });
    }
    catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});
exports.default = router;
