# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voaya is an AI-powered travel planning application. Users chat with an AI assistant to plan trips, search flights (via Amadeus API), and manage itineraries. It's a monorepo with three main components:

- **client/** — Next.js 15 frontend (React 18, App Router, Tailwind CSS, Radix UI)
- **server/** — Express API backend (TypeScript, Supabase for DB/auth)
- **server/agents/** — Python FastAPI microservice (LangGraph + Amadeus for AI-driven flight search)
- **shared/** — Shared TypeScript types used by both client and server

## Commands

### Development
```bash
npm run dev              # Client (port 9002) + server (port 3001) concurrently
npm run dev:client       # Client only — next dev --turbo -p 9002
npm run dev:server       # Server only — nodemon on port 3001
```

### Build
```bash
npm run build            # Build all workspaces
npm run build:prod       # Production build (client + server)
```

### Test
```bash
npm run test             # Root: vitest with jsdom
npm run test --workspace=client   # Client unit tests (vitest)
npx playwright test      # E2E tests (requires auth setup in e2e/auth.setup.ts)
npx playwright test e2e/chat-flow.spec.ts  # Single E2E test file
```

### Lint & Typecheck
```bash
npm run lint             # Lint all workspaces (next lint)
npm run typecheck        # Typecheck all workspaces
```

### Python Agents (server/agents/)
```bash
cd server/agents
python -m venv venv && source venv/Scripts/activate  # Windows
pip install -r requirements.txt
python main.py           # Starts FastAPI on port 8080
```

## Architecture

### Request Flow
```
Client (Next.js) → /api/* (Next.js rewrites) → Express API (port 3001) → Supabase DB
                                                      ↓ (on chat completion)
                                               Python Agents (port 8080)
                                                      ↓ (webhook callback)
                                               Express API → updates DB
```

Next.js rewrites `/api/*` requests to the backend URL configured via `NEXT_PUBLIC_BACKEND_URL` (see `next.config.ts`).

### AI Model Routing (server/src/services/ai/)
The backend routes LLM calls through multiple providers for resilience:
- **ai-router.service.ts** — Selects the best available model based on health, rate limits, and token capacity
- **models-config.ts** — Defines all available models across providers (Gemini, Groq, Cerebras, OpenRouter)
- **usage-manager.ts** — Tracks per-model usage against rate limits
- **model-health.ts** — Tracks failures and marks unhealthy models as unavailable

### Python Agents Pipeline (server/agents/)
When a chat completes, the Express backend sends the conversation to the Python microservice:
1. **Extractor** (`extractor.py`) — Gemini analyzes chat to extract travel parameters
2. **Amadeus Client** (`amadeus_client.py`) — Queries Amadeus API for flights
3. **Graph** (`graph.py`) — LangGraph orchestrates the extraction → search → callback workflow
4. Results are sent back via webhook to `POST /api/chats/webhook-callback`

### Database
- **Supabase (PostgreSQL)** — No ORM, direct Supabase client queries
- **Client**: `client/src/supabase/client.ts` (anon key, row-level security)
- **Server**: `server/src/supabase/admin.ts` (service role key, full access)
- Main tables: `chats`, `mensajes`, `usuarios`, `viajes`, `vuelos`, `hoteles`

### Authentication
Supabase Auth managed via React Context (`client/src/lib/auth/index.tsx`). Hooks: `useAuth()`, `useUser()`, `useSupabase()`.

## Naming Conventions

- **Database columns**: Spanish snake_case (`usuario_id`, `fecha_creacion`, `ultimo_mensaje_en`)
- **TypeScript API/code**: English camelCase (`userId`, `createdAt`)
- **Python**: snake_case (`extracted_travel_data`, `flight_results`)
- Mapping helpers in `shared/types/` convert between DB and API formats (e.g., `mapearChatDesdeBD()`)

## Key Directories

- `client/src/components/ui/` — Radix UI primitives (button, dialog, input, etc.)
- `client/src/services/` — API communication services
- `client/src/lib/auth/` — Auth context and providers
- `server/src/api/` — Express route controllers (`chat/`, `vuelo/`, `hotel/`, `viaje/`, `usuario/`)
- `server/src/services/ai/` — AI routing, model config, usage tracking, system prompts
- `server/src/validation/` — Zod schemas for request validation
- `shared/types/` — TypeScript types shared across client and server

## Environment Variables

### Client (`client/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL` (default: `http://localhost:3001`)

### Server (`server/.env`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`
- `AGENTS_URL` (default: `http://localhost:3003`)

### Python Agents (`server/agents/.env`)
- `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`, `AMADEUS_HOSTNAME`
- `GEMINI_API_KEY`
- `CALLBACK_URL`, `WEBHOOK_SECRET`
