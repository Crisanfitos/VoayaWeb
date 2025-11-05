'use server';
/**
 * @fileOverview A smart trip summary AI agent.
 *
 * - smartTripSummaries - A function that handles the trip summarization process.
 * - SmartTripSummariesInput - The input type for the smartTripSummaries function.
 * - SmartTripSummariesOutput - The return type for the smartTripSummaries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTripSummariesInputSchema = z.object({
  travelDocumentDataUri: z
    .string()
    .describe(
      "A travel document, such as a booking confirmation or itinerary, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SmartTripSummariesInput = z.infer<typeof SmartTripSummariesInputSchema>;

const SmartTripSummariesOutputSchema = z.object({
  summary: z.string().describe('A smart summary of the trip.'),
});
export type SmartTripSummariesOutput = z.infer<typeof SmartTripSummariesOutputSchema>;

export async function smartTripSummaries(input: SmartTripSummariesInput): Promise<SmartTripSummariesOutput> {
  return smartTripSummariesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTripSummariesPrompt',
  input: {schema: SmartTripSummariesInputSchema},
  output: {schema: SmartTripSummariesOutputSchema},
  prompt: `You are an expert travel assistant specializing in summarizing travel documents.

You will use this information to create a smart summary of the trip.

Use the following as the primary source of information about the trip.

Document: {{media url=travelDocumentDataUri}}`,
});

const smartTripSummariesFlow = ai.defineFlow(
  {
    name: 'smartTripSummariesFlow',
    inputSchema: SmartTripSummariesInputSchema,
    outputSchema: SmartTripSummariesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
