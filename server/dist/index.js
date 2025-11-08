"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Cargar variables de entorno
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, '../.env')
});
// Importar rutas
const chat_controller_1 = __importDefault(require("./api/chat/chat.controller"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
console.log(`CLIENT_URL: ${process.env.CLIENT_URL}`);
// Middlewares
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Rutas API
app.use('/api/chat', chat_controller_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
        }
    });
});
// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
});
