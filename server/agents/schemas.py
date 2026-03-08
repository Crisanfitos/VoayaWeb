"""
Pydantic schemas for the flight search agent system.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TravelClass(str, Enum):
    ECONOMY = "ECONOMY"
    PREMIUM_ECONOMY = "PREMIUM_ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"


class Passengers(BaseModel):
    """Number of passengers by type."""
    adults: int = Field(default=1, ge=1, le=9)
    children: int = Field(default=0, ge=0, le=9)
    infants: int = Field(default=0, ge=0, le=9)


class TravelPreferences(BaseModel):
    """User travel preferences extracted from chat."""
    travel_class: TravelClass = TravelClass.ECONOMY
    direct_flights_only: bool = False
    luggage_type: Optional[str] = Field(None, description="hand_only or hand_and_hold")
    max_price: Optional[float] = None
    preferred_airlines: List[str] = Field(default_factory=list)
    flexible_dates: bool = False


class ExtractedTravelData(BaseModel):
    """Data extracted from chat conversation."""
    origin: Optional[str] = Field(None, description="Origin airport/city IATA code (e.g., MAD)")
    origin_name: Optional[str] = Field(None, description="Origin city name")
    destination: Optional[str] = Field(None, description="Destination airport/city IATA code")
    destination_name: Optional[str] = Field(None, description="Destination city name")
    departure_date: Optional[str] = Field(None, description="Departure date in YYYY-MM-DD format")
    return_date: Optional[str] = Field(None, description="Return date in YYYY-MM-DD format (if round trip)")
    passengers: Passengers = Field(default_factory=Passengers)
    preferences: TravelPreferences = Field(default_factory=TravelPreferences)
    is_round_trip: bool = True
    extraction_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    missing_fields: List[str] = Field(default_factory=list)


class FlightSegment(BaseModel):
    """A single flight segment with all available data from Amadeus."""
    # Required fields
    departure_airport: str
    arrival_airport: str
    departure_time: str
    arrival_time: str
    carrier_code: str
    flight_number: str
    duration: str
    
    # Optional: Terminal info
    departure_terminal: Optional[str] = None
    arrival_terminal: Optional[str] = None
    
    # Optional: Airline info
    carrier_name: Optional[str] = None
    operating_carrier_code: Optional[str] = None  # If different from marketing carrier
    operating_carrier_name: Optional[str] = None
    
    # Optional: Aircraft info
    aircraft_code: Optional[str] = None
    aircraft_name: Optional[str] = None  # e.g., "Boeing 787-8"
    
    # Optional: Stops within segment
    number_of_stops: int = 0
    
    # Optional: Segment metadata
    segment_id: Optional[str] = None
    blacklisted_in_eu: bool = False


class BaggageInfo(BaseModel):
    """Baggage allowance info."""
    checked_bags_quantity: Optional[int] = None
    checked_bags_weight: Optional[int] = None
    checked_bags_weight_unit: Optional[str] = None  # KG or LB
    cabin_bags_quantity: Optional[int] = None


class FareDetails(BaseModel):
    """Fare and pricing details per segment."""
    segment_id: Optional[str] = None
    cabin_class: Optional[str] = None  # ECONOMY, BUSINESS, etc.
    fare_basis: Optional[str] = None
    branded_fare: Optional[str] = None  # e.g., "LITE", "CLASSIC", "FLEX"
    branded_fare_label: Optional[str] = None
    booking_class: Optional[str] = None  # e.g., "N", "Y", "J"
    baggage: Optional[BaggageInfo] = None
    amenities: List[str] = Field(default_factory=list)  # e.g., ["WIFI", "PRIORITY_BOARDING"]


class FlightOffer(BaseModel):
    """A complete flight offer from Amadeus with full pricing and fare details."""
    id: str
    
    # Pricing
    price: str  # Total price
    currency: str
    base_price: Optional[str] = None  # Price before taxes
    grand_total: Optional[str] = None  # Final price
    
    # Flight structure
    total_duration: str
    stops: int
    outbound_segments: List[FlightSegment]
    return_segments: Optional[List[FlightSegment]] = None
    
    # Airline info
    validating_airline: Optional[str] = None
    validating_airline_name: Optional[str] = None
    
    # Booking
    booking_url: Optional[str] = None
    last_ticketing_date: Optional[str] = None
    last_ticketing_datetime: Optional[str] = None
    
    # Availability
    number_of_bookable_seats: Optional[int] = None
    instant_ticketing_required: bool = False
    
    # Fare details (per traveler type)
    fare_details: Optional[List[FareDetails]] = None
    
    # Offer metadata
    source: Optional[str] = None  # e.g., "GDS"
    is_upsell_offer: bool = False


class FlightSearchResult(BaseModel):
    """Results from flight search with pagination support."""
    success: bool
    offers: List[FlightOffer] = Field(default_factory=list)
    total_offers: int = 0
    search_params: Optional[ExtractedTravelData] = None
    error_message: Optional[str] = None
    search_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Smart search metadata
    direct_flights_available: Optional[bool] = None
    direct_flights_count: int = 0
    used_alternative_departure: Optional[str] = None
    used_alternative_return: Optional[str] = None
    user_messages: List[str] = Field(default_factory=list)
    
    # Pagination support
    page: int = 1
    page_size: int = 10
    total_pages: int = 1
    has_more: bool = False
    cache_id: Optional[str] = None  # For retrieving cached results


class ChatMessage(BaseModel):
    """A single chat message."""
    id: Optional[str] = None
    role: str
    text: str
    createdAt: Optional[str] = None


class ChatData(BaseModel):
    """Chat metadata."""
    id: str
    userId: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    categories: List[str] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    """Request to analyze a chat and search for flights."""
    chat: ChatData
    messages: List[ChatMessage]
    secret: Optional[str] = None


class SearchRequest(BaseModel):
    """Request to search for flights using extracted data."""
    tripId: str
    extracted_data: ExtractedTravelData
    secret: Optional[str] = None



class AgentResponse(BaseModel):
    """Final response from the agent system."""
    chatId: str
    extracted_data: Optional[ExtractedTravelData] = None
    flight_results: Optional[FlightSearchResult] = None
    agent_version: str = "1.0.0"
    processing_time_ms: int = 0
    logs: List[str] = Field(default_factory=list)


class FlightFilters(BaseModel):
    """Filters for flight search results."""
    max_price: Optional[float] = None
    max_duration_minutes: Optional[int] = None
    direct_only: bool = False
    airlines: Optional[List[str]] = None
    has_checked_baggage: Optional[bool] = None
    departure_time_min: Optional[str] = None
    departure_time_max: Optional[str] = None
    arrival_time_min: Optional[str] = None
    arrival_time_max: Optional[str] = None
    sort_by: str = "price"
    sort_order: str = "asc"
