import { Router } from 'express';
import { geminiService } from '../../services/ai/gemini.service';

const router = Router();

router.post('/generate-plan', async (req, res) => {
    try {
        const { brief, userLocation } = req.body;
        const plan = await geminiService.generatePlan(brief, userLocation);
        res.json(plan);
    } catch (error) {
        console.error('Error generating plan:', error);
        res.status(500).json({ error: 'Failed to generate plan' });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { message, categories } = req.body;
        const chat = geminiService.getChatModelForCategories(categories);
        const result = await chat.sendMessage(message);
        if (!result || !result.text) {
            throw new Error('No response received from chat model');
        }
        const responseText = result.text;
        res.json({ text: responseText });
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

export default router;