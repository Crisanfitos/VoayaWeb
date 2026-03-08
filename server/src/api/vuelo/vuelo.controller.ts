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
import { VueloService } from '../../services/vuelo.service';
import { geminiService } from '../../services/ai/gemini.service';

const router = Router();

/**
 * GET /api/vuelos/search
 * Realiza una búsqueda de vuelos en tiempo real usando Duffel
 * Query params: origen, destino, fecha, adultos
 */
router.get('/search', async (req, res) => {
    const { origen, destino, fecha, regreso, adultos } = req.query;

    if (!origen || !destino || !fecha) {
        return res.status(400).json({ error: 'Faltan parámetros: origen, destino y fecha son requeridos' });
    }

    try {
        const numAdultos = parseInt(adultos as string) || 1;

        const vuelos = await VueloService.buscarVuelos({
            origen: origen as string,
            destino: destino as string,
            fechaSalida: fecha as string,
            fechaRegreso: regreso as string,
            adultos: numAdultos
        });

        res.json({ vuelos });
    } catch (error: any) {
        console.error('Error buscando vuelos:', error);
        res.status(500).json({ error: error.message || 'Error al buscar vuelos' });
    }
});

/**
 * GET /api/vuelos/viaje/:viajeId
 * Obtiene los vuelos guardados en los metadatos de un viaje
 */
router.get('/viaje/:viajeId', async (req, res) => {
    try {
        const { viajeId } = req.params;
        const { data: viaje, error } = await supabaseAdmin
            .from('viajes')
            .select('metadatos')
            .eq('id', viajeId)
            .single();

        if (error || !viaje) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        // Devolvemos los vuelos recomendados guardados en metadatos
        const vuelos = viaje.metadatos?.recommended_flights || [];
        
        // Mapeamos al formato que espera el frontend si es necesario
        // En este caso, ya están mapeados por el VueloService
        res.json({ 
            success: true,
            offers: vuelos,
            total_offers: vuelos.length,
            status: viaje.metadatos?.flight_status
        });
    } catch (error) {
        console.error('Error obteniendo vuelos del viaje:', error);
        res.status(500).json({ error: 'Error al obtener vuelos' });
    }
});

/**
 * POST /api/vuelos/iata/batch
 * Resuelve una lista de códigos IATA a nombres de ciudades usando Gemini
 */
router.post('/iata/batch', async (req, res) => {
    try {
        const codes = req.body as string[];
        if (!Array.isArray(codes) || codes.length === 0) {
            return res.json({});
        }

        const prompt = `
            Return a JSON object where keys are the IATA codes provided and values are objects with "city" and "country".
            IATA Codes: ${codes.join(', ')}
            Format example: {"MAD": {"city": "Madrid", "country": "Spain"}}
            Return ONLY the JSON.
        `;

        const model = (geminiService as any).client.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const resolved = JSON.parse(text);
        
        res.json(resolved);
    } catch (error) {
        console.error('Error resolving IATA batch:', error);
        res.status(500).json({ error: 'Error al resolver códigos IATA' });
    }
});

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
