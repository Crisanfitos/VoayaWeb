# Flight Search Agent Microservice

Microservicio Python con LangGraph para análisis automático de chats de viaje y búsqueda de vuelos.

## 🚀 Quick Start

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus API keys
```

**Variables necesarias:**
- `AMADEUS_API_KEY` / `AMADEUS_API_SECRET` - De [Amadeus for Developers](https://developers.amadeus.com)
- `GEMINI_API_KEY` - Misma key que usa tu backend Bun
- `WEBHOOK_SECRET` - Mismo secret que usa tu backend

### 2. Iniciar con Docker

```bash
cd server/agents
docker-compose up --build
```

### 3. Acceder al Monitor

Abre [http://localhost:8080](http://localhost:8080) para ver el dashboard de monitoreo en tiempo real.

## 📊 Dashboard de Monitoreo

El dashboard muestra:
- **Logs en tiempo real** - Streaming SSE de todos los eventos
- **Estadísticas** - Chats procesados, vuelos encontrados, tiempos
- **Últimos resultados** - Búsquedas recientes

## 🔧 API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Dashboard de monitoreo |
| `/health` | GET | Health check |
| `/analyze-and-search` | POST | Procesar chat y buscar vuelos |
| `/logs` | GET | Obtener logs recientes |
| `/logs/stream` | GET | SSE stream de logs |
| `/results/{chatId}` | GET | Resultado de un chat |

## 🏗️ Arquitectura

```
[Chat Completado] 
      ↓
[Backend Bun] → POST /analyze-and-search
      ↓
[Agente Extractor] → Analiza chat con Gemini
      ↓
[Agente Búsqueda] → Busca en Amadeus API
      ↓
[Callback] → POST /webhook-callback → Actualiza metadatos
```

## 📁 Estructura

```
agents/
├── main.py           # FastAPI server + Dashboard UI
├── graph.py          # LangGraph orchestrator
├── extractor.py      # Chat analysis with Gemini
├── amadeus_client.py # Amadeus flight search
├── schemas.py        # Pydantic models
├── logger.py         # Real-time logging
├── Dockerfile
├── docker-compose.yml
└── .env
```

## 🧪 Desarrollo Local (sin Docker)

```bash
cd server/agents
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```
