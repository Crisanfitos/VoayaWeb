/**
 * Tipos de datos para Vuelos
 * Corresponde a la tabla `vuelos` en la base de datos
 */

export type EstadoVuelo = 'pendiente' | 'confirmado' | 'completado' | 'cancelado';

export interface SegmentoVuelo {
    aerolinea: string;
    numeroVuelo: string;
    origen: string;
    destino: string;
    fechaSalida: string;  // ISO date
    fechaLlegada: string; // ISO date
}

export interface Vuelo {
    id: string;
    usuarioId: string;
    chatId?: string;
    viajeId?: string;
    estado: EstadoVuelo;

    // Información de reserva
    codigoReserva?: string;        // PNR Agencia
    localizadorProveedor?: string; // PNR Aerolínea
    urlBillete?: string;
    urlCheckIn?: string;

    // Itinerario
    esDirecto: boolean;
    aeropuertoOrigen: string;
    aeropuertoDestino: string;
    fechaSalida: string;
    fechaLlegada: string;
    escalas: SegmentoVuelo[];

    // Precio
    precio: number;
    moneda: string;

    // Metadata
    metadatos: Record<string, any>;
    fechaCreacion: string;
    fechaActualizacion: string;
}

/**
 * Helper para mapear datos de DB (snake_case) a API (camelCase)
 */
export function mapearVueloDesdeBD(vuelo: any): Vuelo {
    return {
        id: vuelo.id,
        usuarioId: vuelo.usuario_id,
        chatId: vuelo.chat_id,
        viajeId: vuelo.viaje_id,
        estado: vuelo.estado,
        codigoReserva: vuelo.codigo_reserva,
        localizadorProveedor: vuelo.localizador_proveedor,
        urlBillete: vuelo.url_billete,
        urlCheckIn: vuelo.url_check_in,
        esDirecto: vuelo.es_directo,
        aeropuertoOrigen: vuelo.aeropuerto_origen,
        aeropuertoDestino: vuelo.aeropuerto_destino,
        fechaSalida: vuelo.fecha_salida,
        fechaLlegada: vuelo.fecha_llegada,
        escalas: vuelo.escalas || [],
        precio: parseFloat(vuelo.precio) || 0,
        moneda: vuelo.moneda || 'EUR',
        metadatos: vuelo.metadatos || {},
        fechaCreacion: vuelo.fecha_creacion,
        fechaActualizacion: vuelo.fecha_actualizacion,
    };
}

/**
 * Helper para mapear datos de API (camelCase) a DB (snake_case)
 */
export function mapearVueloABD(vuelo: Partial<Vuelo>): Record<string, any> {
    const resultado: Record<string, any> = {};

    if (vuelo.usuarioId !== undefined) resultado.usuario_id = vuelo.usuarioId;
    if (vuelo.chatId !== undefined) resultado.chat_id = vuelo.chatId;
    if (vuelo.viajeId !== undefined) resultado.viaje_id = vuelo.viajeId;
    if (vuelo.estado !== undefined) resultado.estado = vuelo.estado;
    if (vuelo.codigoReserva !== undefined) resultado.codigo_reserva = vuelo.codigoReserva;
    if (vuelo.localizadorProveedor !== undefined) resultado.localizador_proveedor = vuelo.localizadorProveedor;
    if (vuelo.urlBillete !== undefined) resultado.url_billete = vuelo.urlBillete;
    if (vuelo.urlCheckIn !== undefined) resultado.url_check_in = vuelo.urlCheckIn;
    if (vuelo.esDirecto !== undefined) resultado.es_directo = vuelo.esDirecto;
    if (vuelo.aeropuertoOrigen !== undefined) resultado.aeropuerto_origen = vuelo.aeropuertoOrigen;
    if (vuelo.aeropuertoDestino !== undefined) resultado.aeropuerto_destino = vuelo.aeropuertoDestino;
    if (vuelo.fechaSalida !== undefined) resultado.fecha_salida = vuelo.fechaSalida;
    if (vuelo.fechaLlegada !== undefined) resultado.fecha_llegada = vuelo.fechaLlegada;
    if (vuelo.escalas !== undefined) resultado.escalas = vuelo.escalas;
    if (vuelo.precio !== undefined) resultado.precio = vuelo.precio;
    if (vuelo.moneda !== undefined) resultado.moneda = vuelo.moneda;
    if (vuelo.metadatos !== undefined) resultado.metadatos = vuelo.metadatos;

    return resultado;
}
