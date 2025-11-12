// Detectar la URL del API basado en el host actual
export const getApiUrl = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3001'; // SSR
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost) {
        return 'http://localhost:3001';
    } else {
        // Para acceso remoto, usar la misma IP/host
        return `http://${hostname}:3001`;
    }
};

export const API_URL = getApiUrl();
