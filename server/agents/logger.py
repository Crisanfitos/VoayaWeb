"""
Logger with real-time log streaming for the monitoring UI.
"""
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import deque
import json


class AgentLogger:
    """Thread-safe logger that stores logs for streaming to UI."""
    
    def __init__(self, max_logs: int = 500):
        self.logs: deque = deque(maxlen=max_logs)
        self.subscribers: List[asyncio.Queue] = []
        self._lock = asyncio.Lock()
    
    def log(self, source: str, message: str, level: str = "info", data: Optional[Dict] = None):
        """Add a log entry."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "source": source,
            "level": level,
            "message": message,
            "data": data
        }
        self.logs.append(entry)
        
        # Print to console
        level_color = {
            "info": "\033[94m",    # Blue
            "success": "\033[92m", # Green
            "warning": "\033[93m", # Yellow
            "error": "\033[91m",   # Red
        }
        reset = "\033[0m"
        color = level_color.get(level, "")
        print(f"{color}[{entry['timestamp']}] [{source}] {message}{reset}")
        
        # Notify subscribers (non-blocking)
        for queue in self.subscribers:
            try:
                queue.put_nowait(entry)
            except asyncio.QueueFull:
                pass  # Skip if queue is full
    
    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to real-time log updates."""
        queue = asyncio.Queue(maxsize=100)
        self.subscribers.append(queue)
        return queue
    
    def unsubscribe(self, queue: asyncio.Queue):
        """Unsubscribe from log updates."""
        if queue in self.subscribers:
            self.subscribers.remove(queue)
    
    def get_recent_logs(self, count: int = 100) -> List[Dict[str, Any]]:
        """Get recent log entries."""
        logs_list = list(self.logs)
        return logs_list[-count:] if len(logs_list) > count else logs_list
    
    def get_logs_for_chat(self, chat_id: str) -> List[Dict[str, Any]]:
        """Get logs related to a specific chat."""
        return [
            log for log in self.logs 
            if log.get("data", {}).get("chat_id") == chat_id
        ]


# Global logger instance
agent_logger = AgentLogger()
