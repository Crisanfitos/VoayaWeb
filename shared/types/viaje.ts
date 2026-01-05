/**
 * Tipos de datos para Viajes
 * Corresponde a la tabla `viajes` en la base de datos
 * Agrupa vuelos y hoteles en un viaje cohesivo
 */

import { Vuelo } from './vuelo';
import { ReservaHotel } from './hotel';

export type EstadoViaje = 'borrador' | 'planificando' | 'confirmado' | 'completado' | 'cancelado';

export interface DiaItinerario {
    dia: number;
    titulo: string;
    manana: string;
    tarde: string;
    noche: string;
    alojamiento: string;
}

export interface Viaje {
    id: string;
    usuarioId: string;
    chatId?: string;

    // Información del viaje
    destino: string;
    fechaInicio: string;
    fechaFin: string;
    estado: EstadoViaje;
    imagenUrl?: string;

    // Componentes del viaje
    vuelos: Vuelo[];
    hoteles: ReservaHotel[];

    // Itinerario generado por IA
    itinerario?: DiaItinerario[];

    // Metadata
    metadatos: Record<string, any>;
    fechaCreacion: string;
    fechaActualizacion: string;
}

/**
 * Viaje sin componentes (solo datos de la tabla viajes)
 */
export interface ViajeBase {
    id: string;
    usuarioId: string;
    chatId?: string;
    destino: string;
    fechaInicio: string;
    fechaFin: string;
    estado: EstadoViaje;
    imagenUrl?: string;
    itinerario?: DiaItinerario[];
    metadatos: Record<string, any>;
    fechaCreacion: string;
    fechaActualizacion: string;
}

/**
 * Helper para mapear datos de DB (snake_case) a API (camelCase)
 */
export function mapearViajeDesdeBD(viaje: any): ViajeBase {
    return {
        id: viaje.id,
        usuarioId: viaje.usuario_id,
        chatId: viaje.chat_id,
        destino: viaje.destino || '',
        fechaInicio: viaje.fecha_inicio,
        fechaFin: viaje.fecha_fin,
        estado: viaje.estado,
        imagenUrl: viaje.imagen_url,
        itinerario: viaje.itinerario || [],
        metadatos: viaje.metadatos || {},
        fechaCreacion: viaje.fecha_creacion,
        fechaActualizacion: viaje.fecha_actualizacion,
    };
}

/**
 * Helper para mapear datos de API (camelCase) a DB (snake_case)
 */
export function mapearViajeABD(viaje: Partial<ViajeBase>): Record<string, any> {
    const resultado: Record<string, any> = {};

    if (viaje.usuarioId !== undefined) resultado.usuario_id = viaje.usuarioId;
    if (viaje.chatId !== undefined) resultado.chat_id = viaje.chatId;
    if (viaje.destino !== undefined) resultado.destino = viaje.destino;
    if (viaje.fechaInicio !== undefined) resultado.fecha_inicio = viaje.fechaInicio;
    if (viaje.fechaFin !== undefined) resultado.fecha_fin = viaje.fechaFin;
    if (viaje.estado !== undefined) resultado.estado = viaje.estado;
    if (viaje.imagenUrl !== undefined) resultado.imagen_url = viaje.imagenUrl;
    if (viaje.itinerario !== undefined) resultado.itinerario = viaje.itinerario;
    if (viaje.metadatos !== undefined) resultado.metadatos = viaje.metadatos;

    return resultado;
}

/**
 * Tabs para filtrar viajes en la UI
 */
export type TabViajes = 'programados' | 'borradores' | 'pasados';
