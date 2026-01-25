/**
 * Validation Schemas
 * Zod schemas for API input validation
 */

import { z } from 'zod';

// ============ CHAT SCHEMAS ============

export const chatStartSchema = z.object({
    userId: z.string().uuid().optional(),
    categories: z.array(z.string()).default([])
});

export const chatMessageSchema = z.object({
    chatId: z.string().uuid().optional(),
    text: z.string().min(1, 'El mensaje no puede estar vacío').max(10000, 'El mensaje es demasiado largo'),
    userId: z.string().uuid().optional(),
    role: z.enum(['user', 'assistant', 'system']).default('user')
});

export const chatCompleteSchema = z.object({
    chatId: z.string().uuid('chatId inválido')
});

export const webhookCallbackSchema = z.object({
    chatId: z.string().uuid('chatId inválido'),
    metadata: z.record(z.string(), z.any()).optional(),
    secret: z.string().optional()
});

export const sendExternalSchema = z.object({
    chatId: z.string().uuid('chatId inválido'),
    webhookUrl: z.string().url().optional(),
    secret: z.string().optional()
});

export const favoritoSchema = z.object({
    esFavorito: z.boolean()
});

// ============ USER SCHEMAS ============

export const userPreferencesSchema = z.object({
    preferenciasIa: z.object({
        aventura: z.number().min(0).max(100).optional(),
        lujo: z.number().min(0).max(100).optional(),
        naturaleza: z.number().min(0).max(100).optional(),
        espontaneo: z.number().min(0).max(100).optional()
    })
});

export const userProfileSchema = z.object({
    nombre: z.string().max(100).optional(),
    apellidos: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional(),
    temaModo: z.enum(['light', 'dark', 'system']).optional()
});

// ============ VIAJE SCHEMAS ============

export const viajeCreateSchema = z.object({
    usuarioId: z.string().uuid('usuarioId inválido'),
    destino: z.string().min(1).optional(),
    fechaInicio: z.string().datetime().optional(),
    fechaFin: z.string().datetime().optional(),
    estado: z.enum(['borrador', 'planificando', 'confirmado', 'completado', 'cancelado']).default('borrador'),
    imagenUrl: z.string().url().optional(),
    itinerario: z.array(z.any()).optional(),
    metadatos: z.record(z.string(), z.any()).optional()
});

export const viajeUpdateSchema = viajeCreateSchema.partial();

export const crearDesdeChat = z.object({
    usuarioId: z.string().uuid('usuarioId inválido')
});

// ============ VUELO SCHEMAS ============

export const vueloSchema = z.object({
    usuarioId: z.string().uuid('usuarioId inválido'),
    viajeId: z.string().uuid().optional(),
    aerolinea: z.string().optional(),
    numeroVuelo: z.string().optional(),
    origen: z.string().optional(),
    destino: z.string().optional(),
    fechaSalida: z.string().datetime().optional(),
    fechaLlegada: z.string().datetime().optional(),
    precio: z.number().positive().optional(),
    clase: z.string().optional(),
    estado: z.enum(['buscando', 'encontrado', 'reservado', 'confirmado', 'cancelado']).optional()
});

// ============ HOTEL SCHEMAS ============

export const hotelSchema = z.object({
    usuarioId: z.string().uuid('usuarioId inválido'),
    viajeId: z.string().uuid().optional(),
    nombreHotel: z.string().optional(),
    direccion: z.string().optional(),
    fechaEntrada: z.string().datetime().optional(),
    fechaSalida: z.string().datetime().optional(),
    numeroCuartos: z.number().positive().optional(),
    numeroHuespedes: z.number().positive().optional(),
    precioPorNoche: z.number().positive().optional(),
    precioTotal: z.number().positive().optional(),
    estado: z.enum(['buscando', 'encontrado', 'reservado', 'confirmado', 'cancelado']).optional()
});

// ============ QUERY SCHEMAS ============

export const listQuerySchema = z.object({
    usuarioId: z.string().uuid('usuarioId inválido'),
    estado: z.string().optional(),
    viajeId: z.string().uuid().optional(),
    tab: z.enum(['programados', 'borradores', 'pasados']).optional()
});

export const userIdQuerySchema = z.object({
    userId: z.string().uuid().optional()
});
