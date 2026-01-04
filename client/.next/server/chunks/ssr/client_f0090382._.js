module.exports = {

"[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"600051d6287339abf421cd2efb00cec4559963d6c7":"sendConversationToWebhook","7ff68d4732d783905755fa3c43c518e55a123ff443":"generatePlan"},"",""] */ __turbopack_context__.s({
    "generatePlan": (()=>generatePlan),
    "sendConversationToWebhook": (()=>sendConversationToWebhook)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/generative-ai/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function sendConversationToWebhook(brief, webhookUrl = 'https://n8n.voaya.es/webhook-test/40e869f7-f18a-42e5-b16c-1b2e134660b8') {
    try {
        const params = new URLSearchParams();
        params.append('initialQuery', brief.initialQuery ?? '');
        params.append('chatHistory', JSON.stringify(brief.chatHistory.map((m)=>({
                role: m.role,
                text: m.text
            }))));
        params.append('createdAt', new Date().toISOString());
        const url = `${webhookUrl}?${params.toString()}`;
        const res = await fetch(url, {
            method: 'GET'
        });
        if (!res.ok) {
            const text = await res.text().catch(()=>'');
            console.error('Webhook error', res.status, text);
            throw new Error(`Webhook responded with status ${res.status}`);
        }
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await res.json();
        }
        return null;
    } catch (err) {
        console.error('Error sending conversation to webhook:', err);
        throw err;
    }
}
const generatePlan = async (brief, userLocation)=>{
    try {
        await sendConversationToWebhook(brief);
    } catch (err) {
        console.warn('sendConversationToWebhook failed:', err);
    }
    const planGenerationModelName = 'gemini-1.5-pro';
    const serverGenAI = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GoogleGenerativeAI"](process.env.GEMINI_API_KEY);
    const planGenerationModel = serverGenAI.getGenerativeModel({
        model: planGenerationModelName,
        tools: [
            {
                googleSearch: {}
            }
        ]
    });
    const briefText = `Idea inicial: "${brief.initialQuery}".\n\nHistorial de la conversación:\n${brief.chatHistory.map((m)=>`${m.role}: ${m.text}`).join('\n')}`;
    const prompt = `
Eres "Cerebro IA", un planificador de viajes experto. Tu tarea es crear un itinerario de viaje completo basado en el siguiente resumen del usuario:\n${briefText}\n
DEBES usar tus herramientas googleSearch y googleMaps para recopilar información actualizada y del mundo real sobre vuelos, puntos de interés y logística.

Sigue estos pasos:
1.  **Vuelos:** Encuentra las 2-3 mejores opciones de vuelo. Incluye un precio aproximado, aerolínea/escalas y un enlace directo a una búsqueda de Google Flights pre-rellenada para que el usuario reserve.
2.  **Puntos de Interés (POIs):** Basado en los intereses del usuario, encuentra atracciones, actividades y lugares "imperdibles" relevantes.
3.  **Itinerario:** Crea un itinerario lógico, día por día. Para cada día, describe las actividades y calcula tiempos de viaje realistas entre ubicaciones. Sugiere tipos de alojamiento.
4.  **Enlace del Mapa:** Genera una URL de Google Maps que muestre la ruta con todos los POIs clave como puntos de referencia.

Tu resultado final DEBE ser un único objeto JSON encerrado en un bloque de código markdown (ej. 
\`\`\`json ... \`\`\`). No agregues ningún otro texto antes o después del bloque JSON. El objeto JSON debe seguir estrictamente este esquema:
{
  "summary": {
    "destination": "string",
    "dates": "string",
    "travelers": "string",
    "style": "string"
  },
  "flights": [
    {
      "type": "string (e.g., 'Best Value', 'Fastest')",
      "price": "string (e.g., '~€450')",
      "details": "string (e.g., 'KLM, 1 stop in Amsterdam')",
      "link": "string (URL)"
    }
  ],
  "mapUrl": "string (Google Maps URL with waypoints)",
  "itinerary": [
    {
      "day": "number",
      "title": "string",
      "morning": "string",
      "afternoon": "string",
      "evening": "string",
      "accommodation": "string (e.g., 'Suggested Hotel in Flåm')"
    }
  ]
}
`;
    try {
        const result = await planGenerationModel.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch || !jsonMatch[1]) {
            throw new Error("Could not find a valid JSON block in the model's response.");
        }
        const parsedPlan = JSON.parse(jsonMatch[1]);
        const attributions = response.candidates?.[0]?.citationMetadata?.citationSources.map((source)=>({
                uri: source.uri ?? '',
                title: '' // Title is not directly available in this structure
            })) || [];
        return {
            ...parsedPlan,
            groundingAttribution: attributions
        };
    } catch (error) {
        console.error("Error generating plan:", error);
        throw new Error("Failed to generate travel plan from the model.");
    }
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    sendConversationToWebhook,
    generatePlan
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendConversationToWebhook, "600051d6287339abf421cd2efb00cec4559963d6c7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(generatePlan, "7ff68d4732d783905755fa3c43c518e55a123ff443", null);
}}),
"[project]/client/src/app/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"609cc85fb48e2475aae358a0263cfba6db8de3cf03":"processAndSendData"},"",""] */ __turbopack_context__.s({
    "processAndSendData": (()=>processAndSendData)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function processAndSendData(history, category) {
    switch(category){
        case 'flights':
            try {
                // Enviar el historial del chat al webhook de n8n para extracción de datos
                console.log("Enviando historial del chat a n8n para extracción...");
                const webhookUrl = 'https://n8n.voaya.es/webhook/flight-search';
                console.log(`Enviando datos a ${webhookUrl}...`);
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chatHistory: history,
                        category: 'flights',
                        timestamp: new Date().toISOString()
                    })
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Error del webhook: ${response.status} ${response.statusText}`, errorBody);
                    return {
                        success: false,
                        message: `El servidor de Voaya respondió con un error: ${response.statusText}`
                    };
                }
                const responseData = await response.json();
                console.log("Respuesta del webhook:", responseData);
                return {
                    success: true,
                    message: "¡Búsqueda de vuelos iniciada con éxito!",
                    data: responseData
                };
            } catch (error) {
                console.error("Error procesando la solicitud de vuelos:", error);
                const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
                return {
                    success: false,
                    message: `Error interno: ${errorMessage}`
                };
            }
        case 'hotels':
            // TODO: Implementar lógica para hoteles
            console.log("Procesamiento para 'hoteles' aún no implementado.");
            return {
                success: false,
                message: "La categoría 'hoteles' aún no está implementada."
            };
        case 'experiences':
            // TODO: Implementar lógica para experiencias
            console.log("Procesamiento para 'experiencias' aún no implementado.");
            return {
                success: false,
                message: "La categoría 'experiencias' aún no está implementada."
            };
        default:
            console.warn(`Categoría desconocida: ${category}`);
            return {
                success: false,
                message: `La categoría '${category}' no es válida.`
            };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    processAndSendData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(processAndSendData, "609cc85fb48e2475aae358a0263cfba6db8de3cf03", null);
}}),
"[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => \"[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/client/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/app/actions.ts [app-rsc] (ecmascript)");
;
;
}}),
"[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => \"[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/client/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/app/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f2e$next$2d$internal$2f$server$2f$app$2f$plan$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => "[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/client/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => \"[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/client/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "609cc85fb48e2475aae358a0263cfba6db8de3cf03": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["processAndSendData"]),
    "7ff68d4732d783905755fa3c43c518e55a123ff443": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generatePlan"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/app/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f2e$next$2d$internal$2f$server$2f$app$2f$plan$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => "[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/client/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => \"[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/client/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "609cc85fb48e2475aae358a0263cfba6db8de3cf03": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$client$2f2e$next$2d$internal$2f$server$2f$app$2f$plan$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["609cc85fb48e2475aae358a0263cfba6db8de3cf03"]),
    "7ff68d4732d783905755fa3c43c518e55a123ff443": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$client$2f2e$next$2d$internal$2f$server$2f$app$2f$plan$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["7ff68d4732d783905755fa3c43c518e55a123ff443"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f2e$next$2d$internal$2f$server$2f$app$2f$plan$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => "[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/client/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f2e$next$2d$internal$2f$server$2f$app$2f$plan$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2f$chat$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$client$2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/client/.next-internal/server/app/plan/page/actions.js { ACTIONS_MODULE0 => "[project]/client/src/app/actions/chat-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/client/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/client/src/app/favicon.ico.mjs { IMAGE => \"[project]/client/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/client/src/app/favicon.ico.mjs { IMAGE => \"[project]/client/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/client/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/client/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/client/src/app/loading.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/client/src/app/loading.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/client/src/app/plan/page.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/client/src/app/plan/page.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/client/src/app/plan/page.tsx <module evaluation>", "default");
}}),
"[project]/client/src/app/plan/page.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/client/src/app/plan/page.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/client/src/app/plan/page.tsx", "default");
}}),
"[project]/client/src/app/plan/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$plan$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/client/src/app/plan/page.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$plan$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/client/src/app/plan/page.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$app$2f$plan$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/client/src/app/plan/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/client/src/app/plan/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=client_f0090382._.js.map