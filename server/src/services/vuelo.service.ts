import { Duffel } from '@duffel/api';
import { Vuelo, SegmentoVuelo } from '../../../shared/types/vuelo';
import { geminiService } from './ai/gemini.service';

/**
 * Servicio para búsqueda de vuelos utilizando Duffel API.
 */
export class VueloService {
    private static _duffel: Duffel | null = null;

    private static get duffel(): Duffel {
        if (!this._duffel) {
            const token = process.env.DUFFEL_ACCESS_TOKEN;
            if (!token) {
                console.warn('[VueloService] DUFFEL_ACCESS_TOKEN is not defined');
            } else {
                console.log(`[VueloService] Initializing Duffel client...`);
            }
            this._duffel = new Duffel({
                token: token || ''
            });
        }
        return this._duffel;
    }

    private static async resolveIata(name: string): Promise<string> {
        if (!name) return '';
        if (/^[A-Z]{3}$/.test(name.toUpperCase())) return name.toUpperCase();
        
        try {
            const model = (geminiService as any).client.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Return ONLY the 3-letter IATA code for the main airport of "${name}". Example: "Madrid" -> "MAD". If unknown, return "${name}".`;
            const result = await model.generateContent(prompt);
            const code = result.response.text().trim().toUpperCase();
            return /^[A-Z]{3}$/.test(code) ? code : name;
        } catch (e) {
            return name;
        }
    }

    /**
     * Busca vuelos (offers) según origen, destino y fechas.
     */
    static async buscarVuelos(params: {
        origen: string,
        destino: string,
        fechaSalida: string,
        fechaRegreso?: string,
        adultos?: number
    }): Promise<Vuelo[]> {
        try {
            const iataOrigen = await this.resolveIata(params.origen);
            const iataDestino = await this.resolveIata(params.destino);

            console.log(`[VueloService] Searching: ${iataOrigen} -> ${iataDestino} (${params.fechaSalida}${params.fechaRegreso ? ' / ' + params.fechaRegreso : ''})`);
            
            const slices: any[] = [
                {
                    origin: iataOrigen,
                    destination: iataDestino,
                    departure_date: params.fechaSalida,
                }
            ];

            // Añadir tramo de vuelta si existe
            if (params.fechaRegreso) {
                slices.push({
                    origin: iataDestino,
                    destination: iataOrigen,
                    departure_date: params.fechaRegreso,
                });
            }

            const offerRequest = await this.duffel.offerRequests.create({
                slices,
                passengers: Array(params.adultos || 1).fill({ type: 'adult' }),
                cabin_class: 'economy',
            });

            const { data: offers } = await this.duffel.offers.list({
                offer_request_id: offerRequest.data.id,
                sort: 'total_amount',
                limit: 10
            });

            return offers.map(offer => this.mapearDuffelAVuelo(offer, offerRequest.data.id));
        } catch (error: any) {
            console.error('Error en Duffel API:', error.message || error);
            throw new Error('No se pudieron buscar vuelos en Duffel');
        }
    }

    private static mapearDuffelAVuelo(offer: any, offerRequestId: string): Vuelo {
        const outboundSlice = offer.slices[0];
        const returnSlice = offer.slices[1]; // Puede ser undefined si es solo ida

        const outboundSegments = outboundSlice.segments;
        const firstOutbound = outboundSegments[0];
        const lastOutbound = outboundSegments[outboundSegments.length - 1];

        // Mapear escalas de ida
        const escalas: SegmentoVuelo[] = outboundSegments.map((seg: any) => ({
            aerolinea: seg.operating_carrier?.name || seg.marketing_carrier?.name || 'Aerolínea',
            numeroVuelo: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
            origen: seg.origin.iata_code,
            destino: seg.destination.iata_code,
            fechaSalida: seg.departing_at,
            fechaLlegada: seg.arriving_at,
        }));

        // Si hay vuelta, añadir sus segmentos a los metadatos o escalas
        let escalasVuelta: SegmentoVuelo[] = [];
        if (returnSlice) {
            escalasVuelta = returnSlice.segments.map((seg: any) => ({
                aerolinea: seg.operating_carrier?.name || seg.marketing_carrier?.name || 'Aerolínea',
                numeroVuelo: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
                origen: seg.origin.iata_code,
                destino: seg.destination.iata_code,
                fechaSalida: seg.departing_at,
                fechaLlegada: seg.arriving_at,
            }));
        }

        return {
            id: offer.id,
            usuarioId: '',
            chatId: '',
            viajeId: '',
            estado: 'pendiente',
            metadatos: {
                offer_request_id: offerRequestId,
                carrier_name: offer.owner.name,
                conditions: offer.conditions,
                passengers: offer.passengers,
                // Guardamos información del tramo de vuelta en metadatos para el UI
                return_flight: returnSlice ? {
                    aeropuertoOrigen: returnSlice.origin.iata_code,
                    aeropuertoDestino: returnSlice.destination.iata_code,
                    fechaSalida: returnSlice.segments[0].departing_at,
                    fechaLlegada: returnSlice.segments[returnSlice.segments.length - 1].arriving_at,
                    escalas: escalasVuelta
                } : null
            },
            esDirecto: outboundSegments.length === 1 && (!returnSlice || returnSlice.segments.length === 1),
            aeropuertoOrigen: outboundSlice.origin.iata_code,
            aeropuertoDestino: outboundSlice.destination.iata_code,
            fechaSalida: firstOutbound.departing_at,
            fechaLlegada: lastOutbound.arriving_at,
            escalas: escalas,
            precio: parseFloat(offer.total_amount),
            moneda: offer.total_currency,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
        };
    }
}
