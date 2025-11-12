Voaya - n8n workflow: Extract Chat Metadata

Archivos:
- voaya-extract-metadata-workflow.json  -> workflow export (import into n8n)

Resumen del flujo (nodos):
1) Webhook (Trigger)
   - Path: /webhook/voaya/extract-metadata (configurable)
   - Recibe: { chat, messages, secret, systemPrompt? }
2) Set (Prepare Prompt)
   - Normaliza systemPrompt, chatId y construye un string con el historial
3) HTTP Request (Call LLM)
   - Llama a la API del modelo (OpenAI / GenAI) con el prompt
   - Variables requeridas: OPENAI_API_KEY, OPENAI_MODEL (o configurado en el nodo)
4) Function (Parse LLM Output)
   - Parsea la salida del LLM y extrae un JSON: { chatId, metadata }
5) HTTP Request (Callback Voaya)
   - POST a https://TU-VOAYA-SERVER/api/chat/webhook-callback
   - Body: { chatId, metadata, secret }

Variables de entorno/credenciales en n8n:
- OPENAI_API_KEY: clave para llamar a OpenAI
- OPENAI_MODEL: (opcional) modelo a usar, por ejemplo "gpt-4o-mini"
- VOAYA_CALLBACK_URL: URL pública del endpoint de Voaya que recibirá el callback (ej: https://mi-server.com/api/chat/webhook-callback)
- WEBHOOK_SECRET: (opcional) secreto para verificar la callback

Instrucciones de importación en n8n:
1. En n8n, ve a Workflows -> Import
2. Selecciona `voaya-extract-metadata-workflow.json`
3. Rellena las credenciales (OPENAI_API_KEY) en las credenciales de n8n o como variables de entorno
4. Ajusta el path del Webhook trigger si lo deseas

Notas:
- El workflow asume que el LLM devolverá un JSON puro. Si el modelo devuelve texto, la función "Parse LLM Output" intenta extraer el primer bloque JSON del texto.
- Puedes adaptar el nodo HTTP Request a tu proveedor de LLM (Google GenAI, OpenAI, etc.).
- Si tu Voaya server no es público, usa ngrok o similar para exponer temporalmente el callback para pruebas.

Ejemplo de payload enviado por Voaya a n8n (POST):
{
  "chat": { "id": "abc123", "userId": "u1", "categories": ["flights"], ... },
  "messages": [ {"role":"user","text":"Quiero viajar a Barcelona"}, ... ],
  "secret": "my-secret",
  "systemPrompt": "(opcional) sobreescribe system prompt"
}

Ejemplo de respuesta esperada por n8n a Voaya (callback):
POST https://mi-server.com/api/chat/webhook-callback
Body:
{
  "chatId": "abc123",
  "metadata": {
    "destination": "Barcelona",
    "dates": { "start": "2025-07-15", "end": "2025-07-20" },
    "travelers": 2,
    "categories": ["flights"]
  },
  "secret": "my-secret"
}

Si quieres, genero también un export válido listo para importar (he creado un JSON base que puedes revisar). Si quieres que lo deje más preciso (por ejemplo con credenciales de OpenAI configuradas en n8n), dime y lo actualizo.
