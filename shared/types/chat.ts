/**
 * Tipos de datos para Chats y Mensajes
 * Corresponde a las tablas `chats` y `mensajes` en la base de datos
 */

// === TIPOS EN ESPAÑOL ===
export type EstadoChat = 'active' | 'completed' | 'archived';
export type RolMensaje = 'user' | 'assistant' | 'system';
export type CategoriaChat = 'flights' | 'hotels' | 'experiences';

export interface MetadatosChat {
    destino?: string;
    fechas?: {
        inicio?: string; // ISO date
        fin?: string;    // ISO date
    };
    viajeros?: number;
    preferencias?: Record<string, any>;
    [key: string]: any;
}

export interface Chat {
    id: string;
    usuarioId: string | null;
    fechaCreacion: string; // ISO date string
    titulo: string;
    estado: EstadoChat;
    categorias: CategoriaChat[];
    ultimoMensajeEn: string; // ISO date string
    metadatos: MetadatosChat;
    esFavorito?: boolean;
    imagenUrl?: string;
}

export interface Mensaje {
    id: string;
    chatId: string;
    rol: RolMensaje;
    texto: string;
    fechaCreacion: string; // ISO date string
    usuarioId?: string | null;
}

export interface InstanciaChat {
    id: string;
    geminiChat: any; // Tipo específico de Gemini
    metadatos: MetadatosChat;
}

// === ALIASES PARA COMPATIBILIDAD (DEPRECADOS) ===
// TODO: Migrar todo el código a usar los nombres en español y eliminar estos aliases

/** @deprecated Usar EstadoChat */
export type ChatStatus = EstadoChat;
/** @deprecated Usar RolMensaje */
export type MessageRole = RolMensaje;
/** @deprecated Usar CategoriaChat */
export type ChatCategory = CategoriaChat;
/** @deprecated Usar MetadatosChat */
export type ChatMetadata = MetadatosChat;
/** @deprecated Usar Mensaje */
export type Message = Mensaje;
/** @deprecated Usar InstanciaChat */
export type ChatInstance = InstanciaChat;

// === HELPERS DE MAPEO ===

/**
 * Helper para mapear datos de DB (snake_case) a API (camelCase en español)
 */
export function mapearChatDesdeBD(chat: any): Chat {
    return {
        id: chat.id,
        usuarioId: chat.usuario_id,
        fechaCreacion: chat.fecha_creacion,
        titulo: chat.titulo || 'Sin título',
        estado: chat.estado,
        categorias: chat.categorias || [],
        ultimoMensajeEn: chat.ultimo_mensaje_en,
        metadatos: chat.metadatos || {},
        esFavorito: chat.es_favorito || false,
        imagenUrl: chat.imagen_url,
    };
}

/**
 * Helper para mapear datos de API a DB
 */
export function mapearChatABD(chat: Partial<Chat>): Record<string, any> {
    const resultado: Record<string, any> = {};

    if (chat.usuarioId !== undefined) resultado.usuario_id = chat.usuarioId;
    if (chat.titulo !== undefined) resultado.titulo = chat.titulo;
    if (chat.estado !== undefined) resultado.estado = chat.estado;
    if (chat.categorias !== undefined) resultado.categorias = chat.categorias;
    if (chat.metadatos !== undefined) resultado.metadatos = chat.metadatos;
    if (chat.esFavorito !== undefined) resultado.es_favorito = chat.esFavorito;
    if (chat.imagenUrl !== undefined) resultado.imagen_url = chat.imagenUrl;

    return resultado;
}

/**
 * Helper para mapear mensaje de DB a API
 */
export function mapearMensajeDesdeBD(msg: any): Mensaje {
    return {
        id: msg.id,
        chatId: msg.chat_id,
        rol: msg.rol,
        texto: msg.contenido,
        fechaCreacion: msg.fecha_creacion,
        usuarioId: msg.usuario_id,
    };
}

/**
 * Helper para mapear mensaje de API a DB
 */
export function mapearMensajeABD(msg: Partial<Mensaje>): Record<string, any> {
    const resultado: Record<string, any> = {};

    if (msg.chatId !== undefined) resultado.chat_id = msg.chatId;
    if (msg.rol !== undefined) resultado.rol = msg.rol;
    if (msg.texto !== undefined) resultado.contenido = msg.texto;
    if (msg.usuarioId !== undefined) resultado.usuario_id = msg.usuarioId;

    return resultado;
}