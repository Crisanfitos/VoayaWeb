"""
LangGraph agent for extracting travel data from chat conversations.
Uses Gemini for natural language understanding.
"""
import os
import json
from typing import Annotated, TypedDict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from schemas import ExtractedTravelData, Passengers, TravelPreferences, TravelClass, ChatMessage
from logger import agent_logger


# IATA code mapping for common Spanish cities
CITY_TO_IATA = {
    "madrid": "MAD",
    "barcelona": "BCN",
    "valencia": "VLC",
    "sevilla": "SVQ",
    "malaga": "AGP",
    "bilbao": "BIO",
    "alicante": "ALC",
    "palma": "PMI",
    "palma de mallorca": "PMI",
    "tenerife": "TFN",
    "gran canaria": "LPA",
    "las palmas": "LPA",
    "ibiza": "IBZ",
    "santiago": "SCQ",
    "santiago de compostela": "SCQ",
    # International common destinations
    "paris": "CDG",
    "londres": "LHR",
    "london": "LHR",
    "roma": "FCO",
    "rome": "FCO",
    "amsterdam": "AMS",
    "berlin": "BER",
    "lisboa": "LIS",
    "lisbon": "LIS",
    "nueva york": "JFK",
    "new york": "JFK",
    "miami": "MIA",
    "los angeles": "LAX",
    "tokio": "NRT",
    "tokyo": "NRT",
    "bangkok": "BKK",
    "dubai": "DXB",
    "estambul": "IST",
    "istanbul": "IST",
    "atenas": "ATH",
    "athens": "ATH",
    "bruselas": "BRU",
    "brussels": "BRU",
    "viena": "VIE",
    "vienna": "VIE",
    "praga": "PRG",
    "prague": "PRG",
    "budapest": "BUD",
    "dublin": "DUB",
    "edimburgo": "EDI",
    "edinburgh": "EDI",
    "munich": "MUC",
    "frankfurt": "FRA",
    "zurich": "ZRH",
    "ginebra": "GVA",
    "geneva": "GVA",
    "milan": "MXP",
    "venecia": "VCE",
    "venice": "VCE",
    "florencia": "FLR",
    "florence": "FLR",
    "napoles": "NAP",
    "naples": "NAP",
    "marrakech": "RAK",
    "cancun": "CUN",
    "punta cana": "PUJ",
    "la habana": "HAV",
    "havana": "HAV",
    "buenos aires": "EZE",
    "rio de janeiro": "GIG",
    "sao paulo": "GRU",
    "mexico": "MEX",
    "bogota": "BOG",
    "lima": "LIM",
    "santiago de chile": "SCL"
}


def get_iata_code(city_name: str) -> Optional[str]:
    """Try to get IATA code for a city name."""
    if not city_name:
        return None
    # If it's already a 3-letter code, return as-is
    if len(city_name) == 3 and city_name.isalpha():
        return city_name.upper()
    return CITY_TO_IATA.get(city_name.lower().strip())


EXTRACTION_PROMPT = """Eres un experto en extraer información de viajes de conversaciones.

Analiza la siguiente conversación y extrae la información de viaje estructurada.
Debes devolver SOLO un JSON válido con la siguiente estructura:

{
    "origin": "código IATA del aeropuerto de origen (3 letras) o nombre de la ciudad si no conoces el código",
    "origin_name": "nombre de la ciudad de origen",
    "destination": "código IATA del destino o nombre de la ciudad",
    "destination_name": "nombre de la ciudad de destino",
    "departure_date": "fecha de salida en formato YYYY-MM-DD",
    "return_date": "fecha de vuelta en formato YYYY-MM-DD o null si es solo ida",
    "is_round_trip": true o false,
    "passengers": {
        "adults": número de adultos (mínimo 1),
        "children": número de niños (2-11 años),
        "infants": número de bebés (0-2 años)
    },
    "preferences": {
        "travel_class": "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS" o "FIRST",
        "direct_flights_only": true o false,
        "luggage_type": "hand_only" o "hand_and_hold" o null,
        "max_price": precio máximo o null,
        "flexible_dates": true si mencionan flexibilidad en fechas
    },
    "extraction_confidence": número entre 0 y 1 indicando la confianza en la extracción,
    "missing_fields": ["lista de campos que no pudiste determinar"]
}

IMPORTANTE:
- Si el usuario menciona una ciudad, intenta mapearla a su código IATA (ej: Madrid -> MAD, Barcelona -> BCN, Paris -> CDG)
- Las fechas deben estar en formato YYYY-MM-DD
- Si no se especifica número de pasajeros, asume 1 adulto
- Si no se menciona clase, asume ECONOMY
- Si mencionan "solo equipaje de mano", "sin facturar", "cabina": luggage_type = "hand_only"
- Si mencionan "maleta facturada", "bodega", "equipaje grande": luggage_type = "hand_and_hold"
- Si mencionan "vuelos directos", "sin escalas": direct_flights_only = true
- Si mencionan "económico", "barato", "turista": travel_class = "ECONOMY"
- Si mencionan "business", "primera clase", "premium": travel_class = "BUSINESS" o "FIRST"
- Incluye SOLO el JSON sin explicaciones adicionales ni markdown"""


def extract_travel_data(messages: list[ChatMessage], chat_id: str) -> ExtractedTravelData:
    """
    Extract travel data from chat messages using Gemini.
    
    Args:
        messages: List of chat messages
        chat_id: ID of the chat for logging
        
    Returns:
        ExtractedTravelData with parsed travel information
    """
    agent_logger.log("extractor", f"Starting extraction for chat {chat_id}", data={"chat_id": chat_id})
    
    # Build conversation text
    conversation_text = "\n".join([
        f"{msg.role.upper()}: {msg.text}" 
        for msg in messages
    ])
    
    agent_logger.log("extractor", f"Analyzing {len(messages)} messages")
    
    try:
        # Initialize Gemini
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.1  # Low temperature for more consistent extraction
        )
        
        # Create messages
        llm_messages = [
            SystemMessage(content=EXTRACTION_PROMPT),
            HumanMessage(content=f"CONVERSACIÓN:\n\n{conversation_text}")
        ]
        
        # Get response
        response = llm.invoke(llm_messages)
        response_text = response.content
        
        agent_logger.log("extractor", f"Raw LLM response: {response_text[:500]}...")
        
        # Parse JSON from response
        # Try to extract JSON if wrapped in markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        data = json.loads(response_text.strip())
        
        # Map city names to IATA codes if not already codes
        origin_code = data.get("origin")
        dest_code = data.get("destination")
        
        if origin_code and len(origin_code) != 3:
            mapped_code = get_iata_code(origin_code)
            if mapped_code:
                data["origin"] = mapped_code
                agent_logger.log("extractor", f"Mapped origin '{origin_code}' to '{mapped_code}'")
        
        if dest_code and len(dest_code) != 3:
            mapped_code = get_iata_code(dest_code)
            if mapped_code:
                data["destination"] = mapped_code
                agent_logger.log("extractor", f"Mapped destination '{dest_code}' to '{mapped_code}'")
        
        # Parse passengers
        passengers_data = data.get("passengers", {})
        passengers = Passengers(
            adults=passengers_data.get("adults", 1),
            children=passengers_data.get("children", 0),
            infants=passengers_data.get("infants", 0)
        )
        
        # Parse preferences
        prefs_data = data.get("preferences", {})
        travel_class_str = prefs_data.get("travel_class", "ECONOMY")
        try:
            travel_class = TravelClass(travel_class_str)
        except ValueError:
            travel_class = TravelClass.ECONOMY
        
        preferences = TravelPreferences(
            travel_class=travel_class,
            direct_flights_only=prefs_data.get("direct_flights_only", False),
            luggage_type=prefs_data.get("luggage_type"),
            max_price=prefs_data.get("max_price"),
            flexible_dates=prefs_data.get("flexible_dates", False)
        )
        
        # Build result
        result = ExtractedTravelData(
            origin=data.get("origin"),
            origin_name=data.get("origin_name"),
            destination=data.get("destination"),
            destination_name=data.get("destination_name"),
            departure_date=data.get("departure_date"),
            return_date=data.get("return_date"),
            is_round_trip=data.get("is_round_trip", True),
            passengers=passengers,
            preferences=preferences,
            extraction_confidence=data.get("extraction_confidence", 0.5),
            missing_fields=data.get("missing_fields", [])
        )
        
        agent_logger.log(
            "extractor", 
            f"Extraction complete: {result.origin} → {result.destination}, {result.departure_date}",
            level="success",
            data={"chat_id": chat_id}
        )
        
        return result
        
    except json.JSONDecodeError as e:
        agent_logger.log("extractor", f"Failed to parse JSON: {e}", level="error")
        return ExtractedTravelData(
            extraction_confidence=0.0,
            missing_fields=["all - JSON parsing failed"]
        )
    except Exception as e:
        agent_logger.log("extractor", f"Extraction error: {e}", level="error")
        return ExtractedTravelData(
            extraction_confidence=0.0,
            missing_fields=["all - extraction failed"]
        )
