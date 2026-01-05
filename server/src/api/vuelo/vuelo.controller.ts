/**
 * Controlador API para Vuelos
 * Endpoints CRUD para la tabla `vuelos`
 * 
 * NOTA: Este es un controlador stub. La lógica de búsqueda de vuelos
 * se implementará cuando se defina qué API externa utilizar.
 * Ver: /API_ENDPOINTS.md para estructura de datos
 */

import { Router } from 'express';
import { supabaseAdmin } from '../../supabase/admin';
import { mapearVueloDesdeBD, mapearVueloABD, Vuelo } from '../../../../shared/types/vuelo';

const router = Router();

/**
 * GET /api/vuelos
 * Lista los vuelos del usuario
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
            .from('vuelos')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('fecha_salida', { ascending: true });

        if (estado) {
            query = query.eq('estado', estado);
        }

        if (viajeId) {
            query = query.eq('viaje_id', viajeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const vuelos = data.map(mapearVueloDesdeBD);
        res.json({ vuelos });
    } catch (error) {
        console.error('Error listando vuelos:', error);
        res.status(500).json({ error: 'Error al listar vuelos' });
    }
});

/**
 * GET /api/vuelos/:id
 * Obtiene un vuelo específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('vuelos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }

        res.json({ vuelo: mapearVueloDesdeBD(data) });
    } catch (error) {
        console.error('Error obteniendo vuelo:', error);
        res.status(500).json({ error: 'Error al obtener vuelo' });
    }
});

/**
 * POST /api/vuelos
 * Crea un nuevo vuelo
 * 
 * Este endpoint puede ser llamado:
 * - Manualmente por el usuario
 * - Por un webhook externo (n8n) después de una búsqueda
 */
router.post('/', async (req, res) => {
    try {
        const vueloData = req.body as Partial<Vuelo>;

        if (!vueloData.usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const datosDB = mapearVueloABD(vueloData);

        const { data, error } = await supabaseAdmin
            .from('vuelos')
            .insert(datosDB)
            .select('id')
            .single();

        if (error) throw error;

        res.status(201).json({
            id: data.id,
            mensaje: 'Vuelo creado correctamente'
        });
    } catch (error) {
        console.error('Error creando vuelo:', error);
        res.status(500).json({ error: 'Error al crear vuelo' });
    }
});

/**
 * PUT /api/vuelos/:id
 * Actualiza un vuelo existente
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vueloData = req.body as Partial<Vuelo>;

        const datosDB = {
            ...mapearVueloABD(vueloData),
            fecha_actualizacion: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('vuelos')
            .update(datosDB)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        res.json({
            ok: true,
            vuelo: mapearVueloDesdeBD(data)
        });
    } catch (error) {
        console.error('Error actualizando vuelo:', error);
        res.status(500).json({ error: 'Error al actualizar vuelo' });
    }
});

/**
 * DELETE /api/vuelos/:id
 * Elimina un vuelo
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('vuelos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ ok: true, mensaje: 'Vuelo eliminado' });
    } catch (error) {
        console.error('Error eliminando vuelo:', error);
        res.status(500).json({ error: 'Error al eliminar vuelo' });
    }
});

export default router;
