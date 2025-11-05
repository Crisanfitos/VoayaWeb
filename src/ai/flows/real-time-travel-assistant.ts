'use server';

/**
 * @fileOverview An AI travel assistant that provides real-time recommendations for restaurants, activities, and local attractions.
 *
 * - realTimeTravelAssistant - A function that handles the real-time travel assistance process.
 * - RealTimeTravelAssistantInput - The input type for the realTimeTravelAssistant function.
 * - RealTimeTravelAssistantOutput - The return type for the realTimeTravelAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeTravelAssistantInputSchema = z.object({
  location: z
    .string()
    .describe("The user's current location (e.g., 'latitude, longitude' or 'city, country')."),
  preferences: z
    .string()
    .describe("The user's preferences for restaurants, activities, and attractions (e.g., 'Italian food, historical sites, outdoor activities')."),
  timeOfDay: z
    .string()
    .describe('The current time of day (e.g., morning, afternoon, evening).'),
});
export type RealTimeTravelAssistantInput = z.infer<typeof RealTimeTravelAssistantInputSchema>;

const RealTimeTravelAssistantOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('A list of recommendations for restaurants, activities, and local attractions based on the user location and preferences.'),
});
export type RealTimeTravelAssistantOutput = z.infer<typeof RealTimeTravelAssistantOutputSchema>;

export async function realTimeTravelAssistant(
  input: RealTimeTravelAssistantInput
): Promise<RealTimeTravelAssistantOutput> {
  return realTimeTravelAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realTimeTravelAssistantPrompt',
  input: {schema: RealTimeTravelAssistantInputSchema},
  output: {schema: RealTimeTravelAssistantOutputSchema},
  prompt: `You are an AI travel assistant providing real-time recommendations to the user based on their current location, preferences, and the current time of day.

  Location: {{{location}}}
  Preferences: {{{preferences}}}
  Time of day: {{{timeOfDay}}}

  Provide a list of recommendations for restaurants, activities, and local attractions.  Make the recommendations specific to the location and preferences, and consider the time of day.
  `,
});

const realTimeTravelAssistantFlow = ai.defineFlow(
  {
    name: 'realTimeTravelAssistantFlow',
    inputSchema: RealTimeTravelAssistantInputSchema,
    outputSchema: RealTimeTravelAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
