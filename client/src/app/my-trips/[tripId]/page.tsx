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

// Filter types for server-side filtering
interface FlightFilters {
    max_price?: number;
    max_duration_minutes?: number;
    direct_only: boolean;
    airlines?: string[];
    has_checked_baggage?: boolean;
    departure_time_min?: string;
    departure_time_max?: string;
    sort_by: 'price' | 'duration' | 'departure';
    sort_order: 'asc' | 'desc';
}

interface FilterOptions {
    airlines: string[];
    price_range: { min: number; max: number };
}

// IATA airport info cache
const airportCache: Record<string, { city: string; country: string }> = {};

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

const TripHeader = ({ viaje, extracted, onRefresh, isRefreshing }: { viaje: ViajeDetail, extracted?: ExtractedData, onRefresh: () => void, isRefreshing: boolean }) => {
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
                    <div className="flex justify-between items-start">
                        <Link href="/my-trips" className="self-start text-white/80 hover:text-white flex items-center gap-2 transition-colors mb-4 backdrop-blur-md px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/40 border border-white/10">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            <span className="text-sm font-medium">Volver a mis viajes</span>
                        </Link>

                        <button 
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="text-white/80 hover:text-white flex items-center gap-2 transition-colors mb-4 backdrop-blur-md px-4 py-1.5 rounded-full bg-voaya-primary/40 hover:bg-voaya-primary/60 border border-white/20"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                            <span className="text-sm font-bold">{isRefreshing ? 'Buscando...' : 'Volver a buscar vuelos'}</span>
                        </button>
                    </div>

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

// Airport city resolver helper
const getAirportCity = (code: string): string => {
    if (airportCache[code]) return airportCache[code].city;
    return code;
};

// FilterPanel component with Apply button
const FilterPanel = ({
    filters,
    setFilters,
    filterOptions,
    onApply,
    isLoading
}: {
    filters: FlightFilters;
    setFilters: (f: FlightFilters) => void;
    filterOptions: FilterOptions | null;
    onApply: () => void;
    isLoading: boolean;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-surface-default dark:bg-card-dark border border-stroke dark:border-input-dark rounded-2xl mb-4 overflow-hidden">
            {/* Filter Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-voaya-primary">tune</span>
                    <span className="font-semibold text-text-main dark:text-white">Filtros</span>
                    {(filters.direct_only || filters.max_price || filters.airlines?.length) && (
                        <span className="px-2 py-0.5 bg-voaya-primary/10 text-voaya-primary text-xs rounded-full">
                            Activos
                        </span>
                    )}
                </div>
                <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {/* Filter Body */}
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-stroke/50 dark:border-input-dark/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {/* Direct flights */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.direct_only}
                                onChange={(e) => setFilters({ ...filters, direct_only: e.target.checked })}
                                className="w-4 h-4 rounded border-stroke dark:border-input-dark text-voaya-primary focus:ring-voaya-primary"
                            />
                            <span className="text-sm text-text-main dark:text-white">Solo directos</span>
                        </label>

                        {/* Has baggage */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.has_checked_baggage === true}
                                onChange={(e) => setFilters({ ...filters, has_checked_baggage: e.target.checked ? true : undefined })}
                                className="w-4 h-4 rounded border-stroke dark:border-input-dark text-voaya-primary focus:ring-voaya-primary"
                            />
                            <span className="text-sm text-text-main dark:text-white">Con equipaje</span>
                        </label>

                        {/* Max price */}
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Precio máx.</label>
                            <input
                                type="number"
                                placeholder={filterOptions?.price_range.max?.toString() || "500"}
                                value={filters.max_price || ''}
                                onChange={(e) => setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stroke dark:border-input-dark bg-white dark:bg-input-dark text-text-main dark:text-white"
                            />
                        </div>

                        {/* Max duration */}
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Duración máx. (min)</label>
                            <input
                                type="number"
                                placeholder="600"
                                value={filters.max_duration_minutes || ''}
                                onChange={(e) => setFilters({ ...filters, max_duration_minutes: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stroke dark:border-input-dark bg-white dark:bg-input-dark text-text-main dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Airlines */}
                    {filterOptions?.airlines && filterOptions.airlines.length > 0 && (
                        <div className="mt-4">
                            <label className="text-xs text-text-muted block mb-2">Aerolíneas</label>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.airlines.map(airline => (
                                    <button
                                        key={airline}
                                        onClick={() => {
                                            const current = filters.airlines || [];
                                            const updated = current.includes(airline)
                                                ? current.filter(a => a !== airline)
                                                : [...current, airline];
                                            setFilters({ ...filters, airlines: updated.length > 0 ? updated : undefined });
                                        }}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${filters.airlines?.includes(airline)
                                            ? 'bg-voaya-primary text-white border-voaya-primary'
                                            : 'border-stroke dark:border-input-dark text-text-main dark:text-white hover:border-voaya-primary'
                                            }`}
                                    >
                                        {airline}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sort */}
                    <div className="mt-4 flex items-center gap-4">
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Ordenar por</label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value as any })}
                                className="px-3 py-2 text-sm rounded-lg border border-stroke dark:border-input-dark bg-white dark:bg-input-dark text-text-main dark:text-white"
                            >
                                <option value="price">Precio</option>
                                <option value="duration">Duración</option>
                                <option value="departure">Hora salida</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Orden</label>
                            <select
                                value={filters.sort_order}
                                onChange={(e) => setFilters({ ...filters, sort_order: e.target.value as any })}
                                className="px-3 py-2 text-sm rounded-lg border border-stroke dark:border-input-dark bg-white dark:bg-input-dark text-text-main dark:text-white"
                            >
                                <option value="asc">Menor a mayor</option>
                                <option value="desc">Mayor a menor</option>
                            </select>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setFilters({ direct_only: false, sort_by: 'price', sort_order: 'asc' })}
                            className="px-4 py-2 text-sm text-text-muted hover:text-text-main dark:hover:text-white transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={onApply}
                            disabled={isLoading}
                            className="px-6 py-2 bg-voaya-primary text-white text-sm font-bold rounded-xl hover:bg-voaya-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Aplicando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                    Aplicar filtros
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FlightCard = ({ offer }: { offer: any }) => {
    const outbound = offer.escalas || [];
    const returnFlight = offer.metadatos?.return_flight;
    const isDirect = offer.esDirecto;
    
    if (outbound.length === 0 && !offer.aeropuertoOrigen) {
        return null;
    }

    const firstOutbound = outbound[0] || { 
        origen: offer.aeropuertoOrigen, 
        destino: offer.aeropuertoDestino,
        fechaSalida: offer.fechaSalida,
        fechaLlegada: offer.fechaLlegada,
        aerolinea: offer.metadatos?.carrier_name || 'Aerolínea'
    };
    
    const lastOutbound = outbound.length > 0 ? outbound[outbound.length - 1] : firstOutbound;

    const handleBookingClick = () => {
        let url = `https://www.google.com/travel/flights?q=Flights%20to%20${offer.aeropuertoDestino}%20from%20${offer.aeropuertoOrigen}%20on%20${offer.fechaSalida.split('T')[0]}`;
        if (returnFlight) {
            url += `%20returning%20on%20${returnFlight.fechaSalida.split('T')[0]}`;
        }
        window.open(url, '_blank');
    };

    return (
        <div className="group bg-surface-default dark:bg-card-dark border border-stroke dark:border-input-dark rounded-2xl p-5 hover:border-voaya-primary/50 hover:shadow-lg transition-all">
            {/* Header with airline */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stroke/50 dark:border-input-dark/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-voaya-primary/10 dark:bg-voaya-primary/20 flex items-center justify-center">
                        <span className="font-bold text-sm text-voaya-primary">
                            {firstOutbound.aerolinea?.substring(0, 2).toUpperCase() || 'FL'}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-text-main dark:text-white text-sm">
                            {offer.metadatos?.carrier_name || firstOutbound.aerolinea}
                        </p>
                        <p className="text-xs text-text-muted">
                            {firstOutbound.numeroVuelo || 'Vuelo de oferta'} • {returnFlight ? 'Ida y Vuelta' : 'Solo ida'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-between">
                {/* Flight Info */}
                <div className="flex-1 space-y-6">
                    {/* IDA */}
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                                <span className="font-bold text-lg text-text-main dark:text-white block">
                                    {format(new Date(offer.fechaSalida), 'HH:mm')}
                                </span>
                                <span className="text-xs text-text-muted">{offer.aeropuertoOrigen}</span>
                                <span className="text-[9px] text-text-secondary dark:text-text-muted block max-w-[80px] truncate">
                                    {getAirportCity(offer.aeropuertoOrigen)}
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-voaya-primary uppercase tracking-tighter">Ida</span>
                                <div className="w-full h-[2px] bg-stroke dark:bg-input-dark relative my-1">
                                    {outbound.length > 1 && outbound.slice(0, -1).map((_: any, i: number) => (
                                        <div key={i}
                                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 border-2 border-white dark:border-card-dark"
                                            style={{ left: `${((i + 1) / outbound.length) * 100}%` }}
                                        />
                                    ))}
                                </div>
                                <span className={`text-[10px] font-medium ${outbound.length <= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {outbound.length <= 1 ? 'Directo' : `${outbound.length - 1} escala(s)`}
                                </span>
                            </div>

                            <div className="text-center min-w-[60px]">
                                <span className="font-bold text-lg text-text-main dark:text-white block">
                                    {format(new Date(offer.fechaLlegada), 'HH:mm')}
                                </span>
                                <span className="text-xs text-text-muted">{offer.aeropuertoDestino}</span>
                                <span className="text-[9px] text-text-secondary dark:text-text-muted block max-w-[80px] truncate">
                                    {getAirportCity(offer.aeropuertoDestino)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* VUELTA (si existe) */}
                    {returnFlight && (
                        <div className="pt-4 border-t border-dashed border-stroke dark:border-input-dark/50">
                            <div className="flex items-center gap-4">
                                <div className="text-center min-w-[60px]">
                                    <span className="font-bold text-lg text-text-main dark:text-white block">
                                        {format(new Date(returnFlight.fechaSalida), 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-text-muted">{returnFlight.aeropuertoOrigen}</span>
                                    <span className="text-[9px] text-text-secondary dark:text-text-muted block max-w-[80px] truncate">
                                        {getAirportCity(returnFlight.aeropuertoOrigen)}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Vuelta</span>
                                    <div className="w-full h-[2px] bg-stroke dark:bg-input-dark relative my-1">
                                        {returnFlight.escalas?.length > 1 && returnFlight.escalas.slice(0, -1).map((_: any, i: number) => (
                                            <div key={i}
                                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 border-2 border-white dark:border-card-dark"
                                                style={{ left: `${((i + 1) / returnFlight.escalas.length) * 100}%` }}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-medium ${returnFlight.escalas?.length <= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {returnFlight.escalas?.length <= 1 ? 'Directo' : `${returnFlight.escalas.length - 1} escala(s)`}
                                    </span>
                                </div>

                                <div className="text-center min-w-[60px]">
                                    <span className="font-bold text-lg text-text-main dark:text-white block">
                                        {format(new Date(returnFlight.fechaLlegada), 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-text-muted">{returnFlight.aeropuertoDestino}</span>
                                    <span className="text-[9px] text-text-secondary dark:text-text-muted block max-w-[80px] truncate">
                                        {getAirportCity(returnFlight.aeropuertoDestino)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price & Action */}
                <div className="md:border-l border-stroke dark:border-input-dark md:pl-6 flex flex-col justify-center items-end min-w-[150px]">
                    <span className="text-xs text-text-muted mb-1">Precio total (I/V)</span>
                    <span className="text-2xl font-black text-text-main dark:text-white font-display">
                        {offer.moneda} {offer.precio}
                    </span>
                    <button
                        onClick={handleBookingClick}
                        className="mt-4 w-full py-2.5 px-4 bg-voaya-primary text-white text-sm font-bold rounded-xl hover:bg-voaya-primary-dark transition-colors shadow-sm hover:shadow-md active:scale-95 transform duration-100 flex items-center justify-center gap-2"
                    >
                        Ver oferta
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
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

    // Flight display state
    const [displayedOffers, setDisplayedOffers] = useState<FlightOffer[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalOffers, setTotalOffers] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<FlightFilters>({
        direct_only: false,
        sort_by: 'price',
        sort_order: 'asc'
    });
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isFilteredView, setIsFilteredView] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    // Microservice URL
    const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3003';

    // Refresh search function (when expired or manually triggered)
    const refreshSearch = async () => {
        if (!viaje?.id) return;
        setLoading(true);
        setIsExpired(false);
        try {
            // Trigger new search via backend
            await ApiService.reBuscarVuelos(viaje.id);
            
            // Poll will pick up new results
            setViaje(prev => prev ? {
                ...prev,
                metadatos: {
                    ...prev.metadatos,
                    flight_status: 'searching'
                }
            } : null);
        } catch (err) {
            console.error('Error refreshing search:', err);
            setError('Error al iniciar la nueva búsqueda de vuelos');
        } finally {
            setLoading(false);
        }
    };

    // Fetch initial flights from Express backend
    const fetchInitialFlights = async () => {
        if (!viaje?.id) return;

        try {
            const data = await ApiService.obtenerVuelosDelViaje(viaje.id);

            if (data.status === 'expired') {
                setIsExpired(true);
                return;
            }

            if (data.offers) {
                setDisplayedOffers(data.offers);
                setTotalOffers(data.total_offers || 0);
                setCurrentPage(1);
                setHasMore(false); // Express currently returns all top results at once

                // Extract all airport codes to resolve
                const codes = new Set<string>();
                data.offers.forEach((offer: any) => {
                    if (offer.escalas) {
                        offer.escalas.forEach((s: any) => {
                            codes.add(s.origen);
                            codes.add(s.destino);
                        });
                    } else {
                        codes.add(offer.aeropuertoOrigen);
                        codes.add(offer.aeropuertoDestino);
                    }
                });
                resolveAirportCodes(Array.from(codes));

                // Extract filter options from first load
                const airlines = new Set<string>();
                data.offers.forEach((o: any) => {
                    if (o.metadatos?.carrier_name) airlines.add(o.metadatos.carrier_name);
                });
                const prices = data.offers.map((o: any) => o.precio);
                if (prices.length > 0) {
                    setFilterOptions({
                        airlines: Array.from(airlines).sort(),
                        price_range: {
                            min: Math.min(...prices),
                            max: Math.max(...prices)
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching initial flights:', err);
        }
    };

    // Initialize: Fetch flights when trip is loaded and status is completed
    useEffect(() => {
        if (viaje?.id && viaje?.metadatos?.flight_status === 'completed' && !isExpired && !isFilteredView) {
            fetchInitialFlights();
        }
    }, [viaje?.id, viaje?.metadatos?.flight_status, isExpired]);

    // Load more function
    const loadMore = async () => {
        if (isLoadingMore || !viaje?.id) return;
        setIsLoadingMore(true);

        try {
            const nextPage = currentPage + 1;
            let url = `${AGENT_URL}/cache/${viaje.id}?page=${nextPage}&page_size=10`;
            let method = 'GET';
            let body = undefined;
            let headers = undefined;

            if (isFilteredView) {
                url = `${AGENT_URL}/cache/${viaje.id}/filter?page=${nextPage}&page_size=10`;
                method = 'POST';
                body = JSON.stringify(filters);
                headers = { 'Content-Type': 'application/json' };
            }

            const response = await fetch(url, { method, headers, body });

            if (response.ok) {
                const data = await response.json();

                // Check if expired
                if (data.status === 'expired') {
                    setIsExpired(true);
                    return;
                }

                if (data.offers && data.offers.length > 0) {
                    setDisplayedOffers(prev => [...prev, ...data.offers]);
                    setCurrentPage(nextPage);
                    setHasMore(data.has_more || false);
                } else {
                    setHasMore(false);
                }
            } else if (response.status === 404) {
                setIsExpired(true);
            }
        } catch (err) {
            console.error('Error loading more flights:', err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Apply filters function
    const applyFilters = async () => {
        if (!viaje?.id) return;
        setIsFiltering(true);
        setIsFilteredView(true);

        try {
            const response = await fetch(`${AGENT_URL}/cache/${viaje.id}/filter?page=1&page_size=10`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });

            if (response.ok) {
                const data = await response.json();

                // Check if expired
                if (data.status === 'expired') {
                    setIsExpired(true);
                    return;
                }

                setDisplayedOffers(data.offers || []);
                setCurrentPage(1);
                setHasMore(data.has_more || false);
                setTotalOffers(data.total_offers || 0);
                if (data.filter_options) {
                    setFilterOptions(data.filter_options);
                }
            } else if (response.status === 404) {
                setIsExpired(true);
            }
        } catch (err) {
            console.error('Error applying filters:', err);
        } finally {
            setIsFiltering(false);
        }
    };

    // Resolve airport codes to cities via Express backend
    const resolveAirportCodes = async (codes: string[]) => {
        const unresolvedCodes = codes.filter(c => c && !airportCache[c]);
        if (unresolvedCodes.length === 0) return;

        try {
            const data = await ApiService.resolverIataBatch(unresolvedCodes);
            Object.entries(data).forEach(([code, info]: [string, any]) => {
                airportCache[code] = { city: info.city, country: info.country };
            });
            // Force re-render to show names
            setViaje(prev => ({ ...prev } as ViajeDetail));
        } catch (err) {
            console.error('Error resolving airport codes:', err);
        }
    };

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
    // const flights = viaje.metadatos?.flight_results; // Deprecated: data fetched from API
    const isSearching = viaje.metadatos?.flight_status === 'searching';
    const hasFlights = (totalOffers > 0 || displayedOffers.length > 0);

    return (
        <main className="min-h-screen bg-background-light dark:bg-background pb-20">

            {/* 1. HERO HEADER */}
            <TripHeader 
                viaje={viaje} 
                extracted={extracted} 
                onRefresh={refreshSearch} 
                isRefreshing={loading} 
            />

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
                                            ? `Encontramos ${totalOffers} opciones para tu viaje`
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

                            {/* EXPIRED SEARCH UI */}
                            {isExpired && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6 text-center">
                                    <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">timer_off</span>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">
                                        Resultados vencidos
                                    </h3>
                                    <p className="text-text-secondary dark:text-text-muted mb-4 text-sm max-w-md mx-auto">
                                        Los precios y disponibilidad de vuelos cambian constantemente. Por seguridad, los resultados antiguas han expirado.
                                    </p>
                                    <button
                                        onClick={refreshSearch}
                                        disabled={loading}
                                        className="px-6 py-3 bg-voaya-primary text-white font-bold rounded-xl hover:bg-voaya-primary-dark transition-all flex items-center gap-2 mx-auto"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Buscando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">refresh</span>
                                                Buscar de nuevo actualizados
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* FILTER PANEL */}
                            {hasFlights && !isExpired && (
                                <FilterPanel
                                    filters={filters}
                                    setFilters={setFilters}
                                    filterOptions={filterOptions}
                                    onApply={applyFilters}
                                    isLoading={isFiltering}
                                />
                            )}

                            {/* LIST OF FLIGHTS */}
                            {!isExpired && (
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

                                    {displayedOffers.map((offer) => (
                                        <FlightCard key={offer.id} offer={offer} />
                                    ))}

                                    {/* Load More Button */}
                                    {hasMore && (
                                        <div className="pt-4 text-center">
                                            <button
                                                className="px-6 py-3 bg-voaya-primary/10 text-voaya-primary font-bold rounded-xl hover:bg-voaya-primary hover:text-white transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                                                onClick={loadMore}
                                                disabled={isLoadingMore}
                                            >
                                                {isLoadingMore ? (
                                                    <>
                                                        <span className="w-4 h-4 border-2 border-voaya-primary/30 border-t-voaya-primary rounded-full animate-spin" />
                                                        Cargando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined">expand_more</span>
                                                        Cargar más vuelos
                                                        <span className="text-xs opacity-70">
                                                            ({displayedOffers.length} de {totalOffers})
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* All loaded message */}
                                    {displayedOffers.length > 0 && !hasMore && totalOffers > 10 && (
                                        <p className="text-center text-text-muted text-sm pt-4">
                                            ✓ Mostrando todos los {displayedOffers.length} vuelos
                                        </p>
                                    )}
                                </div>
                            )}
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
