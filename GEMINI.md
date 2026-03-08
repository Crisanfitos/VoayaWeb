# GEMINI.md - Voaya Project Context

## Project Overview
Voaya is a full-stack travel planning web application that leverages AI (Google Gemini) to provide personalized travel assistance, itinerary generation, and flight searching.

### Architecture
- **Frontend (`/client`)**: Next.js 15 application using React 18 and Tailwind CSS. It handles the user interface, authentication (via Supabase), and interactive chat experiences.
- **Backend (`/server`)**: Express.js server written in TypeScript. It acts as an orchestrator, managing Supabase interactions, Gemini AI integration for chat and travel data extraction, and flight searches via Duffel.
- **Shared Types (`/shared`)**: Common TypeScript interfaces and types used by both the client and server to ensure data consistency.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Radix UI, Framer Motion, Lucide React, Recharts.
- **Backend**: Node.js, Express, TypeScript, Zod.
- **AI/ML**: Google Gemini (Generative AI) for chat and structured data extraction.
- **Database & Auth**: Supabase (PostgreSQL).
- **Travel Data**: Duffel API (Flights).
- **Testing**: Vitest (Client), Jest (Server), Playwright (E2E).

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account and project
- Google AI (Gemini) API Key
- Duffel API Key (for flight searches)

### Installation
1. Install root dependencies: `npm install`
2. Install workspace dependencies: `npm install --workspaces`
3. Configure environment variables (see below).

### Environment Variables
#### Client (`client/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key.

#### Server (`server/.env`)
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin access).
- `GOOGLE_API_KEY`: Your Google Gemini API Key.
- `DUFFEL_ACCESS_TOKEN`: Your Duffel API Access Token.

### Running the Project
- **Full Stack (Client + Server)**: `npm run dev` from the root directory.
- **Client Only**: `npm run dev:client`
- **Server Only**: `npm run dev:server`

## Development Conventions
- **Monorepo**: Uses NPM Workspaces.
- **Type Safety**: Shared types in `/shared/types` should be used for any data passed between client and server.
- **AI Integration**: All AI logic (chat, extraction) is handled via `gemini.service.ts` in the server.
- **Flight Searches**: Handled via `vuelo.service.ts` using the Duffel SDK.
- **Testing**: 
    - Unit/Component tests in `client/tests` and `server/tests` using Vitest/Jest.
    - E2E tests in `/e2e` using Playwright.

## Key Directories
- `/client/src/app`: Next.js App Router pages and layouts.
- `/client/src/components`: UI components (auth, chat, landing, layout, ui).
- `/server/src/api`: Express routes (chat, hotel, voyage, flight, user).
- `/server/src/services`: Business logic (AI extraction, image resolving, flight searching).
- `/shared/types`: Common data models (Chat, Message, TravelPlan, etc.).
