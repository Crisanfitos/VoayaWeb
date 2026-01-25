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
    """A single flight segment."""
    departure_airport: str
    arrival_airport: str
    departure_time: str
    arrival_time: str
    carrier_code: str
    carrier_name: Optional[str] = None
    flight_number: str
    duration: str
    aircraft: Optional[str] = None


class FlightOffer(BaseModel):
    """A complete flight offer from Amadeus."""
    id: str
    price: str
    currency: str
    total_duration: str
    stops: int
    outbound_segments: List[FlightSegment]
    return_segments: Optional[List[FlightSegment]] = None
    booking_url: Optional[str] = None
    validating_airline: Optional[str] = None
    last_ticketing_date: Optional[str] = None


class FlightSearchResult(BaseModel):
    """Results from flight search."""
    success: bool
    offers: List[FlightOffer] = Field(default_factory=list)
    total_offers: int = 0
    search_params: Optional[ExtractedTravelData] = None
    error_message: Optional[str] = None
    search_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


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
