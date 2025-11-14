// Usar variable de entorno o detectar dinámicamente
export const getApiUrl = (): string => {
    // Primero intenta usar la variable de entorno para flexibilidad
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // En el lado del servidor (SSR) o en desarrollo local, apunta a localhost
    if (typeof window === 'undefined' || window.location.hostname === 'localhost') {
        return 'http://localhost:3001';
    }

    // En producción (cuando se accede a través de un dominio), usa una ruta relativa
    // para que las peticiones se dirijan al mismo host que sirve la app Next.js.
    // Next.js se encargará de actuar como proxy para estas peticiones.
    return '/api';
};

export const API_URL = getApiUrl();



console.log('[API Config] API_URL:', API_URL);
