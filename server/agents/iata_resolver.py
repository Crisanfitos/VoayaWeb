"""
IATA Airport Code Resolver Service.
Resolves airport codes to city/country names.
Uses a static dictionary for common airports and Amadeus API for unknown ones.
"""
from typing import Dict, Optional
from functools import lru_cache

# Common airports with city and country
AIRPORT_DATA: Dict[str, Dict[str, str]] = {
    # Spain
    "MAD": {"city": "Madrid", "country": "España", "name": "Adolfo Suárez Madrid-Barajas"},
    "BCN": {"city": "Barcelona", "country": "España", "name": "El Prat"},
    "PMI": {"city": "Palma de Mallorca", "country": "España", "name": "Son Sant Joan"},
    "AGP": {"city": "Málaga", "country": "España", "name": "Costa del Sol"},
    "ALC": {"city": "Alicante", "country": "España", "name": "El Altet"},
    "VLC": {"city": "Valencia", "country": "España", "name": "Manises"},
    "SVQ": {"city": "Sevilla", "country": "España", "name": "San Pablo"},
    "BIO": {"city": "Bilbao", "country": "España", "name": "Loiu"},
    "IBZ": {"city": "Ibiza", "country": "España", "name": "Es Codolar"},
    "TFN": {"city": "Tenerife Norte", "country": "España", "name": "Los Rodeos"},
    "TFS": {"city": "Tenerife Sur", "country": "España", "name": "Reina Sofía"},
    "LPA": {"city": "Las Palmas", "country": "España", "name": "Gran Canaria"},
    "SCQ": {"city": "Santiago", "country": "España", "name": "Lavacolla"},
    
    # Europe Major
    "LHR": {"city": "Londres", "country": "Reino Unido", "name": "Heathrow"},
    "LGW": {"city": "Londres", "country": "Reino Unido", "name": "Gatwick"},
    "STN": {"city": "Londres", "country": "Reino Unido", "name": "Stansted"},
    "LTN": {"city": "Londres", "country": "Reino Unido", "name": "Luton"},
    "CDG": {"city": "París", "country": "Francia", "name": "Charles de Gaulle"},
    "ORY": {"city": "París", "country": "Francia", "name": "Orly"},
    "FCO": {"city": "Roma", "country": "Italia", "name": "Fiumicino"},
    "CIA": {"city": "Roma", "country": "Italia", "name": "Ciampino"},
    "MXP": {"city": "Milán", "country": "Italia", "name": "Malpensa"},
    "BGY": {"city": "Bérgamo", "country": "Italia", "name": "Orio al Serio"},
    "VCE": {"city": "Venecia", "country": "Italia", "name": "Marco Polo"},
    "NAP": {"city": "Nápoles", "country": "Italia", "name": "Capodichino"},
    "FRA": {"city": "Frankfurt", "country": "Alemania", "name": "Frankfurt"},
    "MUC": {"city": "Múnich", "country": "Alemania", "name": "Franz Josef Strauss"},
    "BER": {"city": "Berlín", "country": "Alemania", "name": "Brandenburg"},
    "DUS": {"city": "Düsseldorf", "country": "Alemania", "name": "Düsseldorf"},
    "AMS": {"city": "Ámsterdam", "country": "Países Bajos", "name": "Schiphol"},
    "BRU": {"city": "Bruselas", "country": "Bélgica", "name": "Zaventem"},
    "LIS": {"city": "Lisboa", "country": "Portugal", "name": "Humberto Delgado"},
    "OPO": {"city": "Oporto", "country": "Portugal", "name": "Francisco Sá Carneiro"},
    "ZRH": {"city": "Zúrich", "country": "Suiza", "name": "Kloten"},
    "GVA": {"city": "Ginebra", "country": "Suiza", "name": "Cointrin"},
    "VIE": {"city": "Viena", "country": "Austria", "name": "Schwechat"},
    "PRG": {"city": "Praga", "country": "Chequia", "name": "Václav Havel"},
    "WAW": {"city": "Varsovia", "country": "Polonia", "name": "Chopin"},
    "CPH": {"city": "Copenhague", "country": "Dinamarca", "name": "Kastrup"},
    "OSL": {"city": "Oslo", "country": "Noruega", "name": "Gardermoen"},
    "ARN": {"city": "Estocolmo", "country": "Suecia", "name": "Arlanda"},
    "HEL": {"city": "Helsinki", "country": "Finlandia", "name": "Vantaa"},
    "DUB": {"city": "Dublín", "country": "Irlanda", "name": "Dublin Airport"},
    "ATH": {"city": "Atenas", "country": "Grecia", "name": "Eleftherios Venizelos"},
    "IST": {"city": "Estambul", "country": "Turquía", "name": "Istanbul Airport"},
    "SAW": {"city": "Estambul", "country": "Turquía", "name": "Sabiha Gökçen"},
    
    # Americas
    "JFK": {"city": "Nueva York", "country": "Estados Unidos", "name": "John F. Kennedy"},
    "EWR": {"city": "Newark", "country": "Estados Unidos", "name": "Newark Liberty"},
    "LGA": {"city": "Nueva York", "country": "Estados Unidos", "name": "LaGuardia"},
    "LAX": {"city": "Los Ángeles", "country": "Estados Unidos", "name": "Los Angeles Intl"},
    "MIA": {"city": "Miami", "country": "Estados Unidos", "name": "Miami Intl"},
    "ORD": {"city": "Chicago", "country": "Estados Unidos", "name": "O'Hare"},
    "SFO": {"city": "San Francisco", "country": "Estados Unidos", "name": "San Francisco Intl"},
    "BOS": {"city": "Boston", "country": "Estados Unidos", "name": "Logan"},
    "MEX": {"city": "Ciudad de México", "country": "México", "name": "Benito Juárez"},
    "CUN": {"city": "Cancún", "country": "México", "name": "Cancún Intl"},
    "BOG": {"city": "Bogotá", "country": "Colombia", "name": "El Dorado"},
    "MDE": {"city": "Medellín", "country": "Colombia", "name": "José María Córdova"},
    "LIM": {"city": "Lima", "country": "Perú", "name": "Jorge Chávez"},
    "SCL": {"city": "Santiago", "country": "Chile", "name": "Arturo Merino Benítez"},
    "EZE": {"city": "Buenos Aires", "country": "Argentina", "name": "Ezeiza"},
    "GRU": {"city": "São Paulo", "country": "Brasil", "name": "Guarulhos"},
    "GIG": {"city": "Río de Janeiro", "country": "Brasil", "name": "Galeão"},
    "PTY": {"city": "Panamá", "country": "Panamá", "name": "Tocumen"},
    "HAV": {"city": "La Habana", "country": "Cuba", "name": "José Martí"},
    "SJU": {"city": "San Juan", "country": "Puerto Rico", "name": "Luis Muñoz Marín"},
    
    # Middle East & Africa
    "DXB": {"city": "Dubái", "country": "Emiratos Árabes", "name": "Dubai Intl"},
    "AUH": {"city": "Abu Dabi", "country": "Emiratos Árabes", "name": "Zayed Intl"},
    "DOH": {"city": "Doha", "country": "Catar", "name": "Hamad Intl"},
    "CMN": {"city": "Casablanca", "country": "Marruecos", "name": "Mohammed V"},
    "RAK": {"city": "Marrakech", "country": "Marruecos", "name": "Menara"},
    "TNG": {"city": "Tánger", "country": "Marruecos", "name": "Ibn Battouta"},
    "CAI": {"city": "El Cairo", "country": "Egipto", "name": "Cairo Intl"},
    "TLV": {"city": "Tel Aviv", "country": "Israel", "name": "Ben Gurion"},
    "JNB": {"city": "Johannesburgo", "country": "Sudáfrica", "name": "O.R. Tambo"},
    
    # Asia & Oceania
    "NRT": {"city": "Tokio", "country": "Japón", "name": "Narita"},
    "HND": {"city": "Tokio", "country": "Japón", "name": "Haneda"},
    "PEK": {"city": "Pekín", "country": "China", "name": "Capital Intl"},
    "PVG": {"city": "Shanghái", "country": "China", "name": "Pudong"},
    "HKG": {"city": "Hong Kong", "country": "Hong Kong", "name": "Hong Kong Intl"},
    "SIN": {"city": "Singapur", "country": "Singapur", "name": "Changi"},
    "BKK": {"city": "Bangkok", "country": "Tailandia", "name": "Suvarnabhumi"},
    "KUL": {"city": "Kuala Lumpur", "country": "Malasia", "name": "KLIA"},
    "ICN": {"city": "Seúl", "country": "Corea del Sur", "name": "Incheon"},
    "DEL": {"city": "Nueva Delhi", "country": "India", "name": "Indira Gandhi"},
    "BOM": {"city": "Bombay", "country": "India", "name": "Chhatrapati Shivaji"},
    "SYD": {"city": "Sídney", "country": "Australia", "name": "Kingsford Smith"},
    "MEL": {"city": "Melbourne", "country": "Australia", "name": "Tullamarine"},
    "AKL": {"city": "Auckland", "country": "Nueva Zelanda", "name": "Auckland Intl"},
}


@lru_cache(maxsize=500)
def get_airport_info(iata_code: str) -> Optional[Dict[str, str]]:
    """
    Get airport city and country info from IATA code.
    Uses static dictionary with LRU cache.
    
    Returns: {"city": "...", "country": "...", "name": "..."} or None
    """
    if not iata_code:
        return None
    
    code = iata_code.upper().strip()
    return AIRPORT_DATA.get(code)


def get_city_country_label(iata_code: str) -> str:
    """
    Get a formatted "City, Country" label for display.
    Returns just the code if unknown.
    """
    info = get_airport_info(iata_code)
    if info:
        return f"{info['city']}, {info['country']}"
    return iata_code


def batch_resolve_airports(codes: list[str]) -> Dict[str, Dict[str, str]]:
    """
    Resolve multiple IATA codes at once.
    Returns dict mapping code -> info.
    """
    result = {}
    for code in codes:
        code_upper = code.upper().strip() if code else ""
        if code_upper:
            info = get_airport_info(code_upper)
            if info:
                result[code_upper] = info
            else:
                result[code_upper] = {"city": code_upper, "country": "", "name": ""}
    return result
