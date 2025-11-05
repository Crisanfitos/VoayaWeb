'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-destination-recommendations.ts';
import '@/ai/flows/smart-trip-summaries.ts';
import '@/ai/flows/real-time-travel-assistant.ts';
import '@/ai/flows/travel-planner-flow.ts';
