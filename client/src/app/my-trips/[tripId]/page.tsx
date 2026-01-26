"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiService } from '@/services/api';
import { Loader } from '@/components/ui/loader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TYPES
// ==========================================

interface ExtractedData {
    origin?: string;
    destination?: string;
    destination_name?: string;
    departure_date?: string;
    return_date?: string;
    travelers?: number;
    budget?: string;
    trip_type?: string;
    preferences?: {
        travel_class: string;
        direct_flights_only: boolean;
        max_price?: number;
        flexible_dates: boolean;
    };
    extraction_confidence?: number;
}

interface FlightSegment {
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    carrier_code: string;
    flight_number: string;
    duration: string;

    // Optional: Terminal info
    departure_terminal?: string;
    arrival_terminal?: string;

    // Optional: Airline info
    carrier_name?: string;
    operating_carrier_code?: string;
    operating_carrier_name?: string;

    // Optional: Aircraft info
    aircraft_code?: string;
    aircraft_name?: string;

    // Optional: Stops within segment
    number_of_stops?: number;
    segment_id?: string;
    blacklisted_in_eu?: boolean;
}

interface BaggageInfo {
    checked_bags_quantity?: number;
    checked_bags_weight?: number;
    checked_bags_weight_unit?: string;
    cabin_bags_quantity?: number;
}

interface FareDetails {
    segment_id?: string;
    cabin_class?: string;
    fare_basis?: string;
    branded_fare?: string;
    branded_fare_label?: string;
    booking_class?: string;
    baggage?: BaggageInfo;
    amenities?: string[];
}

interface FlightOffer {
    id: string;

    // Pricing
    price: string;
    currency: string;
    base_price?: string;
    grand_total?: string;

    // Flight structure
    total_duration: string;
    stops: number;
    outbound_segments: FlightSegment[];
    return_segments?: FlightSegment[];

    // Airline info
    validating_airline?: string;
    validating_airline_name?: string;

    // Booking
    booking_url?: string;
    last_ticketing_date?: string;
    last_ticketing_datetime?: string;

    // Availability
    number_of_bookable_seats?: number;
    instant_ticketing_required?: boolean;

    // Fare details
    fare_details?: FareDetails[];

    // Metadata
    source?: string;
    is_upsell_offer?: boolean;
}

interface FlightResults {
    success: boolean;
    total_offers: number;
    offers: FlightOffer[];
    search_timestamp: string;
    direct_flights_available?: boolean;
    direct_flights_count?: number;
    used_alternative_departure?: string;
    used_alternative_return?: string;
    user_messages?: string[];

    // Pagination
    page?: number;
    page_size?: number;
    total_pages?: number;
    has_more?: boolean;
    cache_id?: string;
}

interface ViajeDetail {
    id: string;
    destino: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    imagenUrl?: string;
    metadatos: {
        extracted_data?: ExtractedData;
        flight_status?: 'searching' | 'completed' | 'failed';
        flight_results?: FlightResults;
        processing_status?: string;
    };
}

// ==========================================
// HELPERS
// ==========================================

function formatDuration(isoDuration: string) {
    // PT2H15M -> 2h 15m
    return isoDuration.replace('PT', '').toLowerCase();
}

function formatDateDisplay(dateStr?: string) {
    if (!dateStr) return 'Fecha pendiente';
    try {
        return format(new Date(dateStr), "d 'de' MMMM", { locale: es });
    } catch {
        return dateStr;
    }
}

// ==========================================
// SUB-COMPONENTS (Inline for simplicity, can extract later)
// ==========================================

const TripHeader = ({ viaje, extracted }: { viaje: ViajeDetail, extracted?: ExtractedData }) => {
    // Usar fechas del viaje directamente, y si no existen, intentar de los metadatos
    const fechaInicio = viaje.fechaInicio || extracted?.departure_date;
    const fechaFin = viaje.fechaFin || extracted?.return_date;

    // Obtener origen y viajeros de los metadatos
    // Obtener origen y viajeros de los metadatos - Priorizar origin_name (nombre completo) sobre origin (código)
    const origen = extracted?.origin_name || extracted?.origin || viaje.metadatos?.origin_name || viaje.metadatos?.origin || viaje.metadatos?.origen;
    const viajeros = extracted?.travelers || viaje.metadatos?.travelers || viaje.metadatos?.viajeros || 1;
    const tripType = extracted?.trip_type || viaje.metadatos?.trip_type || viaje.metadatos?.tipo_viaje;
    const budget = extracted?.budget || viaje.metadatos?.budget || viaje.metadatos?.presupuesto;

    return (
        <header className="relative w-full h-[40vh] min-h-[400px] flex items-end">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                    backgroundImage: `url(${viaje.imagenUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'})`
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background via-background-light/80 dark:via-background/80 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pb-12">
                <div className="flex flex-col gap-6">
                    <Link href="/my-trips" className="self-start text-white/80 hover:text-white flex items-center gap-2 transition-colors mb-4 backdrop-blur-md px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/40 border border-white/10">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        <span className="text-sm font-medium">Volver a mis viajes</span>
                    </Link>

                    {/* Main Info */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm font-bold tracking-widest text-voaya-primary uppercase">
                            <span className="px-2 py-0.5 rounded-md bg-voaya-primary/20 backdrop-blur-sm border border-voaya-primary/30">
                                {tripType || 'Viaje Personal'}
                            </span>
                            {(extracted?.extraction_confidence || 0) > 0.8 && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <span className="material-symbols-outlined text-[16px]">verified</span>
                                    Plan verificado
                                </span>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-xl font-display">
                            {viaje.destino || 'Destino sin definir'}
                        </h1>
                    </div>

                    {/* Rich Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:bg-white/15 transition-colors">
                            <p className="text-xs text-white/60 mb-1 uppercase tracking-wider font-semibold">Fechas</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span className="material-symbols-outlined text-voaya-primary">calendar_month</span>
                                <span>{formatDateDisplay(fechaInicio)} - {formatDateDisplay(fechaFin)}</span>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:bg-white/15 transition-colors">
                            <p className="text-xs text-white/60 mb-1 uppercase tracking-wider font-semibold">Viajeros</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span className="material-symbols-outlined text-voaya-primary">group</span>
                                <span>{viajeros} {viajeros === 1 ? 'Persona' : 'Personas'}</span>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:bg-white/15 transition-colors">
                            <p className="text-xs text-white/60 mb-1 uppercase tracking-wider font-semibold">Origen</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span className="material-symbols-outlined text-voaya-primary">flight_takeoff</span>
                                <span>{origen || 'Por definir'}</span>
                            </div>
                        </div>

                        {budget && (
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:bg-white/15 transition-colors">
                                <p className="text-xs text-white/60 mb-1 uppercase tracking-wider font-semibold">Presupuesto</p>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <span className="material-symbols-outlined text-emerald-400">payments</span>
                                    <span>{budget}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Preferences Tags */}
                    {extracted?.preferences && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {/* Class */}
                            {extracted.preferences.travel_class && (
                                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                                    ✨ {extracted.preferences.travel_class}
                                </span>
                            )}
                            {/* Direct */}
                            {extracted.preferences.direct_flights_only && (
                                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                                    ✨ Vuelos Directos
                                </span>
                            )}
                            {/* Flexible */}
                            {extracted.preferences.flexible_dates && (
                                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                                    ✨ Fechas Flexibles
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// Helper for dates
const processedDates = (extracted?: ExtractedData) => {
    return {
        start: extracted?.departure_date || 'Por definir',
        end: extracted?.return_date || 'Por definir'
    };
};


const FlightCard = ({ offer }: { offer: FlightOffer }) => {
    const outbound = offer.outbound_segments;
    const returnFlight = offer.return_segments;
    const fareDetails = offer.fare_details?.[0];

    if (!outbound || outbound.length === 0) {
        return null;
    }

    const firstOutbound = outbound[0];
    const lastOutbound = outbound[outbound.length - 1];

    // Get intermediate stops for display
    const getStopoverAirports = (segments: FlightSegment[]) => {
        if (segments.length <= 1) return null;
        return segments.slice(0, -1).map(s => s.arrival_airport).join(' → ');
    };

    const handleBookingClick = () => {
        if (offer.booking_url) {
            window.open(offer.booking_url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="group bg-surface-default dark:bg-card-dark border border-stroke dark:border-input-dark rounded-2xl p-5 hover:border-voaya-primary/50 hover:shadow-lg transition-all">
            {/* Header with airline and fare type */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stroke/50 dark:border-input-dark/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-voaya-primary/10 dark:bg-voaya-primary/20 flex items-center justify-center">
                        <span className="font-bold text-sm text-voaya-primary">{offer.validating_airline || firstOutbound.carrier_code}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-text-main dark:text-white text-sm">
                            {offer.validating_airline_name || firstOutbound.carrier_name || offer.validating_airline}
                        </p>
                        <p className="text-xs text-text-muted">
                            {firstOutbound.flight_number}
                            {fareDetails?.branded_fare_label && (
                                <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] font-medium">
                                    {fareDetails.branded_fare_label}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                {/* Baggage icons */}
                <div className="flex items-center gap-2 text-text-muted">
                    {fareDetails?.baggage?.cabin_bags_quantity !== undefined && fareDetails.baggage.cabin_bags_quantity > 0 && (
                        <div className="flex items-center gap-1 text-xs" title="Equipaje de mano incluido">
                            <span className="material-symbols-outlined text-[16px]">backpack</span>
                            <span>{fareDetails.baggage.cabin_bags_quantity}</span>
                        </div>
                    )}
                    {fareDetails?.baggage?.checked_bags_quantity !== undefined && (
                        <div className={`flex items-center gap-1 text-xs ${fareDetails.baggage.checked_bags_quantity > 0 ? 'text-emerald-500' : 'text-text-muted line-through'}`}
                            title={fareDetails.baggage.checked_bags_quantity > 0 ? 'Equipaje facturado incluido' : 'Sin equipaje facturado'}>
                            <span className="material-symbols-outlined text-[16px]">luggage</span>
                            <span>{fareDetails.baggage.checked_bags_quantity}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-between">
                {/* Flight Info */}
                <div className="flex-1 space-y-4">
                    {/* Outbound */}
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                                <span className="font-bold text-lg text-text-main dark:text-white block">
                                    {format(new Date(firstOutbound.departure_time), 'HH:mm')}
                                </span>
                                <span className="text-xs text-text-muted">{firstOutbound.departure_airport}</span>
                                {firstOutbound.departure_terminal && (
                                    <span className="text-[10px] text-text-muted block">T{firstOutbound.departure_terminal}</span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col items-center">
                                <span className="text-xs text-text-muted">{formatDuration(offer.total_duration)}</span>
                                <div className="w-full h-[2px] bg-stroke dark:bg-input-dark relative my-1">
                                    {offer.stops > 0 && outbound.slice(0, -1).map((seg, i) => (
                                        <div key={i}
                                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 border-2 border-white dark:border-card-dark"
                                            style={{ left: `${((i + 1) / offer.stops) * 80 + 10}%` }}
                                            title={seg.arrival_airport}
                                        />
                                    ))}
                                </div>
                                <span className={`text-[10px] font-medium ${offer.stops === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {offer.stops > 0 ? `${offer.stops} escala${offer.stops > 1 ? 's' : ''} (${getStopoverAirports(outbound)})` : 'Directo'}
                                </span>
                            </div>

                            <div className="text-center min-w-[60px]">
                                <span className="font-bold text-lg text-text-main dark:text-white block">
                                    {format(new Date(lastOutbound.arrival_time), 'HH:mm')}
                                </span>
                                <span className="text-xs text-text-muted">{lastOutbound.arrival_airport}</span>
                                {lastOutbound.arrival_terminal && (
                                    <span className="text-[10px] text-text-muted block">T{lastOutbound.arrival_terminal}</span>
                                )}
                            </div>
                        </div>

                        {/* Aircraft info */}
                        {firstOutbound.aircraft_name && (
                            <p className="text-[10px] text-text-muted mt-1 text-center">
                                ✈️ {firstOutbound.aircraft_name}
                                {firstOutbound.operating_carrier_name && firstOutbound.operating_carrier_code !== firstOutbound.carrier_code && (
                                    <span> · Operado por {firstOutbound.operating_carrier_name}</span>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Return (if exists) */}
                    {returnFlight && returnFlight.length > 0 && (
                        <div className="border-t border-dashed border-stroke dark:border-input-dark pt-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center min-w-[60px]">
                                    <span className="font-bold text-lg text-text-main dark:text-white block">
                                        {format(new Date(returnFlight[0].departure_time), 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-text-muted">{returnFlight[0].departure_airport}</span>
                                    {returnFlight[0].departure_terminal && (
                                        <span className="text-[10px] text-text-muted block">T{returnFlight[0].departure_terminal}</span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-xs text-text-muted">{formatDuration(returnFlight[0].duration)}</span>
                                    <div className="w-full h-[2px] bg-stroke dark:bg-input-dark relative my-1">
                                        {returnFlight.length > 1 && returnFlight.slice(0, -1).map((seg, i) => (
                                            <div key={i}
                                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 border-2 border-white dark:border-card-dark"
                                                style={{ left: `${((i + 1) / (returnFlight.length - 1)) * 80 + 10}%` }}
                                                title={seg.arrival_airport}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-medium ${returnFlight.length === 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {returnFlight.length > 1 ? `${returnFlight.length - 1} escala${returnFlight.length > 2 ? 's' : ''} (${getStopoverAirports(returnFlight)})` : 'Directo'}
                                    </span>
                                </div>

                                <div className="text-center min-w-[60px]">
                                    <span className="font-bold text-lg text-text-main dark:text-white block">
                                        {format(new Date(returnFlight[returnFlight.length - 1].arrival_time), 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-text-muted">{returnFlight[returnFlight.length - 1].arrival_airport}</span>
                                    {returnFlight[returnFlight.length - 1].arrival_terminal && (
                                        <span className="text-[10px] text-text-muted block">T{returnFlight[returnFlight.length - 1].arrival_terminal}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price & Action */}
                <div className="md:border-l border-stroke dark:border-input-dark md:pl-6 flex flex-col justify-center items-end min-w-[150px]">
                    {offer.number_of_bookable_seats && offer.number_of_bookable_seats < 5 && (
                        <span className="text-[10px] text-amber-500 font-medium mb-1">
                            ¡Solo {offer.number_of_bookable_seats} plazas!
                        </span>
                    )}
                    <span className="text-xs text-text-muted mb-1">Total por persona</span>
                    <span className="text-2xl font-black text-text-main dark:text-white font-display">
                        {offer.currency} {offer.price}
                    </span>
                    {offer.base_price && offer.base_price !== offer.price && (
                        <span className="text-[10px] text-text-muted">Base: {offer.currency} {offer.base_price}</span>
                    )}
                    <button
                        onClick={handleBookingClick}
                        disabled={!offer.booking_url}
                        className="mt-4 w-full py-2.5 px-4 bg-voaya-primary text-white text-sm font-bold rounded-xl hover:bg-voaya-primary-dark transition-colors shadow-sm hover:shadow-md active:scale-95 transform duration-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Ver oferta
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                    {offer.last_ticketing_date && (
                        <span className="text-[10px] text-text-muted mt-2">
                            Reservar antes: {format(new Date(offer.last_ticketing_date), 'dd MMM', { locale: es })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const FlightSkeleton = () => (
    <div className="bg-white dark:bg-card-dark border border-stroke dark:border-input-dark rounded-2xl p-5 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6 justify-between">
            <div className="flex-1 space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                        <div className="flex-1">
                            <div className="flex justify-between mb-2">
                                <div className="h-6 w-16 bg-gray-200 dark:bg-white/10 rounded" />
                                <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                                <div className="h-6 w-16 bg-gray-200 dark:bg-white/10 rounded" />
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="md:w-[140px] flex flex-col gap-3 items-end">
                <div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-10 w-full bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>
        </div>
    </div>
);


// ==========================================
// MAIN PAGE
// ==========================================

export default function TripDetailPage() {
    const params = useParams() as { tripId: string };
    const router = useRouter();
    const [viaje, setViaje] = useState<ViajeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Polling logic
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchViaje = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const res: any = await ApiService.obtenerViaje(params.tripId);

            // Use mapFromBd logic or assume existing API structure
            // Adjust structure since `obtenerViaje` wraps in { viaje: ... }
            const data = res.viaje || res;

            setViaje(data);

            // Check flight status for polling
            const flightStatus = data.metadatos?.flight_status;

            if (flightStatus === 'searching' || flightStatus === 'creating') {
                // Keep polling
                if (!pollingRef.current) {
                    pollingRef.current = setTimeout(() => fetchViaje(true), 3000);
                }
            } else {
                // Stop polling
                if (pollingRef.current) {
                    clearTimeout(pollingRef.current);
                    pollingRef.current = null;
                }
            }

        } catch (err: any) {
            console.error('Error fetching trip:', err);
            setError('No pudimos cargar tu viaje');
        } finally {
            if (!background) setLoading(false);
        }
    };

    useEffect(() => {
        fetchViaje();
        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, [params.tripId]);

    // Restart polling if status changes to searching (e.g. user triggers retry)
    useEffect(() => {
        if (viaje?.metadatos?.flight_status === 'searching' && !pollingRef.current) {
            pollingRef.current = setTimeout(() => fetchViaje(true), 3000);
        }
    }, [viaje]);


    if (loading && !viaje) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background-light dark:bg-background">
                <Loader />
                <p className="text-text-secondary animate-pulse">Cargando tu aventura...</p>
            </div>
        );
    }

    if (error || !viaje) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background-light dark:bg-background">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500">error_outline</span>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-text-main dark:text-white">Algo salió mal</h1>
                <p className="text-text-secondary mb-8">{error || 'No pudimos encontrar este viaje'}</p>
                <Link href="/my-trips">
                    <button className="px-6 py-3 bg-text-main dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-black/80 dark:hover:bg-white/90 transition-all">
                        Volver a mis viajes
                    </button>
                </Link>
            </div>
        );
    }

    const extracted = viaje.metadatos?.extracted_data;
    const flights = viaje.metadatos?.flight_results;
    const isSearching = viaje.metadatos?.flight_status === 'searching';
    const hasFlights = flights && flights.offers && flights.offers.length > 0;

    return (
        <main className="min-h-screen bg-background-light dark:bg-background pb-20">

            {/* 1. HERO HEADER */}
            <TripHeader viaje={viaje} extracted={extracted} />

            <div className="max-w-[1200px] mx-auto px-6 -mt-10 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* 2. LEFT COLUMN - FLIGHTS */}
                    <section className="flex-1 space-y-6">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20 dark:border-white/5 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-text-main dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-voaya-primary">travel</span>
                                        Vuelos Disponibles
                                    </h2>
                                    <p className="text-text-secondary dark:text-text-muted mt-1 text-sm">
                                        {hasFlights
                                            ? `Encontramos ${flights.total_offers} opciones para tu viaje`
                                            : 'Buscando las mejores conexiones...'
                                        }
                                    </p>
                                </div>
                                {isSearching && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                        Buscando en tiempo real
                                    </div>
                                )}
                            </div>

                            {/* LIST OF FLIGHTS */}
                            <div className="space-y-4">
                                {isSearching && !hasFlights && (
                                    <>
                                        <FlightSkeleton />
                                        <FlightSkeleton />
                                        <FlightSkeleton />
                                    </>
                                )}

                                {!isSearching && !hasFlights && (
                                    <div className="text-center py-12 border-2 border-dashed border-stroke dark:border-input-dark rounded-2xl">
                                        <span className="material-symbols-outlined text-4xl text-text-muted mb-2">flight_off</span>
                                        <p className="text-text-secondary font-medium">No se encontraron vuelos para estas fechas.</p>
                                    </div>
                                )}

                                {hasFlights && flights.offers.map((offer) => (
                                    <FlightCard key={offer.id} offer={offer} />
                                ))}

                                {/* Load More Button */}
                                {hasFlights && flights.has_more && (
                                    <div className="pt-4 text-center">
                                        <button
                                            className="px-6 py-3 bg-voaya-primary/10 text-voaya-primary font-bold rounded-xl hover:bg-voaya-primary hover:text-white transition-all flex items-center gap-2 mx-auto"
                                            onClick={() => {
                                                // TODO: Implement load more from cache
                                                // Call /cache/{tripId}?page=2
                                            }}
                                        >
                                            <span className="material-symbols-outlined">expand_more</span>
                                            Cargar más vuelos
                                            <span className="text-xs opacity-70">
                                                ({flights.offers.length} de {flights.total_offers})
                                            </span>
                                        </button>
                                    </div>
                                )}

                                {/* Pagination info */}
                                {hasFlights && !flights.has_more && flights.total_offers > flights.offers.length && (
                                    <p className="text-center text-text-muted text-sm pt-4">
                                        Mostrando {flights.offers.length} de {flights.total_offers} vuelos
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* UPCOMING: HOTELS */}
                        <div className="bg-white/50 dark:bg-surface-dark/50 rounded-3xl p-8 border border-stroke dark:border-input-dark opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined">hotel</span>
                                    Hoteles y Alojamiento
                                </h2>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-text-secondary">
                                    Próximamente
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-text-muted">La búsqueda de hoteles estará disponible pronto.</p>
                        </div>
                    </section>

                    {/* 3. RIGHT COLUMN - SUMMARY / ACTIONS (Optional sidebar) */}
                    <aside className="lg:w-[320px] space-y-6">
                        {/* Assistant Card */}
                        <div className="bg-gradient-to-br from-voaya-primary to-voaya-secondary p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700">
                                <span className="material-symbols-outlined text-[150px]">auto_awesome</span>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">Asistente Voaya</h3>
                                <p className="text-white/90 text-sm mb-4">
                                    ¿No te convencen los vuelos? Puedo ajustar la búsqueda por ti.
                                </p>
                                <button className="w-full py-2.5 bg-white text-voaya-primary font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors">
                                    Pedir cambios
                                </button>
                            </div>
                        </div>

                        {/* Extracted Details Summary */}
                        {/* Extracted Details Summary */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-stroke dark:border-input-dark shadow-sm">
                            <h3 className="font-bold text-text-main dark:text-white mb-4 text-sm uppercase tracking-wider">Detalles extraídos</h3>
                            <ul className="space-y-4 text-sm">
                                {[
                                    { label: 'Tipo de viaje', value: extracted?.trip_type || viaje.metadatos?.trip_type || viaje.metadatos?.tipo_viaje },
                                    { label: 'Preferencia', value: extracted?.preferences?.travel_class || viaje.metadatos?.preferences?.travel_class || 'Estándar' },
                                    { label: 'Pasajeros', value: extracted?.travelers || viaje.metadatos?.travelers || viaje.metadatos?.viajeros },
                                ].map((item, i) => (
                                    <li key={i} className="flex justify-between items-center pb-3 border-b border-stroke dark:border-input-dark last:border-0 last:pb-0">
                                        <span className="text-text-muted">{item.label}</span>
                                        <span className="font-medium text-text-main dark:text-white max-w-[50%] text-right truncate">
                                            {item.value || '-'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                </div>
            </div>
        </main>
    );
}
