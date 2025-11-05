'use server';

/**
 * @fileOverview A personalized travel destination recommendation AI agent.
 *
 * - getPersonalizedDestinationRecommendations - A function that generates personalized travel destination recommendations.
 * - PersonalizedDestinationRecommendationsInput - The input type for the getPersonalizedDestinationRecommendations function.
 * - PersonalizedDestinationRecommendationsOutput - The return type for the getPersonalizedDestinationRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedDestinationRecommendationsInputSchema = z.object({
  travelHistory: z
    .string()
    .describe('The user travel history, as a string of destinations visited.'),
  preferences: z.string().describe('The user travel preferences.'),
  realTimeData: z.string().describe('The user real-time data, such as location.'),
});
export type PersonalizedDestinationRecommendationsInput = z.infer<
  typeof PersonalizedDestinationRecommendationsInputSchema
>;

const PersonalizedDestinationRecommendationsOutputSchema = z.object({
  destinations: z
    .array(z.string())
    .describe(
      'An array of personalized travel destination recommendations based on the user provided information.'
    ),
});
export type PersonalizedDestinationRecommendationsOutput = z.infer<
  typeof PersonalizedDestinationRecommendationsOutputSchema
>;

export async function getPersonalizedDestinationRecommendations(
  input: PersonalizedDestinationRecommendationsInput
): Promise<PersonalizedDestinationRecommendationsOutput> {
  return personalizedDestinationRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedDestinationRecommendationsPrompt',
  input: {schema: PersonalizedDestinationRecommendationsInputSchema},
  output: {schema: PersonalizedDestinationRecommendationsOutputSchema},
  prompt: `You are an expert travel assistant specializing in recommending travel destinations.\n\nYou will use the user's travel history, preferences, and real-time data to recommend personalized travel destinations.\n\nTravel History: {{{travelHistory}}}\nPreferences: {{{preferences}}}\nReal-time Data: {{{realTimeData}}}\n\nBased on the information above, provide a list of destinations that the user may be interested in.`, // Changed the prompt to use the inputs to get the destinations
});

const personalizedDestinationRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedDestinationRecommendationsFlow',
    inputSchema: PersonalizedDestinationRecommendationsInputSchema,
    outputSchema: PersonalizedDestinationRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
