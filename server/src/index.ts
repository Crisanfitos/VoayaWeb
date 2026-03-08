import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Cargar variables de entorno según el ambiente
const envPath = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../.env.production')
    : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

console.log(`Loading environment variables from: ${envPath}`);
console.log(`DUFFEL_TOKEN_LOADED: ${!!process.env.DUFFEL_ACCESS_TOKEN}`);
if (process.env.DUFFEL_ACCESS_TOKEN) {
    console.log(`DUFFEL_TOKEN_PREFIX: ${process.env.DUFFEL_ACCESS_TOKEN.substring(0, 12)}...`);
}

// Importar rutas
import chatRoutes from './api/chat/chat.controller';
import vueloRoutes from './api/vuelo/vuelo.controller';
import hotelRoutes from './api/hotel/hotel.controller';
import viajeRoutes from './api/viaje/viaje.controller';
import usuarioRoutes from './api/usuario/usuario.controller';

const app = express();
const port = process.env.PORT || 3001;

console.log(`CLIENT_URL: ${process.env.CLIENT_URL}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Configurar CORS según el ambiente
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:9002', 'http://localhost:3000'];

console.log(`CORS allowed origins: ${corsOrigins.join(', ')}`);

// Middlewares
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting configuration
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: { error: 'Too many messages, please wait a moment' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', generalLimiter);

// Health check endpoint (not rate limited)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API (chat has additional stricter limit)
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/vuelos', vueloRoutes);
app.use('/api/hoteles', hotelRoutes);
app.use('/api/viajes', viajeRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
        }
    });
});

// Exportar app para tests
export default app;

// Iniciar servidor solo si no es test
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`Health check available at http://localhost:${port}/health`);
    });
}
