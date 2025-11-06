'use server';

import { firebaseConfig } from '@/firebase/config';
import { genkit,  } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export async function getModelInfo() {
  const result = await new Promise((resolve) => {
    genkit({
      plugins: [
        googleAI({ "apiKey": firebaseConfig.apiKey }),
      ],
      logLevel: 'debug',
      enableTracing: true,
    });
    resolve("Doesn't work");
  });
  return result;
}
