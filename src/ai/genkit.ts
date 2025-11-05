import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {next} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI(),
    next({
      // We are mounting the API routes under /api/genkit.
      // This is the default.
      apiMountPath: '/api/genkit',
      // We are not specifying any flows to expose.
      // This means that all flows will be exposed.
      // flows: [],
    }),
  ],
  // We want Genkit to log to the console.
  // We can also configure it to log to a file or other services.
  logLevel: 'debug',
  // We want Genkit to be able to store traces.
  // As we have not configured a production-ready store,
  // Genkit will store traces in memory.
  enableTracing: true,
});
