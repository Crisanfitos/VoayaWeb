"""
LangGraph orchestrator for the flight search agent system.
Defines the graph with extractor and flight search nodes.
"""
import time
from typing import TypedDict, Annotated, Optional
from langgraph.graph import StateGraph, START, END
from schemas import (
    ExtractedTravelData, 
    FlightSearchResult, 
    ChatMessage, 
    AgentResponse
)
from extractor import extract_travel_data
from amadeus_client import search_flights
from logger import agent_logger


class AgentState(TypedDict):
    """State that flows through the agent graph."""
    chat_id: str
    messages: list[ChatMessage]
    extracted_data: Optional[ExtractedTravelData]
    flight_results: Optional[FlightSearchResult]
    logs: list[str]
    start_time: float


def extractor_node(state: AgentState) -> dict:
    """Node that extracts travel data from chat messages."""
    agent_logger.log(
        "graph", 
        "Entering EXTRACTOR node", 
        data={"chat_id": state["chat_id"]}
    )
    
    extracted = extract_travel_data(state["messages"], state["chat_id"])
    
    log_msg = f"Extracted: {extracted.origin} → {extracted.destination}"
    
    return {
        "extracted_data": extracted,
        "logs": state["logs"] + [log_msg]
    }


def should_search_flights(state: AgentState) -> str:
    """Decide if we should search for flights based on extracted data."""
    data = state.get("extracted_data")
    
    if not data:
        agent_logger.log("graph", "No data extracted, ending", level="warning")
        return END
    
    # Check if we have minimum required fields
    if not data.origin or not data.destination or not data.departure_date:
        agent_logger.log(
            "graph", 
            f"Missing required fields: {data.missing_fields}", 
            level="warning"
        )
        return END
    
    agent_logger.log("graph", "Data complete, proceeding to flight search")
    return "search_flights"


def flight_search_node(state: AgentState) -> dict:
    """Node that searches for flights using Amadeus API."""
    agent_logger.log(
        "graph", 
        "Entering FLIGHT_SEARCH node",
        data={"chat_id": state["chat_id"]}
    )
    
    extracted = state["extracted_data"]
    results = search_flights(extracted)
    
    log_msg = f"Found {results.total_offers} flights" if results.success else f"Search failed: {results.error_message}"
    
    return {
        "flight_results": results,
        "logs": state["logs"] + [log_msg]
    }


def build_graph() -> StateGraph:
    """Build the LangGraph agent graph."""
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("extractor", extractor_node)
    graph.add_node("search_flights", flight_search_node)
    
    # Add edges
    graph.add_edge(START, "extractor")
    graph.add_conditional_edges(
        "extractor",
        should_search_flights,
        {
            "search_flights": "search_flights",
            END: END
        }
    )
    graph.add_edge("search_flights", END)
    
    return graph.compile()


# Global compiled graph
agent_graph = build_graph()


async def run_agent(chat_id: str, messages: list[ChatMessage]) -> AgentResponse:
    """
    Run the agent graph on a chat.
    
    Args:
        chat_id: ID of the chat being processed
        messages: List of chat messages
        
    Returns:
        AgentResponse with results
    """
    agent_logger.log("graph", f"Starting agent for chat {chat_id}", level="info", data={"chat_id": chat_id})
    
    start_time = time.time()
    
    # Initial state
    initial_state = {
        "chat_id": chat_id,
        "messages": messages,
        "extracted_data": None,
        "flight_results": None,
        "logs": [],
        "start_time": start_time
    }
    
    try:
        # Run the graph
        final_state = agent_graph.invoke(initial_state)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        agent_logger.log(
            "graph", 
            f"Agent completed in {processing_time}ms",
            level="success",
            data={"chat_id": chat_id}
        )
        
        return AgentResponse(
            chatId=chat_id,
            extracted_data=final_state.get("extracted_data"),
            flight_results=final_state.get("flight_results"),
            processing_time_ms=processing_time,
            logs=final_state.get("logs", [])
        )
        
    except Exception as e:
        agent_logger.log("graph", f"Agent error: {e}", level="error", data={"chat_id": chat_id})
        processing_time = int((time.time() - start_time) * 1000)
        
        return AgentResponse(
            chatId=chat_id,
            processing_time_ms=processing_time,
            logs=[f"Error: {str(e)}"]
        )
