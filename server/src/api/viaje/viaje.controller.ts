/**
 * Controlador API para Viajes
 * Endpoints CRUD para la tabla `viajes`
 * Agrega vuelos y hoteles relacionados
 * 
 * Ver: /API_ENDPOINTS.md para estructura de datos
 */

import { Router } from 'express';
import { supabaseAdmin } from '../../supabase/admin';
import { mapearViajeDesdeBD, mapearViajeABD, Viaje, ViajeBase, TabViajes } from '../../../../shared/types/viaje';
import { mapearVueloDesdeBD } from '../../../../shared/types/vuelo';
import { mapearHotelDesdeBD } from '../../../../shared/types/hotel';

const router = Router();

/**
 * GET /api/viajes
 * Lista los viajes del usuario con sus vuelos y hoteles
 * 
 * Query params:
 * - usuarioId: string (requerido)
 * - tab: 'programados' | 'borradores' | 'pasados' (opcional, default: 'programados')
 */
router.get('/', async (req, res) => {
    try {
        const usuarioId = typeof req.query.usuarioId === 'string' ? req.query.usuarioId : undefined;
        const tab = (req.query.tab as TabViajes) || 'programados';

        if (!usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const ahora = new Date().toISOString();
        let query = supabaseAdmin
            .from('viajes')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('fecha_inicio', { ascending: true });

        // Filtrar por tab
        switch (tab) {
            case 'programados':
                // Viajes confirmados o en planificación con fecha futura
                query = query
                    .in('estado', ['planificando', 'confirmado'])
                    .gte('fecha_inicio', ahora);
                break;
            case 'borradores':
                // Viajes en estado borrador
                query = query.eq('estado', 'borrador');
                break;
            case 'pasados':
                // Viajes completados o con fecha pasada
                query = query.or(`estado.eq.completado,fecha_fin.lt.${ahora}`);
                break;
        }

        const { data: viajesData, error: viajesError } = await query;

        if (viajesError) throw viajesError;

        // Para cada viaje, obtener sus vuelos y hoteles
        const viajes: Viaje[] = await Promise.all(
            viajesData.map(async (viajeDB) => {
                const viajeBase = mapearViajeDesdeBD(viajeDB);

                // Obtener vuelos del viaje
                const { data: vuelosData } = await supabaseAdmin
                    .from('vuelos')
                    .select('*')
                    .eq('viaje_id', viajeDB.id)
                    .order('fecha_salida', { ascending: true });

                // Obtener hoteles del viaje
                const { data: hotelesData } = await supabaseAdmin
                    .from('reservas_hoteles')
                    .select('*')
                    .eq('viaje_id', viajeDB.id)
                    .order('fecha_entrada', { ascending: true });

                return {
                    ...viajeBase,
                    vuelos: (vuelosData || []).map(mapearVueloDesdeBD),
                    hoteles: (hotelesData || []).map(mapearHotelDesdeBD),
                };
            })
        );

        res.json({ viajes });
    } catch (error) {
        console.error('Error listando viajes:', error);
        res.status(500).json({ error: 'Error al listar viajes' });
    }
});

/**
 * GET /api/viajes/:id
 * Obtiene un viaje específico con todos sus componentes
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener viaje
        const { data: viajeData, error: viajeError } = await supabaseAdmin
            .from('viajes')
            .select('*')
            .eq('id', id)
            .single();

        if (viajeError || !viajeData) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        const viajeBase = mapearViajeDesdeBD(viajeData);

        // Obtener vuelos
        const { data: vuelosData } = await supabaseAdmin
            .from('vuelos')
            .select('*')
            .eq('viaje_id', id)
            .order('fecha_salida', { ascending: true });

        // Obtener hoteles
        const { data: hotelesData } = await supabaseAdmin
            .from('reservas_hoteles')
            .select('*')
            .eq('viaje_id', id)
            .order('fecha_entrada', { ascending: true });

        const viaje: Viaje = {
            ...viajeBase,
            vuelos: (vuelosData || []).map(mapearVueloDesdeBD),
            hoteles: (hotelesData || []).map(mapearHotelDesdeBD),
        };

        res.json({ viaje });
    } catch (error) {
        console.error('Error obteniendo viaje:', error);
        res.status(500).json({ error: 'Error al obtener viaje' });
    }
});

/**
 * POST /api/viajes
 * Crea un nuevo viaje
 */
router.post('/', async (req, res) => {
    try {
        const viajeData = req.body as Partial<ViajeBase>;

        if (!viajeData.usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const datosDB = mapearViajeABD(viajeData);

        const { data, error } = await supabaseAdmin
            .from('viajes')
            .insert(datosDB)
            .select('id')
            .single();

        if (error) throw error;

        res.status(201).json({
            id: data.id,
            mensaje: 'Viaje creado correctamente'
        });
    } catch (error) {
        console.error('Error creando viaje:', error);
        res.status(500).json({ error: 'Error al crear viaje' });
    }
});

/**
 * PUT /api/viajes/:id
 * Actualiza un viaje existente
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const viajeData = req.body as Partial<ViajeBase>;

        const datosDB = {
            ...mapearViajeABD(viajeData),
            fecha_actualizacion: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('viajes')
            .update(datosDB)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        res.json({
            ok: true,
            viaje: mapearViajeDesdeBD(data)
        });
    } catch (error) {
        console.error('Error actualizando viaje:', error);
        res.status(500).json({ error: 'Error al actualizar viaje' });
    }
});

/**
 * DELETE /api/viajes/:id
 * Elimina un viaje (los vuelos y hoteles asociados mantienen viaje_id = null)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('viajes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ ok: true, mensaje: 'Viaje eliminado' });
    } catch (error) {
        console.error('Error eliminando viaje:', error);
        res.status(500).json({ error: 'Error al eliminar viaje' });
    }
});

/**
 * POST /api/viajes/:id/crear-desde-chat
 * Crea un viaje a partir de un chat completado
 */
router.post('/:chatId/crear-desde-chat', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { usuarioId } = req.body;

        // Obtener datos del chat
        const { data: chatData, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (chatError || !chatData) {
            return res.status(404).json({ error: 'Chat no encontrado' });
        }

        // Extraer metadatos del chat para crear el viaje
        const metadatos = chatData.metadatos || {};

        const viajeData = {
            usuario_id: usuarioId,
            chat_id: chatId,
            destino: metadatos.destination || metadatos.destino || chatData.titulo || 'Destino sin definir',
            fecha_inicio: metadatos.dates?.start || metadatos.fechas?.inicio || null,
            fecha_fin: metadatos.dates?.end || metadatos.fechas?.fin || null,
            estado: 'borrador',
            imagen_url: chatData.imagen_url || null,
            itinerario: [],
            metadatos: metadatos,
        };

        const { data, error } = await supabaseAdmin
            .from('viajes')
            .insert(viajeData)
            .select('id')
            .single();

        if (error) throw error;

        res.status(201).json({
            id: data.id,
            mensaje: 'Viaje creado desde chat'
        });
    } catch (error) {
        console.error('Error creando viaje desde chat:', error);
        res.status(500).json({ error: 'Error al crear viaje desde chat' });
    }
});

export default router;
