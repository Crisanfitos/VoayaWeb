/**
 * Controlador API para Hoteles
 * Endpoints CRUD para la tabla `reservas_hoteles`
 * 
 * NOTA: Este es un controlador stub. La lógica de búsqueda de hoteles
 * se implementará cuando se defina qué API externa utilizar.
 * Ver: /API_ENDPOINTS.md para estructura de datos
 */

import { Router } from 'express';
import { supabaseAdmin } from '../../supabase/admin';
import { mapearHotelDesdeBD, mapearHotelABD, ReservaHotel } from '../../../../shared/types/hotel';

const router = Router();

/**
 * GET /api/hoteles
 * Lista las reservas de hotel del usuario
 */
router.get('/', async (req, res) => {
    try {
        const usuarioId = typeof req.query.usuarioId === 'string' ? req.query.usuarioId : undefined;
        const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
        const viajeId = typeof req.query.viajeId === 'string' ? req.query.viajeId : undefined;

        if (!usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        let query = supabaseAdmin
            .from('reservas_hoteles')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('fecha_entrada', { ascending: true });

        if (estado) {
            query = query.eq('estado', estado);
        }

        if (viajeId) {
            query = query.eq('viaje_id', viajeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const hoteles = data.map(mapearHotelDesdeBD);
        res.json({ hoteles });
    } catch (error) {
        console.error('Error listando hoteles:', error);
        res.status(500).json({ error: 'Error al listar hoteles' });
    }
});

/**
 * GET /api/hoteles/:id
 * Obtiene una reserva de hotel específica
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('reservas_hoteles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Reserva de hotel no encontrada' });
        }

        res.json({ hotel: mapearHotelDesdeBD(data) });
    } catch (error) {
        console.error('Error obteniendo hotel:', error);
        res.status(500).json({ error: 'Error al obtener hotel' });
    }
});

/**
 * POST /api/hoteles
 * Crea una nueva reserva de hotel
 * 
 * Este endpoint puede ser llamado:
 * - Manualmente por el usuario
 * - Por un webhook externo (n8n) después de una búsqueda
 */
router.post('/', async (req, res) => {
    try {
        const hotelData = req.body as Partial<ReservaHotel>;

        if (!hotelData.usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const datosDB = mapearHotelABD(hotelData);

        const { data, error } = await supabaseAdmin
            .from('reservas_hoteles')
            .insert(datosDB)
            .select('id')
            .single();

        if (error) throw error;

        res.status(201).json({
            id: data.id,
            mensaje: 'Reserva de hotel creada correctamente'
        });
    } catch (error) {
        console.error('Error creando hotel:', error);
        res.status(500).json({ error: 'Error al crear reserva de hotel' });
    }
});

/**
 * PUT /api/hoteles/:id
 * Actualiza una reserva de hotel existente
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hotelData = req.body as Partial<ReservaHotel>;

        const datosDB = {
            ...mapearHotelABD(hotelData),
            fecha_actualizacion: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('reservas_hoteles')
            .update(datosDB)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        res.json({
            ok: true,
            hotel: mapearHotelDesdeBD(data)
        });
    } catch (error) {
        console.error('Error actualizando hotel:', error);
        res.status(500).json({ error: 'Error al actualizar hotel' });
    }
});

/**
 * DELETE /api/hoteles/:id
 * Elimina una reserva de hotel
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('reservas_hoteles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ ok: true, mensaje: 'Reserva de hotel eliminada' });
    } catch (error) {
        console.error('Error eliminando hotel:', error);
        res.status(500).json({ error: 'Error al eliminar hotel' });
    }
});

export default router;
