/**
 * Tipos de datos para Reservas de Hotel
 * Corresponde a la tabla `reservas_hoteles` en la base de datos
 */

export type EstadoReservaHotel = 'pendiente' | 'confirmado' | 'completado' | 'cancelado';

export interface ReservaHotel {
    id: string;
    usuarioId: string;
    chatId?: string;
    viajeId?: string;
    estado: EstadoReservaHotel;

    // Información del hotel
    nombreHotel: string;
    direccionHotel?: string;

    // Detalles de estancia
    fechaEntrada: string;
    fechaSalida: string;
    numeroHuespedes: number;
    numeroHabitaciones: number;

    // Información de reserva
    codigoReserva?: string;
    localizadorHotel?: string;
    urlCheckIn?: string;

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
export function mapearHotelDesdeBD(hotel: any): ReservaHotel {
    return {
        id: hotel.id,
        usuarioId: hotel.usuario_id,
        chatId: hotel.chat_id,
        viajeId: hotel.viaje_id,
        estado: hotel.estado,
        nombreHotel: hotel.nombre_hotel,
        direccionHotel: hotel.direccion_hotel,
        fechaEntrada: hotel.fecha_entrada,
        fechaSalida: hotel.fecha_salida,
        numeroHuespedes: hotel.numero_huespedes || 1,
        numeroHabitaciones: hotel.numero_habitaciones || 1,
        codigoReserva: hotel.codigo_reserva,
        localizadorHotel: hotel.localizador_hotel,
        urlCheckIn: hotel.url_check_in,
        precio: parseFloat(hotel.precio) || 0,
        moneda: hotel.moneda || 'EUR',
        metadatos: hotel.metadatos || {},
        fechaCreacion: hotel.fecha_creacion,
        fechaActualizacion: hotel.fecha_actualizacion,
    };
}

/**
 * Helper para mapear datos de API (camelCase) a DB (snake_case)
 */
export function mapearHotelABD(hotel: Partial<ReservaHotel>): Record<string, any> {
    const resultado: Record<string, any> = {};

    if (hotel.usuarioId !== undefined) resultado.usuario_id = hotel.usuarioId;
    if (hotel.chatId !== undefined) resultado.chat_id = hotel.chatId;
    if (hotel.viajeId !== undefined) resultado.viaje_id = hotel.viajeId;
    if (hotel.estado !== undefined) resultado.estado = hotel.estado;
    if (hotel.nombreHotel !== undefined) resultado.nombre_hotel = hotel.nombreHotel;
    if (hotel.direccionHotel !== undefined) resultado.direccion_hotel = hotel.direccionHotel;
    if (hotel.fechaEntrada !== undefined) resultado.fecha_entrada = hotel.fechaEntrada;
    if (hotel.fechaSalida !== undefined) resultado.fecha_salida = hotel.fechaSalida;
    if (hotel.numeroHuespedes !== undefined) resultado.numero_huespedes = hotel.numeroHuespedes;
    if (hotel.numeroHabitaciones !== undefined) resultado.numero_habitaciones = hotel.numeroHabitaciones;
    if (hotel.codigoReserva !== undefined) resultado.codigo_reserva = hotel.codigoReserva;
    if (hotel.localizadorHotel !== undefined) resultado.localizador_hotel = hotel.localizadorHotel;
    if (hotel.urlCheckIn !== undefined) resultado.url_check_in = hotel.urlCheckIn;
    if (hotel.precio !== undefined) resultado.precio = hotel.precio;
    if (hotel.moneda !== undefined) resultado.moneda = hotel.moneda;
    if (hotel.metadatos !== undefined) resultado.metadatos = hotel.metadatos;

    return resultado;
}
