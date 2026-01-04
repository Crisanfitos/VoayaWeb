module.exports = {

"[externals]/crypto [external] (crypto, cjs, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[externals]/crypto [external] (crypto, cjs)");
    });
});
}}),
"[project]/client/node_modules/gaxios/node_modules/https-proxy-agent/dist/index.js [app-rsc] (ecmascript, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[root-of-the-server]__5b0f6a9b._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/client/node_modules/gaxios/node_modules/https-proxy-agent/dist/index.js [app-rsc] (ecmascript)");
    });
});
}}),
"[project]/node_modules/node-fetch/src/index.js [app-rsc] (ecmascript, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/node_modules_node-fetch_src_utils_multipart-parser_956edc35.js",
  "server/chunks/ssr/node_modules_0f8e4341._.js",
  "server/chunks/ssr/[root-of-the-server]__a9a5f086._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/node-fetch/src/index.js [app-rsc] (ecmascript)");
    });
});
}}),

};