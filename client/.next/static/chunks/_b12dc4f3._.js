(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/client/src/config/api.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// Usar variable de entorno o detectar dinámicamente
__turbopack_context__.s({
    "API_URL": (()=>API_URL),
    "getApiUrl": (()=>getApiUrl)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const getApiUrl = ()=>{
    // Primero intenta usar la variable de entorno para flexibilidad
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL;
    }
    // En el lado del servidor (SSR) o en desarrollo local, apunta a localhost
    if ("object" === 'undefined' || window.location.hostname === 'localhost') {
        return 'http://localhost:3001/api';
    }
    // En producción (cuando se accede a través de un dominio), usa una ruta relativa
    // para que las peticiones se dirijan al mismo host que sirve la app Next.js.
    // Next.js se encargará de actuar como proxy para estas peticiones.
    return '/api';
};
const API_URL = getApiUrl();
console.log('[API Config] API_URL:', API_URL);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/client/src/services/api.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ApiService": (()=>ApiService)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/config/api.ts [app-client] (ecmascript)");
;
class ApiService {
    static async fetchApi(endpoint, options = {}) {
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_URL"]}${endpoint}`;
        try {
            console.log(`[ApiService] Fetching ${url}`, {
                method: options.method
            });
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            console.log(`[ApiService] Response received with status: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ApiService] API error: ${response.status}`, errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            const responseText = await response.text();
            console.log(`[ApiService] Raw response text:`, responseText);
            try {
                const data = JSON.parse(responseText);
                console.log(`[ApiService] Parsed response:`, data);
                return data;
            } catch (error) {
                console.error(`[ApiService] Error parsing JSON:`, error);
                // Si el parseo falla, pero la respuesta fue exitosa (ej. 204 No Content),
                // podríamos devolver un objeto vacío o el texto plano si es necesario.
                return {
                    success: true,
                    data: responseText
                };
            }
        } catch (error) {
            console.error(`[ApiService] Fetch error:`, error);
            throw error;
        }
    }
    static async startChat(userId, categories = []) {
        return this.fetchApi('/chat/start', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                categories
            })
        });
    }
    static async sendMessage(chatId, text, userId) {
        return this.fetchApi('/chat/message', {
            method: 'POST',
            body: JSON.stringify({
                chatId,
                text,
                userId
            })
        });
    }
    static async completeChat(chatId) {
        return this.fetchApi('/chat/complete', {
            method: 'POST',
            body: JSON.stringify({
                chatId
            })
        });
    }
    static async getChats(userId) {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return this.fetchApi(`/chat${qs}`, {
            method: 'GET'
        });
    }
    static async getChat(chatId) {
        if (!chatId) throw new Error('chatId required');
        return this.fetchApi(`/chat/${encodeURIComponent(chatId)}`, {
            method: 'GET'
        });
    }
    static async sendToExternal(chatId, webhookUrl) {
        return this.fetchApi('/chat/send-external', {
            method: 'POST',
            body: JSON.stringify({
                chatId,
                webhookUrl
            })
        });
    }
    static async generatePlan(brief, userLocation) {
        return this.fetchApi('/chat/generate-plan', {
            method: 'POST',
            body: JSON.stringify({
                brief,
                userLocation
            })
        });
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/client/src/components/chat/chat-view.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/services/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/lib/cookies.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const ChatView = ({ onChatComplete, error, initialQuery, selectedCategories, initialMessages, initialStatus })=>{
    _s();
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ChatView.useState": ()=>initialMessages || []
    }["ChatView.useState"]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isChatComplete, setIsChatComplete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(!!initialStatus && initialStatus === 'completed');
    const [internalInitialQuery, setInternalInitialQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialQuery || '');
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const initialMessageSent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Get userId and chatId from cookies
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUserIdFromCookie"])();
    const chatId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChatIdFromCookie"])();
    // Log initial status for debugging and detect if chat should show completion buttons
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatView.useEffect": ()=>{
            console.log('[ChatView] Initialized with initialStatus:', initialStatus);
            console.log('[ChatView] Initial messages count:', messages.length);
            // Show completion buttons if:
            // 1. Status is 'completed' or 'finished', OR
            // 2. Status is 'active' and there are messages (chat has content)
            const shouldShowComplete = initialStatus && (initialStatus === 'completed' || initialStatus === 'finished' || initialStatus === 'active' && messages.length > 0);
            console.log('[ChatView] shouldShowComplete:', shouldShowComplete);
            if (shouldShowComplete && !isChatComplete) {
                setIsChatComplete(true);
            }
        }
    }["ChatView.useEffect"], [
        initialStatus,
        messages.length,
        isChatComplete
    ]);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChatView.useCallback[sendMessage]": async (text)=>{
            console.log(`[ChatView] sendMessage called with: "${text}"`);
            console.log(`[ChatView] userId: ${userId}, chatId: ${chatId}`);
            if (!userId || !chatId) {
                console.error('[ChatView] Missing userId or chatId from cookies');
                setMessages({
                    "ChatView.useCallback[sendMessage]": (prev)=>[
                            ...prev,
                            {
                                role: 'assistant',
                                text: "Error: No se pudo identificar tu sesión. Por favor, inicia sesión de nuevo."
                            }
                        ]
                }["ChatView.useCallback[sendMessage]"]);
                return;
            }
            setIsLoading(true);
            try {
                console.log(`[ChatView] Calling ApiService.sendMessage...`);
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].sendMessage(chatId, text, userId);
                console.log(`[ChatView] Received response from API:`, response);
                if (!response.message || typeof response.message.text !== 'string') {
                    console.error('[ChatView] Invalid response structure:', response);
                    throw new Error('Invalid response structure from server');
                }
                const modelMessage = {
                    role: 'assistant',
                    text: response.message.text
                };
                console.log(`[ChatView] Updating messages state with new message...`);
                setMessages({
                    "ChatView.useCallback[sendMessage]": (prev)=>{
                        const newMessages = [
                            ...prev,
                            modelMessage
                        ];
                        console.log(`[ChatView] New messages state:`, newMessages);
                        return newMessages;
                    }
                }["ChatView.useCallback[sendMessage]"]);
                // Check if chat should be marked as complete based on the assistant's message
                if (modelMessage.text.includes("ya tengo una base muy sólida para empezar a buscar")) {
                    console.log(`[ChatView] Chat completion detected from Gemini response.`);
                    setIsChatComplete(true);
                }
            } catch (err) {
                console.error(`[ChatView] Error calling API:`, err);
                setMessages({
                    "ChatView.useCallback[sendMessage]": (prev)=>[
                            ...prev,
                            {
                                role: 'assistant',
                                text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo."
                            }
                        ]
                }["ChatView.useCallback[sendMessage]"]);
            } finally{
                console.log(`[ChatView] sendMessage finished.`);
                setIsLoading(false);
            }
        }
    }["ChatView.useCallback[sendMessage]"], [
        selectedCategories
    ]);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const userMessage = {
            role: 'user',
            text: input
        };
        setMessages((prev)=>[
                ...prev,
                userMessage
            ]);
        const currentInput = input;
        setInput('');
        if (!internalInitialQuery) {
            setInternalInitialQuery(currentInput);
        }
        await sendMessage(currentInput);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatView.useEffect": ()=>{
            if (initialQuery && !initialMessageSent.current) {
                const userMessage = {
                    role: 'user',
                    text: initialQuery
                };
                setMessages([
                    userMessage
                ]);
                setInternalInitialQuery(initialQuery);
                sendMessage(initialQuery);
                initialMessageSent.current = true;
            }
        }
    }["ChatView.useEffect"], [
        initialQuery,
        sendMessage
    ]);
    const handleConfirm = async ()=>{
        // Mark chat as completed before redirecting
        if (chatId) {
            try {
                console.log('[ChatView] Marking chat as completed...');
                await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].completeChat(chatId);
                console.log('[ChatView] Chat marked as completed');
            } catch (err) {
                console.error('[ChatView] Error completing chat:', err);
            }
        }
        // Reload the planner page
        window.location.href = '/plan';
    };
    const handleRestart = ()=>{
        setMessages([]);
        setInput('');
        setIsLoading(false);
        setIsChatComplete(false);
        setInternalInitialQuery('');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "container max-w-4xl mx-auto flex flex-col min-h-[700px] bg-gradient-to-b from-white to-gray-50/80 rounded-3xl shadow-xl overflow-hidden border border-gray-100/80",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "py-8 px-8 bg-white border-b border-gray-100/80",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
                                    children: "Tu próxima aventura te espera ✈️"
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 173,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500",
                                    children: "Charlemos sobre tu próximo viaje"
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 176,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 172,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100/80",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-2 h-2 rounded-full bg-green-400 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 179,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm text-gray-600 font-medium",
                                    children: "Voaya está activa"
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 180,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 178,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                    lineNumber: 171,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-8 py-3 bg-red-50 border-b border-red-100 text-red-600 text-center text-sm font-medium",
                children: error
            }, void 0, false, {
                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                lineNumber: 186,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto px-8 py-8 space-y-8",
                children: [
                    messages.map((msg, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex items-end gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`,
                            children: [
                                msg.role === 'assistant' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner flex-shrink-0 border-2 border-white",
                                    children: "V"
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 198,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `
                group max-w-[80%] px-6 py-4 rounded-2xl transition-all duration-200
                ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5' : 'bg-white text-gray-700 rounded-bl-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-gray-100'}
              `,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[15px] leading-relaxed whitespace-pre-wrap",
                                        children: msg.text
                                    }, void 0, false, {
                                        fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                        lineNumber: 211,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 202,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, index, true, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 193,
                            columnNumber: 11
                        }, this)),
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-end gap-4 justify-start animate-slideIn",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner flex-shrink-0 border-2 border-white",
                                children: "V"
                            }, void 0, false, {
                                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                lineNumber: 218,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "max-w-[80%] px-5 py-4 rounded-2xl bg-white shadow-md border border-gray-100 rounded-bl-sm",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"
                                        }, void 0, false, {
                                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                            lineNumber: 223,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"
                                        }, void 0, false, {
                                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                            lineNumber: 224,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"
                                        }, void 0, false, {
                                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                            lineNumber: 225,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 222,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                lineNumber: 221,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/src/components/chat/chat-view.tsx",
                        lineNumber: 217,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: messagesEndRef
                    }, void 0, false, {
                        fileName: "[project]/client/src/components/chat/chat-view.tsx",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                lineNumber: 191,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-8 bg-white border-t border-gray-100/80",
                children: isChatComplete ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleRestart,
                            className: "px-8 py-4 rounded-full bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 shadow-sm hover:shadow",
                            children: "Reiniciar Chat"
                        }, void 0, false, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 236,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleConfirm,
                            className: "px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg",
                            children: "Confirmar y Buscar"
                        }, void 0, false, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 242,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                    lineNumber: 235,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: handleSubmit,
                    className: "flex items-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative flex-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: input,
                                onChange: (e)=>setInput(e.target.value),
                                placeholder: "Ej.: París, 2 personas, mayo...",
                                className: "w-full px-6 py-4 bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 placeholder:text-gray-400 shadow-sm hover:shadow-md",
                                disabled: isLoading
                            }, void 0, false, {
                                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                lineNumber: 252,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 251,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "submit",
                            disabled: isLoading || !input.trim(),
                            className: "p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                xmlns: "http://www.w3.org/2000/svg",
                                className: "h-6 w-6",
                                viewBox: "0 0 20 20",
                                fill: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                                }, void 0, false, {
                                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                    lineNumber: 267,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                                lineNumber: 266,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/client/src/components/chat/chat-view.tsx",
                            lineNumber: 261,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/client/src/components/chat/chat-view.tsx",
                    lineNumber: 250,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/client/src/components/chat/chat-view.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/src/components/chat/chat-view.tsx",
        lineNumber: 169,
        columnNumber: 5
    }, this);
};
_s(ChatView, "ZocjT95pHpUFVUB9rqZv/DjbPQs=");
_c = ChatView;
const __TURBOPACK__default__export__ = ChatView;
var _c;
__turbopack_context__.k.register(_c, "ChatView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/client/src/app/chats/[chatId]/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ChatPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$components$2f$chat$2f$chat$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/components/chat/chat-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/services/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/lib/cookies.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function ChatPage() {
    _s();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const chatId = params?.chatId;
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [chatStatus, setChatStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(undefined);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatPage.useEffect": ()=>{
            if (!chatId) {
                router.push('/chats');
                return;
            }
            // Save chatId to cookie so ChatView and other parts can use it
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveChatIdToCookie"])(chatId);
            const load = {
                "ChatPage.useEffect.load": async ()=>{
                    setLoading(true);
                    try {
                        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getChat(chatId);
                        console.log('[ChatPage] Loaded chat data:', res?.chat);
                        console.log('[ChatPage] Chat status:', res?.chat?.status);
                        console.log('[ChatPage] Number of messages:', res?.messages?.length);
                        setMessages(res?.messages || []);
                        setChatStatus(res?.chat?.status);
                    } catch (err) {
                        console.error('Failed to load chat', err);
                        setError(err?.message || 'Error cargando chat');
                    } finally{
                        setLoading(false);
                    }
                }
            }["ChatPage.useEffect.load"];
            load();
        }
    }["ChatPage.useEffect"], [
        chatId,
        router
    ]);
    const handleChatComplete = async (brief)=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].completeChat(chatId || '');
            setChatStatus('completed');
        } catch (err) {
            console.error('Failed to complete chat', err);
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-screen",
            children: "Cargando chat…"
        }, void 0, false, {
            fileName: "[project]/client/src/app/chats/[chatId]/page.tsx",
            lineNumber: 59,
            columnNumber: 12
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-8 text-red-600",
            children: error
        }, void 0, false, {
            fileName: "[project]/client/src/app/chats/[chatId]/page.tsx",
            lineNumber: 63,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "py-8 md:py-12 min-h-screen bg-gray-50/50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$components$2f$chat$2f$chat$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            onChatComplete: handleChatComplete,
            error: null,
            initialMessages: messages,
            initialStatus: chatStatus,
            userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUserIdFromCookie"])() || undefined,
            chatId: chatId
        }, void 0, false, {
            fileName: "[project]/client/src/app/chats/[chatId]/page.tsx",
            lineNumber: 68,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/client/src/app/chats/[chatId]/page.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_s(ChatPage, "VxVW4jDfpWKxQ0ZXr5Vty7DkRNI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ChatPage;
var _c;
__turbopack_context__.k.register(_c, "ChatPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=_b12dc4f3._.js.map