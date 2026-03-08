"""
FastAPI server for the flight search agent microservice.
Includes endpoints for processing chats and a real-time monitoring UI.
"""
import os
import asyncio
import json
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from schemas import AnalyzeRequest, SearchRequest, AgentResponse, ChatMessage, FlightFilters
from graph import run_agent
from extractor import extract_travel_data
from amadeus_client import search_flights
from schemas import ExtractedTravelData, FlightSearchResult
from cache import flight_cache
from logger import agent_logger

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Voaya Flight Search Agent",
    description="LangGraph-based agent for analyzing travel chats and searching flights",
    version="1.0.0"
)

# CORS for monitoring UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store for recent results
recent_results: dict[str, AgentResponse] = {}


async def send_callback(response: AgentResponse):
    """Send results back to the Bun backend."""
    callback_url = os.getenv("CALLBACK_URL")
    webhook_secret = os.getenv("WEBHOOK_SECRET")
    
    if not callback_url:
        agent_logger.log("callback", "No CALLBACK_URL configured, skipping callback", level="warning")
        return
    
    try:
        # Convert to metadata format expected by the backend
        metadata = {
            "extracted_data": response.extracted_data.model_dump() if response.extracted_data else None,
            "flight_results": response.flight_results.model_dump() if response.flight_results else None,
            "agent_version": response.agent_version,
            "processing_time_ms": response.processing_time_ms,
            "processed_at": response.flight_results.search_timestamp if response.flight_results else None
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                callback_url,
                json={
                    "chatId": response.chatId,
                    "metadata": metadata,
                    "secret": webhook_secret
                },
                timeout=30.0
            )
            
            if res.status_code == 200:
                agent_logger.log("callback", f"Callback sent successfully for chat {response.chatId}", level="success")
            else:
                agent_logger.log("callback", f"Callback failed: {res.status_code}", level="error")
                
    except Exception as e:
        agent_logger.log("callback", f"Callback error: {e}", level="error")


@app.post("/analyze-and-search", response_model=AgentResponse)
async def analyze_and_search(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Analyze a chat conversation and search for flights.
    Results are sent back to the Bun backend via callback.
    """
    agent_logger.log("api", f"Received request for chat {request.chat.id}")
    
    # Validate secret if configured
    expected_secret = os.getenv("WEBHOOK_SECRET")
    if expected_secret and request.secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")
    
    # Convert messages
    messages = [
        ChatMessage(
            id=msg.id,
            role=msg.role,
            text=msg.text,
            createdAt=msg.createdAt
        )
        for msg in request.messages
    ]
    
    # Run the agent
    response = await run_agent(request.chat.id, messages)
    
    # Store for monitoring UI
    recent_results[request.chat.id] = response
    
    # Send callback in background
    background_tasks.add_task(send_callback, response)
    
    return response


@app.post("/extract", response_model=ExtractedTravelData)
async def extract_only(request: AnalyzeRequest):
    """
    Extract travel data from chat without searching for flights.
    Synchronous endpoint for fast response.
    """
    agent_logger.log("api", f"Received extraction request for chat {request.chat.id}")
    
    # Validate secret
    expected_secret = os.getenv("WEBHOOK_SECRET")
    if expected_secret and request.secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")
    
    # Convert messages
    messages = [
        ChatMessage(
            id=msg.id,
            role=msg.role,
            text=msg.text,
            createdAt=msg.createdAt
        )
        for msg in request.messages
    ]
    
    # Run only extraction
    try:
        extracted = extract_travel_data(messages, request.chat.id)
        return extracted
    except Exception as e:
        agent_logger.log("api", f"Extraction failed: {e}", level="error")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search-flights")
async def search_flights_endpoint(request: SearchRequest, background_tasks: BackgroundTasks):
    """
    Search for flights using previously extracted data.
    Asynchronous endpoint with callback.
    """
    agent_logger.log("api", f"Received search request for trip {request.tripId}")
    
    # Validate secret
    expected_secret = os.getenv("WEBHOOK_SECRET")
    if expected_secret and request.secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")
        
    async def process_search():
        try:
            # Execute search with tripId for caching
            results = search_flights(
                travel_data=request.extracted_data,
                trip_id=request.tripId
            )
            
            # Send callback to backend
            callback_url = os.getenv("CALLBACK_URL")
            if not callback_url:
                agent_logger.log("callback", "No CALLBACK_URL configured", level="warning")
                return

            # Note: Backend expects /api/viajes/:tripId/flight-results
            # We need to construct the URL correctly. 
            # The env var typically points to /api/chats/webhook-callback. 
            # We'll assume the backend exposes a specific endpoint for flight results 
            # or uses a comprehensive webhook. 
            # Let's target the NEW endpoint defined in the plan: 
            # /api/viajes/:tripId/flight-results
            
            # Parse base URL from CALLBACK_URL
            import urllib.parse
            parsed = urllib.parse.urlparse(callback_url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            
            target_url = f"{base_url}/api/viajes/{request.tripId}/flight-results"
            webhook_secret = os.getenv("WEBHOOK_SECRET")
            
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    target_url,
                    json={
                        "flight_results": results.model_dump(),
                        "secret": webhook_secret
                    },
                    timeout=30.0
                )
                
                if res.status_code == 200:
                    agent_logger.log("callback", f"Flight results sent for trip {request.tripId}", level="success")
                else:
                    agent_logger.log("callback", f"Flight results callback failed: {res.status_code}", level="error")
                    
        except Exception as e:
            agent_logger.log("search", f"Async search failed: {e}", level="error")

    # Run in background
    background_tasks.add_task(process_search)
    
    return {"status": "searching", "tripId": request.tripId}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics for debugging."""
    stats = flight_cache.stats()
    return {
        "cache_entries": stats["entries"],
        "cached_trips": stats["keys"],
        "ttl_seconds": flight_cache.default_ttl
    }


@app.get("/cache/{trip_id}")
async def get_cached_results(trip_id: str, page: int = 1, page_size: int = 10):
    """Get cached flight results for a trip with pagination."""
    cached = flight_cache.get_page(trip_id, page, page_size)
    
    if not cached:
         # If truly missing (not even expired)
        raise HTTPException(status_code=404, detail="No cached results for this trip")
    
    # Check for expired status
    if cached.get("status") == "expired":
        return {"status": "expired", "message": "Search results expired"}
        
    return cached


@app.post("/cache/{trip_id}/filter")
async def filter_cached_results(trip_id: str, filters: FlightFilters, page: int = 1, page_size: int = 10):
    """
    Filter and sort cached flight results server-side.
    This avoids API calls and provides fast filtering.
    """
    from datetime import datetime
    
    # Check expiration via get() first
    raw_data = flight_cache.get(trip_id)
    
    if not raw_data:
        raise HTTPException(status_code=404, detail="No cached results for this trip")
        
    if isinstance(raw_data, dict) and raw_data.get("status") == "expired":
        return {"status": "expired", "message": "Search results expired", "offers": []}
    
    # Assume standard list of offers if active
    all_offers = raw_data
    
    filtered = all_offers.copy()
    
    # Parse duration string (PT1H25M) to minutes
    def parse_duration(dur: str) -> int:
        if not dur:
            return 9999
        import re
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', dur)
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            return hours * 60 + minutes
        return 9999
    
    # Parse time string (HH:MM) to minutes from midnight
    def time_to_minutes(time_str: str) -> int:
        if not time_str:
            return 0
        try:
            parts = time_str.split(":")
            return int(parts[0]) * 60 + int(parts[1])
        except:
            return 0
    
    # Get departure time from ISO datetime
    def get_departure_minutes(offer: dict) -> int:
        try:
            segments = offer.get("outbound_segments", [])
            if segments:
                dt = datetime.fromisoformat(segments[0].get("departure_time", "").replace("Z", "+00:00"))
                return dt.hour * 60 + dt.minute
        except:
            pass
        return 0
    
    # Get arrival time from ISO datetime
    def get_arrival_minutes(offer: dict) -> int:
        try:
            segments = offer.get("outbound_segments", [])
            if segments:
                dt = datetime.fromisoformat(segments[-1].get("arrival_time", "").replace("Z", "+00:00"))
                return dt.hour * 60 + dt.minute
        except:
            pass
        return 0
    
    # Apply filters
    if filters.max_price is not None:
        filtered = [o for o in filtered if float(o.get("price", 9999)) <= filters.max_price]
    
    if filters.max_duration_minutes is not None:
        filtered = [o for o in filtered if parse_duration(o.get("total_duration", "")) <= filters.max_duration_minutes]
    
    if filters.direct_only:
        filtered = [o for o in filtered if o.get("stops", 99) == 0]
    
    if filters.airlines:
        airline_set = set(a.upper() for a in filters.airlines)
        filtered = [o for o in filtered if o.get("validating_airline", "").upper() in airline_set]
    
    if filters.has_checked_baggage is not None:
        def has_baggage(offer):
            fare = offer.get("fare_details", [{}])
            if fare and len(fare) > 0:
                bag = fare[0].get("baggage", {})
                if bag:
                    qty = bag.get("checked_bags_quantity", 0)
                    return qty > 0 if filters.has_checked_baggage else qty == 0
            return not filters.has_checked_baggage
        filtered = [o for o in filtered if has_baggage(o)]
    
    if filters.departure_time_min:
        min_minutes = time_to_minutes(filters.departure_time_min)
        filtered = [o for o in filtered if get_departure_minutes(o) >= min_minutes]
    
    if filters.departure_time_max:
        max_minutes = time_to_minutes(filters.departure_time_max)
        filtered = [o for o in filtered if get_departure_minutes(o) <= max_minutes]
    
    if filters.arrival_time_min:
        min_minutes = time_to_minutes(filters.arrival_time_min)
        filtered = [o for o in filtered if get_arrival_minutes(o) >= min_minutes]
    
    if filters.arrival_time_max:
        max_minutes = time_to_minutes(filters.arrival_time_max)
        filtered = [o for o in filtered if get_arrival_minutes(o) <= max_minutes]
    
    # Sort
    reverse = filters.sort_order == "desc"
    if filters.sort_by == "price":
        filtered.sort(key=lambda o: float(o.get("price", 9999)), reverse=reverse)
    elif filters.sort_by == "duration":
        filtered.sort(key=lambda o: parse_duration(o.get("total_duration", "")), reverse=reverse)
    elif filters.sort_by == "departure":
        filtered.sort(key=get_departure_minutes, reverse=reverse)
    
    # Paginate
    total = len(filtered)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    start = (page - 1) * page_size
    end = start + page_size
    
    # Get unique airlines for filter options
    all_airlines = set()
    for o in all_offers:
        if o.get("validating_airline"):
            all_airlines.add(o["validating_airline"])
    
    return {
        "status": "active",
        "offers": filtered[start:end],
        "page": page,
        "page_size": page_size,
        "total_offers": total,
        "total_pages": total_pages,
        "has_more": page < total_pages,
        "filter_options": {
            "airlines": sorted(list(all_airlines)),
            "price_range": {
                "min": min((float(o.get("price", 0)) for o in all_offers), default=0),
                "max": max((float(o.get("price", 0)) for o in all_offers), default=0)
            }
        }
    }


@app.delete("/cache/{trip_id}")
async def clear_cache_entry(trip_id: str):
    """Clear cached results for a trip."""
    deleted = flight_cache.delete(trip_id)
    return {"deleted": deleted, "trip_id": trip_id}


# ==========================================
# FILTER ENDPOINT - Server-side filtering
# ==========================================

from pydantic import BaseModel
from typing import Optional, List

class FlightFilters(BaseModel):
    """Filters to apply to cached flight results."""
    max_price: Optional[float] = None
    max_duration_minutes: Optional[int] = None
    direct_only: bool = False
    airlines: Optional[List[str]] = None  # Carrier codes
    has_checked_baggage: Optional[bool] = None
    departure_time_min: Optional[str] = None  # HH:MM format
    departure_time_max: Optional[str] = None  # HH:MM format
    arrival_time_min: Optional[str] = None
    arrival_time_max: Optional[str] = None
    sort_by: str = "price"  # price, duration, departure
    sort_order: str = "asc"  # asc, desc


@app.post("/cache/{trip_id}/filter")
async def filter_cached_results(trip_id: str, filters: FlightFilters, page: int = 1, page_size: int = 10):
    """
    Filter and sort cached flight results server-side.
    This avoids API calls and provides fast filtering.
    """
    from datetime import datetime
    
    all_offers = flight_cache.get(trip_id)
    if not all_offers:
        raise HTTPException(status_code=404, detail="No cached results for this trip")
    
    filtered = all_offers.copy()
    
    # Parse duration string (PT1H25M) to minutes
    def parse_duration(dur: str) -> int:
        if not dur:
            return 9999
        import re
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', dur)
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            return hours * 60 + minutes
        return 9999
    
    # Parse time string (HH:MM) to minutes from midnight
    def time_to_minutes(time_str: str) -> int:
        if not time_str:
            return 0
        try:
            parts = time_str.split(":")
            return int(parts[0]) * 60 + int(parts[1])
        except:
            return 0
    
    # Get departure time from ISO datetime
    def get_departure_minutes(offer: dict) -> int:
        try:
            segments = offer.get("outbound_segments", [])
            if segments:
                dt = datetime.fromisoformat(segments[0].get("departure_time", "").replace("Z", "+00:00"))
                return dt.hour * 60 + dt.minute
        except:
            pass
        return 0
    
    # Get arrival time from ISO datetime
    def get_arrival_minutes(offer: dict) -> int:
        try:
            segments = offer.get("outbound_segments", [])
            if segments:
                dt = datetime.fromisoformat(segments[-1].get("arrival_time", "").replace("Z", "+00:00"))
                return dt.hour * 60 + dt.minute
        except:
            pass
        return 0
    
    # Apply filters
    if filters.max_price is not None:
        filtered = [o for o in filtered if float(o.get("price", 9999)) <= filters.max_price]
    
    if filters.max_duration_minutes is not None:
        filtered = [o for o in filtered if parse_duration(o.get("total_duration", "")) <= filters.max_duration_minutes]
    
    if filters.direct_only:
        filtered = [o for o in filtered if o.get("stops", 99) == 0]
    
    if filters.airlines:
        airline_set = set(a.upper() for a in filters.airlines)
        filtered = [o for o in filtered if o.get("validating_airline", "").upper() in airline_set]
    
    if filters.has_checked_baggage is not None:
        def has_baggage(offer):
            fare = offer.get("fare_details", [{}])
            if fare and len(fare) > 0:
                bag = fare[0].get("baggage", {})
                if bag:
                    qty = bag.get("checked_bags_quantity", 0)
                    return qty > 0 if filters.has_checked_baggage else qty == 0
            return not filters.has_checked_baggage
        filtered = [o for o in filtered if has_baggage(o)]
    
    if filters.departure_time_min:
        min_minutes = time_to_minutes(filters.departure_time_min)
        filtered = [o for o in filtered if get_departure_minutes(o) >= min_minutes]
    
    if filters.departure_time_max:
        max_minutes = time_to_minutes(filters.departure_time_max)
        filtered = [o for o in filtered if get_departure_minutes(o) <= max_minutes]
    
    if filters.arrival_time_min:
        min_minutes = time_to_minutes(filters.arrival_time_min)
        filtered = [o for o in filtered if get_arrival_minutes(o) >= min_minutes]
    
    if filters.arrival_time_max:
        max_minutes = time_to_minutes(filters.arrival_time_max)
        filtered = [o for o in filtered if get_arrival_minutes(o) <= max_minutes]
    
    # Sort
    reverse = filters.sort_order == "desc"
    if filters.sort_by == "price":
        filtered.sort(key=lambda o: float(o.get("price", 9999)), reverse=reverse)
    elif filters.sort_by == "duration":
        filtered.sort(key=lambda o: parse_duration(o.get("total_duration", "")), reverse=reverse)
    elif filters.sort_by == "departure":
        filtered.sort(key=get_departure_minutes, reverse=reverse)
    
    # Paginate
    total = len(filtered)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    start = (page - 1) * page_size
    end = start + page_size
    
    # Get unique airlines for filter options
    all_airlines = set()
    for o in all_offers:
        if o.get("validating_airline"):
            all_airlines.add(o["validating_airline"])
    
    return {
        "offers": filtered[start:end],
        "page": page,
        "page_size": page_size,
        "total_offers": total,
        "total_pages": total_pages,
        "has_more": page < total_pages,
        "filter_options": {
            "airlines": sorted(list(all_airlines)),
            "price_range": {
                "min": min((float(o.get("price", 0)) for o in all_offers), default=0),
                "max": max((float(o.get("price", 0)) for o in all_offers), default=0)
            }
        }
    }


# ==========================================
# IATA RESOLVER ENDPOINTS
# ==========================================

from iata_resolver import get_airport_info, batch_resolve_airports, get_city_country_label

@app.get("/iata/{code}")
async def resolve_iata_code(code: str):
    """Resolve a single IATA code to city/country."""
    info = get_airport_info(code)
    if info:
        return {"code": code.upper(), **info}
    return {"code": code.upper(), "city": code.upper(), "country": "", "name": ""}


@app.post("/iata/batch")
async def resolve_iata_batch(codes: List[str]):
    """Resolve multiple IATA codes at once."""
    return batch_resolve_airports(codes)


@app.get("/logs/stream")
async def stream_logs():
    """Server-Sent Events endpoint for real-time logs."""
    async def event_generator():
        queue = await agent_logger.subscribe()
        try:
            while True:
                try:
                    log = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {
                        "event": "log",
                        "data": json.dumps(log)
                    }
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {
                        "event": "ping",
                        "data": "{}"
                    }
        finally:
            agent_logger.unsubscribe(queue)
    
    return EventSourceResponse(event_generator())


@app.get("/logs")
async def get_logs(count: int = 100):
    """Get recent logs."""
    return {"logs": agent_logger.get_recent_logs(count)}


@app.get("/results/{chat_id}")
async def get_result(chat_id: str):
    """Get processing result for a specific chat."""
    if chat_id in recent_results:
        return recent_results[chat_id]
    raise HTTPException(status_code=404, detail="Result not found")


@app.get("/", response_class=HTMLResponse)
async def monitoring_ui():
    """Serve the monitoring dashboard UI."""
    return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voaya Agent Monitor</title>
    <style>
        :root {
            --bg-primary: #0f0f23;
            --bg-secondary: #1a1a2e;
            --bg-card: #16213e;
            --accent: #00d9ff;
            --accent-secondary: #7b2cbf;
            --text-primary: #e0e0e0;
            --text-secondary: #a0a0a0;
            --success: #00ff88;
            --warning: #ffcc00;
            --error: #ff4757;
            --info: #3498db;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: linear-gradient(135deg, var(--bg-secondary), var(--bg-card));
            padding: 20px 30px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid rgba(0, 217, 255, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        header h1 {
            font-size: 1.8rem;
            background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid var(--success);
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 20px;
        }
        
        @media (max-width: 1024px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
        
        .card {
            background: var(--bg-card);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }
        
        .card-header {
            padding: 15px 20px;
            background: var(--bg-secondary);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .card-header h2 {
            font-size: 1.1rem;
            font-weight: 500;
        }
        
        .logs-container {
            height: 600px;
            overflow-y: auto;
            padding: 10px;
            font-family: 'Cascadia Code', 'Fira Code', monospace;
            font-size: 0.85rem;
        }
        
        .log-entry {
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.2);
            border-left: 3px solid var(--info);
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .log-entry.info { border-left-color: var(--info); }
        .log-entry.success { border-left-color: var(--success); }
        .log-entry.warning { border-left-color: var(--warning); }
        .log-entry.error { border-left-color: var(--error); }
        
        .log-timestamp {
            color: var(--text-secondary);
            font-size: 0.75rem;
        }
        
        .log-source {
            display: inline-block;
            padding: 2px 6px;
            background: rgba(0, 217, 255, 0.2);
            border-radius: 4px;
            font-size: 0.75rem;
            color: var(--accent);
            margin: 0 8px;
        }
        
        .log-message {
            margin-top: 4px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            padding: 20px;
        }
        
        .stat-card {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--accent);
        }
        
        .stat-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-top: 4px;
        }
        
        .recent-results {
            max-height: 300px;
            overflow-y: auto;
            padding: 15px;
        }
        
        .result-item {
            padding: 12px;
            margin: 8px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .result-route {
            font-weight: 600;
            color: var(--accent);
        }
        
        .result-price {
            color: var(--success);
            font-weight: 600;
        }
        
        .result-details {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .no-logs {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
        }
        
        .clear-btn {
            padding: 6px 12px;
            background: rgba(255, 71, 87, 0.2);
            border: 1px solid var(--error);
            color: var(--error);
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s;
        }
        
        .clear-btn:hover {
            background: rgba(255, 71, 87, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🛫 Voaya Agent Monitor</h1>
            <div class="status-badge">
                <div class="status-dot"></div>
                <span id="connection-status">Conectando...</span>
            </div>
        </header>
        
        <div class="grid">
            <div class="card">
                <div class="card-header">
                    <h2>📋 Logs en Tiempo Real</h2>
                    <button class="clear-btn" onclick="clearLogs()">Limpiar</button>
                </div>
                <div class="logs-container" id="logs">
                    <div class="no-logs">Esperando logs...</div>
                </div>
            </div>
            
            <div>
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-header">
                        <h2>📊 Estadísticas</h2>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="total-processed">0</div>
                            <div class="stat-label">Chats Procesados</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="flights-found">0</div>
                            <div class="stat-label">Vuelos Encontrados</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="avg-time">0ms</div>
                            <div class="stat-label">Tiempo Promedio</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="success-rate">100%</div>
                            <div class="stat-label">Tasa de Éxito</div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h2>✈️ Últimos Resultados</h2>
                    </div>
                    <div class="recent-results" id="results">
                        <div class="no-logs">Sin resultados aún...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let eventSource = null;
        let stats = {
            processed: 0,
            flightsFound: 0,
            totalTime: 0,
            successes: 0
        };
        
        function connectSSE() {
            eventSource = new EventSource('/logs/stream');
            
            eventSource.onopen = () => {
                document.getElementById('connection-status').textContent = 'Conectado';
            };
            
            eventSource.addEventListener('log', (event) => {
                const log = JSON.parse(event.data);
                addLog(log);
                updateFromLog(log);
            });
            
            eventSource.onerror = () => {
                document.getElementById('connection-status').textContent = 'Reconectando...';
                setTimeout(connectSSE, 3000);
            };
        }
        
        function addLog(log) {
            const container = document.getElementById('logs');
            const noLogs = container.querySelector('.no-logs');
            if (noLogs) noLogs.remove();
            
            const entry = document.createElement('div');
            entry.className = `log-entry ${log.level}`;
            entry.innerHTML = `
                <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
                <span class="log-source">${log.source}</span>
                <div class="log-message">${escapeHtml(log.message)}</div>
            `;
            
            container.insertBefore(entry, container.firstChild);
            
            // Keep only last 200 logs
            while (container.children.length > 200) {
                container.removeChild(container.lastChild);
            }
        }
        
        function updateFromLog(log) {
            if (log.source === 'graph' && log.message.includes('Agent completed')) {
                stats.processed++;
                const match = log.message.match(/(\\d+)ms/);
                if (match) {
                    stats.totalTime += parseInt(match[1]);
                }
                stats.successes++;
                updateStats();
            }
            
            if (log.source === 'flight_search' && log.message.includes('Found')) {
                const match = log.message.match(/Found (\\d+)/);
                if (match) {
                    stats.flightsFound += parseInt(match[1]);
                    updateStats();
                }
            }
        }
        
        function updateStats() {
            document.getElementById('total-processed').textContent = stats.processed;
            document.getElementById('flights-found').textContent = stats.flightsFound;
            document.getElementById('avg-time').textContent = 
                stats.processed > 0 ? Math.round(stats.totalTime / stats.processed) + 'ms' : '0ms';
            document.getElementById('success-rate').textContent = 
                stats.processed > 0 ? Math.round((stats.successes / stats.processed) * 100) + '%' : '100%';
        }
        
        function clearLogs() {
            const container = document.getElementById('logs');
            container.innerHTML = '<div class="no-logs">Logs limpiados...</div>';
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Load initial logs
        fetch('/logs?count=50')
            .then(res => res.json())
            .then(data => {
                data.logs.reverse().forEach(addLog);
            });
        
        connectSSE();
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
