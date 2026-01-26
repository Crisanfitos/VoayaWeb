"""
Amadeus API integration for flight search.
"""
import os
from typing import Optional
from amadeus import Client, ResponseError
from schemas import (
    ExtractedTravelData, 
    FlightSearchResult, 
    FlightOffer, 
    FlightSegment
)
from logger import agent_logger


# Airline codes to names mapping (common airlines)
AIRLINE_NAMES = {
    "IB": "Iberia",
    "UX": "Air Europa",
    "VY": "Vueling",
    "FR": "Ryanair",
    "U2": "easyJet",
    "AF": "Air France",
    "LH": "Lufthansa",
    "BA": "British Airways",
    "KL": "KLM",
    "AZ": "ITA Airways",
    "TK": "Turkish Airlines",
    "EK": "Emirates",
    "QR": "Qatar Airways",
    "EY": "Etihad Airways",
    "AA": "American Airlines",
    "UA": "United Airlines",
    "DL": "Delta Air Lines",
    "LX": "Swiss",
    "OS": "Austrian",
    "SN": "Brussels Airlines",
    "TP": "TAP Portugal",
    "AY": "Finnair",
    "SK": "SAS",
    "W6": "Wizz Air",
}

# Common aircraft codes to names
AIRCRAFT_NAMES = {
    "788": "Boeing 787-8",
    "789": "Boeing 787-9",
    "78X": "Boeing 787-10",
    "777": "Boeing 777",
    "773": "Boeing 777-300",
    "772": "Boeing 777-200",
    "738": "Boeing 737-800",
    "739": "Boeing 737-900",
    "73H": "Boeing 737-800",
    "320": "Airbus A320",
    "321": "Airbus A321",
    "319": "Airbus A319",
    "32N": "Airbus A321neo",
    "20N": "Airbus A320neo",
    "32Q": "Airbus A321neo",
    "359": "Airbus A350-900",
    "35K": "Airbus A350-1000",
    "333": "Airbus A330-300",
    "332": "Airbus A330-200",
    "388": "Airbus A380",
    "E90": "Embraer E190",
    "E95": "Embraer E195",
    "CR9": "Bombardier CRJ-900",
    "AT7": "ATR 72",
}

def get_amadeus_client() -> Client:
    """Initialize Amadeus client with credentials."""
    hostname = os.getenv("AMADEUS_HOSTNAME", "test")
    return Client(
        client_id=os.getenv("AMADEUS_API_KEY"),
        client_secret=os.getenv("AMADEUS_API_SECRET"),
        hostname=hostname
    )


def build_booking_url(offer: dict, travel_data: ExtractedTravelData) -> str:
    """
    Build a Google Flights deeplink URL for this flight.
    Google Flights doesn't have CAPTCHA issues like Skyscanner.
    
    Format: https://www.google.com/travel/flights?q=flights%20from%20MAD%20to%20BCN%20on%202024-03-15
    """
    origin = travel_data.origin or ""
    destination = travel_data.destination or ""
    departure = travel_data.departure_date or ""
    
    # Get origin/destination names for better search
    origin_name = travel_data.origin_name or origin
    dest_name = travel_data.destination_name or destination
    
    # Build Google Flights URL
    # Format: /travel/flights?q=flights from ORIGIN to DESTINATION on DATE
    query_parts = [f"flights from {origin_name} to {dest_name}"]
    
    if departure:
        query_parts.append(f"on {departure}")
    
    if travel_data.return_date:
        query_parts.append(f"return {travel_data.return_date}")
    
    # Add passengers if more than 1
    total_passengers = travel_data.passengers.adults + travel_data.passengers.children
    if total_passengers > 1:
        query_parts.append(f"{total_passengers} passengers")
    
    import urllib.parse
    query = " ".join(query_parts)
    encoded_query = urllib.parse.quote(query)
    
    return f"https://www.google.com/travel/flights?q={encoded_query}"


def parse_flight_offer(offer: dict, travel_data: ExtractedTravelData) -> FlightOffer:
    """Parse Amadeus flight offer into our schema with all available fields."""
    from schemas import FlightSegment, FlightOffer, FareDetails, BaggageInfo
    
    price_info = offer.get("price", {})
    itineraries = offer.get("itineraries", [])
    traveler_pricings = offer.get("travelerPricings", [])
    
    outbound_segments = []
    return_segments = []
    
    for idx, itinerary in enumerate(itineraries):
        segments_list = []
        for seg in itinerary.get("segments", []):
            carrier_code = seg.get("carrierCode", "")
            operating = seg.get("operating", {})
            operating_code = operating.get("carrierCode") if operating else None
            
            segment = FlightSegment(
                # Required fields
                departure_airport=seg.get("departure", {}).get("iataCode", ""),
                arrival_airport=seg.get("arrival", {}).get("iataCode", ""),
                departure_time=seg.get("departure", {}).get("at", ""),
                arrival_time=seg.get("arrival", {}).get("at", ""),
                carrier_code=carrier_code,
                flight_number=f"{carrier_code}{seg.get('number', '')}",
                duration=seg.get("duration", ""),
                
                # Terminal info
                departure_terminal=seg.get("departure", {}).get("terminal"),
                arrival_terminal=seg.get("arrival", {}).get("terminal"),
                
                # Airline info
                carrier_name=AIRLINE_NAMES.get(carrier_code, carrier_code),
                operating_carrier_code=operating_code,
                operating_carrier_name=AIRLINE_NAMES.get(operating_code, operating_code) if operating_code else None,
                
                # Aircraft info
                aircraft_code=seg.get("aircraft", {}).get("code"),
                aircraft_name=AIRCRAFT_NAMES.get(seg.get("aircraft", {}).get("code", "")) if seg.get("aircraft") else None,
                
                # Stops and metadata
                number_of_stops=seg.get("numberOfStops", 0),
                segment_id=seg.get("id"),
                blacklisted_in_eu=seg.get("blacklistedInEU", False)
            )
            segments_list.append(segment)
        
        if idx == 0:
            outbound_segments = segments_list
        else:
            return_segments = segments_list
    
    # Parse fare details from travelerPricings
    fare_details_list = []
    if traveler_pricings and len(traveler_pricings) > 0:
        first_traveler = traveler_pricings[0]
        for fare_segment in first_traveler.get("fareDetailsBySegment", []):
            baggage = None
            checked_bags = fare_segment.get("includedCheckedBags", {})
            cabin_bags = fare_segment.get("includedCabinBags", {})
            
            if checked_bags or cabin_bags:
                baggage = BaggageInfo(
                    checked_bags_quantity=checked_bags.get("quantity"),
                    checked_bags_weight=checked_bags.get("weight"),
                    checked_bags_weight_unit=checked_bags.get("weightUnit"),
                    cabin_bags_quantity=cabin_bags.get("quantity")
                )
            
            # Extract amenity descriptions
            amenities = []
            for amenity in fare_segment.get("amenities", []):
                if amenity.get("description"):
                    amenities.append(amenity["description"])
            
            fare_detail = FareDetails(
                segment_id=fare_segment.get("segmentId"),
                cabin_class=fare_segment.get("cabin"),
                fare_basis=fare_segment.get("fareBasis"),
                branded_fare=fare_segment.get("brandedFare"),
                branded_fare_label=fare_segment.get("brandedFareLabel"),
                booking_class=fare_segment.get("class"),
                baggage=baggage,
                amenities=amenities
            )
            fare_details_list.append(fare_detail)
    
    # Calculate total stops
    total_stops = len(outbound_segments) - 1 if outbound_segments else 0
    
    # Get total duration from first itinerary
    total_duration = itineraries[0].get("duration", "") if itineraries else ""
    
    # Get validating airline
    validating_codes = offer.get("validatingAirlineCodes", [])
    validating_airline = validating_codes[0] if validating_codes else None
    
    return FlightOffer(
        id=offer.get("id", ""),
        
        # Pricing
        price=price_info.get("grandTotal", price_info.get("total", "0")),
        currency=price_info.get("currency", "EUR"),
        base_price=price_info.get("base"),
        grand_total=price_info.get("grandTotal"),
        
        # Flight structure
        total_duration=total_duration,
        stops=total_stops,
        outbound_segments=outbound_segments,
        return_segments=return_segments if return_segments else None,
        
        # Airline info
        validating_airline=validating_airline,
        validating_airline_name=AIRLINE_NAMES.get(validating_airline, validating_airline) if validating_airline else None,
        
        # Booking
        booking_url=build_booking_url(offer, travel_data),
        last_ticketing_date=offer.get("lastTicketingDate"),
        last_ticketing_datetime=offer.get("lastTicketingDateTime"),
        
        # Availability
        number_of_bookable_seats=offer.get("numberOfBookableSeats"),
        instant_ticketing_required=offer.get("instantTicketingRequired", False),
        
        # Fare details
        fare_details=fare_details_list if fare_details_list else None,
        
        # Metadata
        source=offer.get("source"),
        is_upsell_offer=offer.get("isUpsellOffer", False)
    )



def get_location_code(keyword: str, amadeus: Client) -> Optional[str]:
    """
    Search for IATA code using Amadeus Location API.
    """
    try:
        if not keyword or len(keyword) < 3:
            return None
            
        # If it looks like an IATA code already
        if len(keyword) == 3 and keyword.isupper():
            return keyword

        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType="CITY,AIRPORT"
        )
        
        if response.data:
            # Return the first match's IATA code
            return response.data[0]['iataCode']
            
        return None
    except Exception as e:
        agent_logger.log("flight_search", f"Location search error for '{keyword}': {e}", level="warning")
        return None


def search_flights(
    travel_data: ExtractedTravelData, 
    trip_id: str = None,
    max_results: int = 50,
    page: int = 1,
    page_size: int = 10
) -> FlightSearchResult:
    """
    Search for flights using Amadeus API with smart fallbacks and caching.
    
    Strategy:
    1. Check cache first if trip_id provided
    2. Always search WITHOUT nonStop first (to get any results)
    3. If user requested direct flights, do a second search with nonStop
    4. If 0 results for a date, try nearby dates (±3 days max, never past)
    5. Cache results and return paginated response
    
    Args:
        travel_data: Extracted travel data from chat
        trip_id: Trip ID for caching (uses tripId as cache key)
        max_results: Maximum number of results from API (default 50)
        page: Page number for pagination (default 1)
        page_size: Results per page (default 10)
        
    Returns:
        FlightSearchResult with offers, pagination info, and messages
    """
    from cache import flight_cache
    from datetime import datetime, timedelta
    
    agent_logger.log("flight_search", f"Starting smart flight search: {travel_data.origin} → {travel_data.destination}")
    
    user_messages = []
    direct_flights_available = None
    direct_flights_count = 0
    used_alternative_departure = None
    used_alternative_return = None
    
    try:
        amadeus = get_amadeus_client()
        
        # 1. Resolve IATA codes if needed
        origin_code = travel_data.origin
        if origin_code and len(origin_code) != 3:
            resolved = get_location_code(origin_code, amadeus)
            if resolved:
                origin_code = resolved
                agent_logger.log("flight_search", f"Resolved origin '{travel_data.origin}' to {origin_code}")

        dest_code = travel_data.destination
        if dest_code and len(dest_code) != 3:
            resolved = get_location_code(dest_code, amadeus)
            if resolved:
                dest_code = resolved
                agent_logger.log("flight_search", f"Resolved destination '{travel_data.destination}' to {dest_code}")

        # Validate required fields
        if not origin_code or not dest_code or not travel_data.departure_date:
            missing = []
            if not origin_code: missing.append(f"origin ({travel_data.origin})")
            if not dest_code: missing.append(f"destination ({travel_data.destination})")
            if not travel_data.departure_date: missing.append("departure_date")
            
            agent_logger.log("flight_search", f"Missing required fields: {missing}", level="error")
            return FlightSearchResult(
                success=False,
                error_message=f"Missing required fields: {', '.join(missing)}",
                search_params=travel_data
            )

        # Parse dates
        today = datetime.now().date()
        departure_date = datetime.strptime(travel_data.departure_date, "%Y-%m-%d").date()
        return_date = None
        if travel_data.return_date and travel_data.is_round_trip:
            return_date = datetime.strptime(travel_data.return_date, "%Y-%m-%d").date()

        # ===========================================
        # STEP 1: Search WITHOUT nonStop (get any flights)
        # ===========================================
        base_params = {
            "originLocationCode": origin_code,
            "destinationLocationCode": dest_code,
            "departureDate": travel_data.departure_date,
            "adults": travel_data.passengers.adults,
            "max": max_results
        }
        
        if return_date:
            base_params["returnDate"] = travel_data.return_date
        
        if travel_data.passengers.children > 0:
            base_params["children"] = travel_data.passengers.children
        
        if travel_data.passengers.infants > 0:
            base_params["infants"] = travel_data.passengers.infants
        
        if travel_data.preferences.travel_class:
            base_params["travelClass"] = travel_data.preferences.travel_class.value
        
        if travel_data.preferences.max_price:
            base_params["maxPrice"] = int(travel_data.preferences.max_price)
        
        agent_logger.log("flight_search", f"Search params (no nonStop): {base_params}")
        
        # Execute main search (without nonStop)
        offers_data = []
        try:
            response = amadeus.shopping.flight_offers_search.get(**base_params)
            offers_data = response.data
            agent_logger.log("flight_search", f"Found {len(offers_data)} flight offers (all flights)")
        except ResponseError as e:
            agent_logger.log("flight_search", f"Main search failed: {e}", level="error")
        
        # ===========================================
        # STEP 2: If 0 results, try alternative dates
        # ===========================================
        if len(offers_data) == 0:
            agent_logger.log("flight_search", "0 results, trying alternative dates...")
            
            # Try ±1, ±2, ±3 days for departure
            for delta in [1, -1, 2, -2, 3, -3]:
                alt_date = departure_date + timedelta(days=delta)
                
                # Never search past dates
                if alt_date < today:
                    continue
                    
                alt_params = {**base_params, "departureDate": alt_date.strftime("%Y-%m-%d")}
                
                # If round trip, also adjust return date by same delta
                if return_date:
                    alt_return = return_date + timedelta(days=delta)
                    if alt_return > alt_date:  # Return must be after departure
                        alt_params["returnDate"] = alt_return.strftime("%Y-%m-%d")
                
                agent_logger.log("flight_search", f"Trying alternative date: {alt_date}")
                
                try:
                    response = amadeus.shopping.flight_offers_search.get(**alt_params)
                    if response.data:
                        offers_data = response.data
                        used_alternative_departure = alt_date.strftime("%Y-%m-%d")
                        if return_date:
                            used_alternative_return = alt_params.get("returnDate")
                        user_messages.append(f"No encontramos vuelos para {travel_data.departure_date}. Mostrando resultados para {used_alternative_departure}.")
                        agent_logger.log("flight_search", f"Found {len(offers_data)} offers for alternative date {alt_date}")
                        break
                except ResponseError:
                    continue
        
        # ===========================================
        # STEP 3: If user requested direct flights, do second search
        # ===========================================
        direct_offers_data = []
        if travel_data.preferences.direct_flights_only:
            nonstop_params = {**base_params, "nonStop": "true"}
            
            # Use alternative date if we found one
            if used_alternative_departure:
                nonstop_params["departureDate"] = used_alternative_departure
                if used_alternative_return:
                    nonstop_params["returnDate"] = used_alternative_return
            
            agent_logger.log("flight_search", f"Searching for direct flights: {nonstop_params}")
            
            try:
                response = amadeus.shopping.flight_offers_search.get(**nonstop_params)
                direct_offers_data = response.data
                direct_flights_count = len(direct_offers_data)
                direct_flights_available = direct_flights_count > 0
                
                if direct_flights_count == 0:
                    user_messages.append("No hay vuelos directos disponibles para esta ruta. Mostrando vuelos con escalas.")
                else:
                    user_messages.append(f"Encontramos {direct_flights_count} vuelos directos.")
                    
                agent_logger.log("flight_search", f"Direct flights found: {direct_flights_count}")
            except ResponseError as e:
                agent_logger.log("flight_search", f"Direct flight search failed: {e}", level="warning")
                direct_flights_available = False
                user_messages.append("No hay vuelos directos disponibles para esta ruta.")
        
        # ===========================================
        # STEP 4: Parse and return results
        # ===========================================
        # If we have direct flights, prioritize them; otherwise use all flights
        final_offers_data = direct_offers_data if direct_offers_data else offers_data
        
        offers = []
        for offer_data in final_offers_data:
            try:
                offer = parse_flight_offer(offer_data, travel_data)
                offers.append(offer)
            except Exception as e:
                agent_logger.log("flight_search", f"Error parsing offer: {e}", level="warning")
                continue
        
        # If still 0 results after all attempts
        if len(offers) == 0:
            user_messages.append("No encontramos vuelos disponibles para este trayecto. Prueba con otras fechas o destinos.")
        
        # Cache all offers if trip_id provided
        all_offers = offers
        if trip_id and len(offers) > 0:
            # Store full list of offer dicts for pagination
            flight_cache.set(trip_id, [o.model_dump() for o in offers])
            agent_logger.log("flight_search", f"Cached {len(offers)} offers for trip {trip_id}")
        
        # Paginate results
        total_offers = len(all_offers)
        total_pages = (total_offers + page_size - 1) // page_size if total_offers > 0 else 1
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_offers = all_offers[start_idx:end_idx]
        
        return FlightSearchResult(
            success=True,
            offers=paginated_offers,
            total_offers=total_offers,
            search_params=travel_data,
            direct_flights_available=direct_flights_available,
            direct_flights_count=direct_flights_count,
            used_alternative_departure=used_alternative_departure,
            used_alternative_return=used_alternative_return,
            user_messages=user_messages,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_more=page < total_pages,
            cache_id=trip_id
        )
        
    except ResponseError as error:
        # Log detailed error info
        error_detail = "Unknown error"
        try:
            if hasattr(error, 'response') and error.response:
                error_body = error.response.body if hasattr(error.response, 'body') else None
                error_result = error.response.result if hasattr(error.response, 'result') else None
                agent_logger.log("flight_search", f"Amadeus API error status: {error.response.status_code}", level="error")
                agent_logger.log("flight_search", f"Amadeus API error body: {error_body}", level="error")
                agent_logger.log("flight_search", f"Amadeus API error result: {error_result}", level="error")
                
                if error_result and 'errors' in error_result:
                    errors = error_result['errors']
                    if errors and len(errors) > 0:
                        error_detail = errors[0].get('detail', errors[0].get('title', str(error)))
        except Exception as parse_err:
            agent_logger.log("flight_search", f"Could not parse error details: {parse_err}", level="warning")
        
        agent_logger.log("flight_search", f"Amadeus API error: {error}", level="error")
        return FlightSearchResult(
            success=False,
            error_message=f"Amadeus API error: {error_detail}",
            search_params=travel_data,
            user_messages=["Hubo un error al buscar vuelos. Por favor, inténtalo de nuevo."]
        )
    except Exception as e:
        agent_logger.log("flight_search", f"Unexpected error: {e}", level="error")
        return FlightSearchResult(
            success=False,
            error_message=f"Search failed: {str(e)}",
            search_params=travel_data,
            user_messages=["Error inesperado al buscar vuelos."]
        )

