"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gemini_service_1 = require("../../services/ai/gemini.service");
const router = (0, express_1.Router)();
router.post('/generate-plan', async (req, res) => {
    try {
        const { brief, userLocation } = req.body;
        const plan = await gemini_service_1.geminiService.generatePlan(brief, userLocation);
        res.json(plan);
    }
    catch (error) {
        console.error('Error generating plan:', error);
        res.status(500).json({ error: 'Failed to generate plan' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { message, categories } = req.body;
        const chat = gemini_service_1.geminiService.getChatModelForCategories(categories);
        const result = await chat.sendMessage(message);
        if (!result || !result.response) {
            throw new Error('No response received from chat model');
        }
        const responseText = result.response.text();
        res.json({ text: responseText });
    }
    catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});
exports.default = router;
