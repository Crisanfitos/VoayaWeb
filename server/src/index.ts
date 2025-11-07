import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

// Importar rutas
import chatRoutes from './api/chat/chat.controller';

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:9002',
    credentials: true
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