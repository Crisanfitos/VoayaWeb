module.exports = {

"[project]/client/src/config/api.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// Usar variable de entorno o detectar dinámicamente
__turbopack_context__.s({
    "API_URL": (()=>API_URL),
    "getApiUrl": (()=>getApiUrl)
});
const getApiUrl = ()=>{
    // Primero intenta usar la variable de entorno para flexibilidad
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    // En el lado del servidor (SSR) o en desarrollo local, apunta a localhost
    if ("TURBOPACK compile-time truthy", 1) {
        return 'http://localhost:3001/api';
    }
    "TURBOPACK unreachable";
};
const API_URL = getApiUrl();
console.log('[API Config] API_URL:', API_URL);
}}),
"[project]/client/src/services/api.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ApiService": (()=>ApiService)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/config/api.ts [app-ssr] (ecmascript)");
;
class ApiService {
    static async fetchApi(endpoint, options = {}) {
        const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["API_URL"]}${endpoint}`;
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
}}),
"[project]/client/src/app/chats/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ChatsPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/lib/cookies.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/src/services/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const statusColors = {
    'En proceso': 'bg-yellow-100 text-yellow-800',
    'Finalizado': 'bg-green-100 text-green-800'
};
function ChatsPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [chats, setChats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const load = async ()=>{
            setLoading(true);
            try {
                const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserIdFromCookie"])() || undefined;
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiService"].getChats(userId);
                setChats(res?.chats || []);
            } catch (err) {
                console.error('Failed to load chats', err);
                setError(err?.message || 'Error cargando chats');
            } finally{
                setLoading(false);
            }
        };
        load();
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-gray-50 py-8 px-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-3xl font-bold mb-6 text-gray-900",
                children: "Mis Chats"
            }, void 0, false, {
                fileName: "[project]/client/src/app/chats/page.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-gray-600",
                children: "Cargando chats…"
            }, void 0, false, {
                fileName: "[project]/client/src/app/chats/page.tsx",
                lineNumber: 48,
                columnNumber: 19
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-600",
                children: error
            }, void 0, false, {
                fileName: "[project]/client/src/app/chats/page.tsx",
                lineNumber: 49,
                columnNumber: 17
            }, this),
            !loading && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
                children: [
                    chats.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-600",
                        children: "No tienes chats todavía. Inicia una conversación desde el planificador."
                    }, void 0, false, {
                        fileName: "[project]/client/src/app/chats/page.tsx",
                        lineNumber: 54,
                        columnNumber: 13
                    }, this),
                    chats.map((chat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                try {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$src$2f$lib$2f$cookies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveChatIdToCookie"])(chat.id);
                                } catch (e) {
                                    console.error('Failed to save chatId cookie', e);
                                }
                                router.push(`/chats/${chat.id}`);
                            },
                            className: "text-left rounded-lg shadow-md bg-white p-6 flex flex-col justify-between hover:shadow-lg transition-shadow",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-semibold text-gray-800 mb-2",
                                            children: chat.title || 'Sin título'
                                        }, void 0, false, {
                                            fileName: "[project]/client/src/app/chats/page.tsx",
                                            lineNumber: 71,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${statusColors[chat.status || 'Finalizado']}`,
                                            children: chat.status || 'Finalizado'
                                        }, void 0, false, {
                                            fileName: "[project]/client/src/app/chats/page.tsx",
                                            lineNumber: 72,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/src/app/chats/page.tsx",
                                    lineNumber: 70,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 text-xs text-gray-500",
                                    children: [
                                        "ID: ",
                                        chat.id
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/src/app/chats/page.tsx",
                                    lineNumber: 78,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, chat.id, true, {
                            fileName: "[project]/client/src/app/chats/page.tsx",
                            lineNumber: 58,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/client/src/app/chats/page.tsx",
                lineNumber: 52,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/src/app/chats/page.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
} // ...existing code...
}}),
"[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-ssr] (ecmascript)");
}}),

};

//# sourceMappingURL=_06d4cefd._.js.map