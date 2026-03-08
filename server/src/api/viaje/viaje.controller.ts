/**
 * Controlador API para Viajes
 * Endpoints CRUD para la tabla `viajes`
 * Agrega vuelos y hoteles relacionados
 * 
 * Ver: /API_ENDPOINTS.md para estructura de datos
 */

import { Router } from 'express';
import { ImageService } from '../../services/image.service';
import { supabaseAdmin } from '../../supabase/admin';
import { mapearViajeDesdeBD, mapearViajeABD, Viaje, ViajeBase, TabViajes } from '../../../../shared/types/viaje';
import { mapearVueloDesdeBD } from '../../../../shared/types/vuelo';
import { mapearHotelDesdeBD } from '../../../../shared/types/hotel';
import { geminiService } from '../../services/ai/gemini.service';
import { VueloService } from '../../services/vuelo.service';

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
                // Viajes en planificación o confirmados (activos)
                query = query.in('estado', ['planificando', 'confirmado']);
                break;
            case 'borradores':
                // Viajes en estado borrador
                query = query.eq('estado', 'borrador');
                break;
            case 'pasados':
                // Viajes completados o cancelados
                query = query.in('estado', ['completado', 'cancelado']);
                break;
        }

        const { data: viajesData, error: viajesError } = await query;

        if (viajesError) throw viajesError;

        // Early return if no viajes
        if (!viajesData || viajesData.length === 0) {
            return res.json({ viajes: [] });
        }

        // OPTIMIZACIÓN: Batch queries en lugar de N+1
        const viajeIds = viajesData.map(v => v.id);

        // Obtener todos los vuelos y hoteles en paralelo con 2 queries
        const [vuelosResult, hotelesResult] = await Promise.all([
            supabaseAdmin
                .from('vuelos')
                .select('*')
                .in('viaje_id', viajeIds)
                .order('fecha_salida', { ascending: true }),
            supabaseAdmin
                .from('reservas_hoteles')
                .select('*')
                .in('viaje_id', viajeIds)
                .order('fecha_entrada', { ascending: true })
        ]);

        const vuelosData = vuelosResult.data || [];
        const hotelesData = hotelesResult.data || [];

        // Agrupar vuelos y hoteles por viaje_id
        const vuelosPorViaje = new Map<string, any[]>();
        const hotelesPorViaje = new Map<string, any[]>();

        for (const vuelo of vuelosData) {
            if (!vuelosPorViaje.has(vuelo.viaje_id)) {
                vuelosPorViaje.set(vuelo.viaje_id, []);
            }
            vuelosPorViaje.get(vuelo.viaje_id)!.push(vuelo);
        }

        for (const hotel of hotelesData) {
            if (!hotelesPorViaje.has(hotel.viaje_id)) {
                hotelesPorViaje.set(hotel.viaje_id, []);
            }
            hotelesPorViaje.get(hotel.viaje_id)!.push(hotel);
        }

        // Construir viajes con vuelos y hoteles
        const viajes: Viaje[] = viajesData.map((viajeDB) => {
            const viajeBase = mapearViajeDesdeBD(viajeDB);
            return {
                ...viajeBase,
                vuelos: (vuelosPorViaje.get(viajeDB.id) || []).map(mapearVueloDesdeBD),
                hoteles: (hotelesPorViaje.get(viajeDB.id) || []).map(mapearHotelDesdeBD),
            };
        });

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

        // Lazy Enrich: Si no tiene imagen, buscarla y actualizar
        if (!viajeData.imagen_url && viajeData.destino) {
            try {
                // Async update (fire and forget for speed, or await for immediate consistency)
                // Let's await to ensure user sees it
                const newUrl = await ImageService.resolveImage(viajeData.destino);
                if (newUrl) {
                    await supabaseAdmin
                        .from('viajes')
                        .update({ imagen_url: newUrl })
                        .eq('id', id);
                    viajeData.imagen_url = newUrl;
                }
            } catch (e) {
                console.error('Error resolving image for trip:', id, e);
            }
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
 * POST /api/viajes/:id/re-search
 * Triggers a new flight search for an existing trip.
 */
router.post('/:id/re-search', async (req, res) => {
    try {
        const { id } = req.params;

        // Get trip data
        const { data: trip, error: tripError } = await supabaseAdmin
            .from('viajes')
            .select('*')
            .eq('id', id)
            .single();

        if (tripError || !trip) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        // ALWAYS try to get fresh extraction data from chat history if available
        // to take advantage of prompt improvements
        let extractedData = null;

        if (trip.chat_id) {
            const { data: messages } = await supabaseAdmin
                .from('mensajes')
                .select('*')
                .eq('chat_id', trip.chat_id)
                .order('fecha_creacion', { ascending: true });

            if (messages && messages.length > 0) {
                console.log(`[Re-Search] Re-extracting data for trip ${id} from chat ${trip.chat_id}`);
                const contextMessages = messages.map(m => ({
                    role: m.rol as 'user' | 'assistant' | 'system',
                    content: m.contenido
                }));
                extractedData = await geminiService.extractTravelData(contextMessages);
            }
        }

        // Fallback to existing metadata if chat extraction failed or no chat linked
        if (!extractedData) {
            extractedData = trip.metadatos?.extracted_data;
        }

        if (!extractedData || !extractedData.origin || !extractedData.destination || !extractedData.departure_date) {
            return res.status(400).json({ error: 'No se pudieron obtener datos suficientes para la búsqueda (origen, destino, fecha)' });
        }

        // Trigger search (Async)
        (async () => {
            try {
                // Update status to searching
                await supabaseAdmin
                    .from('viajes')
                    .update({
                        metadatos: {
                            ...(trip.metadatos || {}),
                            flight_status: 'searching'
                        }
                    })
                    .eq('id', id);

                const flights = await VueloService.buscarVuelos({
                    origen: extractedData.origin,
                    destino: extractedData.destination,
                    fechaSalida: extractedData.departure_date,
                    fechaRegreso: extractedData.return_date,
                    adultos: extractedData.passengers?.adults || 1
                });

                // Update metadata with results
                await supabaseAdmin
                    .from('viajes')
                    .update({
                        metadatos: {
                            ...(trip.metadatos || {}),
                            extracted_data: extractedData, // Save it if we extracted it now
                            flight_status: 'completed',
                            flights_found: flights.length,
                            recommended_flights: flights.slice(0, 10), // Aumentamos a 10 resultados
                            last_search_at: new Date().toISOString()
                        }
                    })
                    .eq('id', id);
                
                console.log(`[Re-Search] Completed for trip ${id}. Found ${flights.length} flights.`);
            } catch (err) {
                console.error(`[Re-Search] Error for trip ${id}:`, err);
                await supabaseAdmin
                    .from('viajes')
                    .update({
                        metadatos: {
                            ...(trip.metadatos || {}),
                            flight_status: 'error',
                            flight_error: (err as any).message
                        }
                    })
                    .eq('id', id);
            }
        })();

        res.json({ ok: true, message: 'Búsqueda de vuelos iniciada' });
    } catch (error) {
        console.error('Error in re-search endpoint:', error);
        res.status(500).json({ error: 'Error al iniciar re-búsqueda' });
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

/**
 * POST /api/viajes/:tripId/flight-results
 * Callback endpoint for receiving flight search results from the agents microservice
 */
router.post('/:tripId/flight-results', async (req, res) => {
    try {
        const { tripId } = req.params;
        const { flight_results, secret } = req.body;

        // Validate secret (basic check)
        if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch existing trip to preserve metadata
        const { data: currentTrip, error: fetchError } = await supabaseAdmin
            .from('viajes')
            .select('metadatos')
            .eq('id', tripId)
            .single();

        if (fetchError || !currentTrip) {
            console.error('Trip not found for flight results update:', tripId);
            return res.status(404).json({ error: 'Trip not found' });
        }

        const newMetadata = {
            ...(currentTrip.metadatos || {}),
            flight_status: 'completed',
            flight_summary: {
                total_offers: flight_results?.total_offers || 0,
                search_timestamp: flight_results?.search_timestamp,
                cache_id: tripId,
                status: flight_results?.status || 'active'
            },
            updated_at: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
            .from('viajes')
            .update({
                metadatos: newMetadata
            })
            .eq('id', tripId);

        if (error) throw error;

        // Also update the chat state if linked
        // We can do this implicitly or leave it. 

        console.log(`[Flight Results] Updated trip ${tripId} with ${flight_results?.total_offers || 0} offers`);
        res.json({ ok: true });
    } catch (error) {
        console.error('Error processing flight results:', error);
        res.status(500).json({ error: 'Error processing flight results' });
    }
});

export default router;
