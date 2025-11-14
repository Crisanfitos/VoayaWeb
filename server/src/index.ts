import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno según el ambiente
const envPath = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../.env.production')
    : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

console.log(`Loading environment variables from: ${envPath}`);

// Importar rutas
import chatRoutes from './api/chat/chat.controller';

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API
app.use('/api/chat', chatRoutes);

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

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
});