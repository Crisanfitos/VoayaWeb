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


def get_amadeus_client() -> Client:
    """Initialize Amadeus client with credentials."""
    hostname = os.getenv("AMADEUS_HOSTNAME", "test")
    return Client(
        client_id=os.getenv("AMADEUS_API_KEY"),
        client_secret=os.getenv("AMADEUS_API_SECRET"),
        hostname=hostname
    )


def build_booking_url(offer: dict, travel_data: ExtractedTravelData) -> str:
    """Build a URL to search for this flight on a booking site."""
    # Use Skyscanner as a fallback booking URL
    origin = travel_data.origin or ""
    destination = travel_data.destination or ""
    departure = travel_data.departure_date or ""
    
    # Format: skyscanner.es/transport/flights/mad/cdg/240315/
    date_formatted = departure.replace("-", "")[2:] if departure else ""
    
    base_url = "https://www.skyscanner.es/transport/flights"
    url = f"{base_url}/{origin.lower()}/{destination.lower()}/{date_formatted}/"
    
    if travel_data.return_date:
        return_formatted = travel_data.return_date.replace("-", "")[2:]
        url = f"{base_url}/{origin.lower()}/{destination.lower()}/{date_formatted}/{return_formatted}/"
    
    return url


def parse_flight_offer(offer: dict, travel_data: ExtractedTravelData) -> FlightOffer:
    """Parse Amadeus flight offer into our schema."""
    price_info = offer.get("price", {})
    itineraries = offer.get("itineraries", [])
    
    outbound_segments = []
    return_segments = []
    
    for idx, itinerary in enumerate(itineraries):
        segments_list = []
        for seg in itinerary.get("segments", []):
            carrier_code = seg.get("carrierCode", "")
            segment = FlightSegment(
                departure_airport=seg.get("departure", {}).get("iataCode", ""),
                arrival_airport=seg.get("arrival", {}).get("iataCode", ""),
                departure_time=seg.get("departure", {}).get("at", ""),
                arrival_time=seg.get("arrival", {}).get("at", ""),
                carrier_code=carrier_code,
                carrier_name=AIRLINE_NAMES.get(carrier_code, carrier_code),
                flight_number=f"{carrier_code}{seg.get('number', '')}",
                duration=seg.get("duration", ""),
                aircraft=seg.get("aircraft", {}).get("code")
            )
            segments_list.append(segment)
        
        if idx == 0:
            outbound_segments = segments_list
        else:
            return_segments = segments_list
    
    # Calculate total stops
    total_stops = len(outbound_segments) - 1 if outbound_segments else 0
    
    # Get total duration from first itinerary
    total_duration = itineraries[0].get("duration", "") if itineraries else ""
    
    return FlightOffer(
        id=offer.get("id", ""),
        price=price_info.get("grandTotal", price_info.get("total", "0")),
        currency=price_info.get("currency", "EUR"),
        total_duration=total_duration,
        stops=total_stops,
        outbound_segments=outbound_segments,
        return_segments=return_segments if return_segments else None,
        booking_url=build_booking_url(offer, travel_data),
        validating_airline=offer.get("validatingAirlineCodes", [""])[0] if offer.get("validatingAirlineCodes") else None,
        last_ticketing_date=offer.get("lastTicketingDate")
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


def search_flights(travel_data: ExtractedTravelData, max_results: int = 10) -> FlightSearchResult:
    """
    Search for flights using Amadeus API.
    
    Args:
        travel_data: Extracted travel data from chat
        max_results: Maximum number of results to return
        
    Returns:
        FlightSearchResult with offers or error
    """
    agent_logger.log("flight_search", f"Starting flight search: {travel_data.origin} → {travel_data.destination}")
    
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

        # Validate required fields (using resolved codes)
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

        # Build search parameters
        search_params = {
            "originLocationCode": origin_code,
            "destinationLocationCode": dest_code,
            "departureDate": travel_data.departure_date,
            "adults": travel_data.passengers.adults,
            "max": max_results
        }
        
        # Add optional parameters
        if travel_data.return_date and travel_data.is_round_trip:
            search_params["returnDate"] = travel_data.return_date
        
        if travel_data.passengers.children > 0:
            search_params["children"] = travel_data.passengers.children
        
        if travel_data.passengers.infants > 0:
            search_params["infants"] = travel_data.passengers.infants
        
        if travel_data.preferences.travel_class:
            search_params["travelClass"] = travel_data.preferences.travel_class.value
        
        if travel_data.preferences.direct_flights_only:
            search_params["nonStop"] = True
        
        if travel_data.preferences.max_price:
            search_params["maxPrice"] = int(travel_data.preferences.max_price)
        
        agent_logger.log("flight_search", f"Search params: {search_params}")
        
        # Execute search
        response = amadeus.shopping.flight_offers_search.get(**search_params)
        
        offers_data = response.data
        agent_logger.log("flight_search", f"Found {len(offers_data)} flight offers")
        
        # Parse offers
        offers = []
        for offer_data in offers_data:
            try:
                offer = parse_flight_offer(offer_data, travel_data)
                offers.append(offer)
            except Exception as e:
                agent_logger.log("flight_search", f"Error parsing offer: {e}", level="warning")
                continue
        
        return FlightSearchResult(
            success=True,
            offers=offers,
            total_offers=len(offers),
            search_params=travel_data
        )
        
    except ResponseError as error:
        agent_logger.log("flight_search", f"Amadeus API error: {error}", level="error")
        return FlightSearchResult(
            success=False,
            error_message=f"Amadeus API error: {str(error)}",
            search_params=travel_data
        )
    except Exception as e:
        agent_logger.log("flight_search", f"Unexpected error: {e}", level="error")
        return FlightSearchResult(
            success=False,
            error_message=f"Search failed: {str(e)}",
            search_params=travel_data
        )
