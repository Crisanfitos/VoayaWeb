export class ChatError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'ChatError';
    }
}

export class ChatErrorHandler {
    static handle(error: unknown): ChatError {
        if (error instanceof ChatError) {
            return error;
        }

        if (error instanceof Error) {
            // Manejar errores de Firebase
            if (error.message.includes('permission-denied')) {
                return new ChatError(
                    'No tienes permiso para realizar esta acción',
                    'PERMISSION_DENIED',
                    error
                );
            }

            // Manejar errores de Gemini
            if (error.message.includes('API_KEY')) {
                return new ChatError(
                    'Error de configuración del servicio AI',
                    'AI_CONFIG_ERROR',
                    error
                );
            }

            // Manejar errores de red
            if (error.message.includes('network')) {
                return new ChatError(
                    'Error de conexión. Por favor, verifica tu conexión a internet',
                    'NETWORK_ERROR',
                    error
                );
            }

            // Error genérico
            return new ChatError(
                'Ha ocurrido un error inesperado',
                'UNKNOWN_ERROR',
                error
            );
        }

        // Si no es un Error, convertirlo a uno
        return new ChatError(
            'Ha ocurrido un error inesperado',
            'UNKNOWN_ERROR',
            new Error(String(error))
        );
    }

    static async wrap<T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const chatError = this.handle(error);
            console.error(`Error in ${context}:`, chatError);
            throw chatError;
        }
    }
}