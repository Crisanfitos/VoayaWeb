'use server';

/**
 * @fileOverview A conversational travel planner AI agent.
 *
 * - travelPlannerFlow - A function that engages in a conversation to plan a trip.
 * - TravelPlannerInput - The input type for the travelPlannerFlow function.
 * - TravelPlannerOutput - The return type for the travelPlannerFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for a single message in the chat history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool', 'system']),
  content: z.array(z.object({ text: z.string() })),
});

const TravelPlannerInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});
export type TravelPlannerInput = z.infer<typeof TravelPlannerInputSchema>;

const TravelPlannerOutputSchema = z.object({
  reply: z.string().describe('The AI assistant\'s response to the user.'),
});
export type TravelPlannerOutput = z.infer<typeof TravelPlannerOutputSchema>;

export async function travelPlannerFlow(input: TravelPlannerInput): Promise<TravelPlannerOutput> {
  return travelPlannerAIFlow(input);
}

const travelPlannerAIFlow = ai.defineFlow(
  {
    name: 'travelPlannerAIFlow',
    inputSchema: TravelPlannerInputSchema,
    outputSchema: TravelPlannerOutputSchema,
  },
  async (input) => {

    const systemPrompt = `You are Voaya, an expert travel planner AI. Your goal is to help users plan their perfect trip in a friendly, conversational manner.
    
    - Start by greeting the user and acknowledging their initial request from the chat history.
    - Ask clarifying questions to understand their needs better. Consider things like travel dates, budget, travel style (e.g., luxury, budget, family-friendly), interests, and any specific requirements.
    - Provide suggestions for destinations, flights, hotels, and activities based on their input.
    - Be proactive. If a user asks for a flight, you might also ask if they need a hotel or car rental.
    - Structure your responses clearly. Use markdown, like lists or bold text, to make the information easy to read.
    - Keep your tone helpful, enthusiastic, and professional.
    - Never mention that you are an AI. You are Voaya, the travel expert.
    `;

    // The 'assistant' role in Firestore needs to be mapped to 'model' for the AI
    const mappedHistory = input.history.map(message => ({
      ...message,
      role: message.role === 'assistant' ? 'model' : message.role,
    }));


    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: {
        system: systemPrompt,
        messages: mappedHistory,
      },
      output: {
        schema: TravelPlannerOutputSchema,
      },
      config: {
        temperature: 0.7,
      },
    });

    return output!;
  }
);
